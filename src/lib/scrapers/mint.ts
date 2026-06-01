import * as cheerio from 'cheerio'
import { createHash } from 'crypto'
import type { OpportunityInput, OpportunityType } from './types'
import { extractFromDocument, fetchTextTolerant, mergeExtractedFields, enrichmentEnvFor } from '../extractors/claude-pdf'

const BASE_URL = 'https://mint.rks-gov.net'
const LISTING_PATH = '/'
const USER_AGENT =
  'Mozilla/5.0 (BusinessHubKosova/1.0; +https://kosovabusinesses.aiaohub.com)'

const SKIP_TITLE = [
  /konkurs/i, /sekretar i p[eë]rgjithsh[eë]m/i, /kryeinspektor/i,
  /udh[eë]zues p[eë]r aplikim/i, /projekt propozimi/i,
  /vendim/i, /raport/i, /strategji/i, /rregullore/i,
]
const KEEP_TITLE = [
  /thirrje publike/i,
  /thirrje p[eë]r/i,
  /p[eë]rkrahjen financiare/i,
  /grant/i,
  /skema?/i,
  /fond[i]?\s+kosovar/i,
  /nmvm/i,
]

const RESULT_PATTERNS = [
  /lista/i, /perfitues/i, /përfitues/i,
  /vendimi/i, /rezultat/i, /preliminare/i,
]

function classify(title: string): OpportunityType | 'SKIP' {
  if (SKIP_TITLE.some((r) => r.test(title))) return 'SKIP'
  if (!KEEP_TITLE.some((r) => r.test(title))) return 'SKIP'
  return 'GRANT'
}

function externalIdFor(href: string): string {
  const m = href.match(/([0-9A-Fa-f-]{36})/) // GUID-ish
  const key = m ? m[1] : href
  return createHash('sha1').update(`MINT:${key}`).digest('hex')
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export interface ScrapeMintOptions {
  fetchImpl?: typeof fetch
  baseUrl?: string
  /** When true, downloads each call's PDF and asks Claude to extract
   *  structured fields. Defaults to env MINT_ENRICH === 'true'. */
  enrich?: boolean
  /** Cap on enrichment calls per scrape run. Defaults to env MINT_ENRICH_MAX or 5. */
  maxEnrich?: number
}

export async function scrapeMint(opts: ScrapeMintOptions = {}): Promise<OpportunityInput[]> {
  const base = opts.baseUrl ?? BASE_URL

  // MINT shares the same IIS server quirk as KIESA (intermittent malformed
  // HTTP/1.1 headers that undici rejects). Use the tolerant fetcher unless
  // the caller injects their own.
  const html = opts.fetchImpl
    ? await opts.fetchImpl(`${base}${LISTING_PATH}`, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
      }).then((r) => {
        if (!r.ok) throw new Error(`MINT listing fetch failed: HTTP ${r.status}`)
        return r.text()
      })
    : await fetchTextTolerant(`${base}${LISTING_PATH}`)

  const $ = cheerio.load(html)
  const seen = new Set<string>()
  const items: OpportunityInput[] = []

  $('a[href]').each((_, el) => {
    const $a = $(el)
    const hrefRaw = ($a.attr('href') ?? '').trim()
    if (!hrefRaw) return
    const lower = hrefRaw.split('?')[0].toLowerCase()
    if (!(lower.endsWith('.pdf') || lower.endsWith('.docx'))) return
    const href = hrefRaw.startsWith('/') ? `${base}${hrefRaw}` : hrefRaw
    if (seen.has(href)) return

    const title = decodeEntities($a.text())
    if (!title || title.length < 12) return

    const c = classify(title)
    if (c === 'SKIP') return

    seen.add(href)
    items.push({
      externalId: externalIdFor(href),
      type: c,
      title,
      description:
        'Thirrje publike e Ministrisë së Industrisë, Ndërmarrësisë dhe Tregtisë. Detajet e plota (afati, vlera, kriteret) gjenden në dokumentin zyrtar të publikuar.',
      sourceUrl: href,
      legacy: {
        provider: 'Ministria e Industrisë, Ndërmarrësisë dhe Tregtisë (MINT)',
        country: 'Kosovo',
        sectors: [],
        tags: ['mint', c.toLowerCase(), 'qeveria'],
      },
    })
  })

  const env = enrichmentEnvFor('MINT')
  const enrich = opts.enrich ?? env.enabled
  if (enrich) {
    const maxEnrich = opts.maxEnrich ?? env.max
    let count = 0
    for (const item of items) {
      if (count >= maxEnrich) break
      if (item.type !== 'GRANT') continue
      if (RESULT_PATTERNS.some((r) => r.test(item.title))) continue
      try {
        await enrichMintItem(item)
        count++
      } catch (err) {
        console.warn(`[mint] enrichment failed for ${item.externalId}:`, (err as Error).message)
      }
    }
  }

  return items
}

/**
 * Mutates `item` in place. MINT items already have a direct PDF URL in
 * `sourceUrl` (the listing links straight to PDFs), so no detail-page step.
 */
export async function enrichMintItem(item: OpportunityInput): Promise<void> {
  const extracted = await extractFromDocument({ pdfUrl: item.sourceUrl, context: item.title })
  mergeExtractedFields(item, extracted)
}
