import * as cheerio from 'cheerio'
import { createHash } from 'crypto'
import type { OpportunityInput, OpportunityType } from './types'
import { extractFromPdf, fetchTextTolerant, mergeExtractedFields, enrichmentEnvFor } from '../extractors/claude-pdf'

// KOSME = SME-support unit of Ministria e Ekonomisë (ME). The agency does not
// publish at a separate domain; calls go through me.rks-gov.net. We filter for
// SME-relevant calls using NMVM / NVM keywords plus the standard "Thirrje
// publike" classifier.
const BASE_URL = 'https://me.rks-gov.net'
const LISTING_PATH = '/'
const USER_AGENT =
  'Mozilla/5.0 (BusinessHubKosova/1.0; +https://kosovabusinesses.aiaohub.com)'

const SKIP_TITLE = [
  /konkurs\b/i,
  /sekretar i p[eë]rgjithsh[eë]m/i,
  /kryeinspektor/i,
  /udh[eë]zues p[eë]r aplikim/i,
  /projekt[ -]propozim/i,
  /vendim\b/i,
  /raport\b/i,
  /strategji/i,
  /rregullore/i,
  /lista [eë] p[eë]rfitues/i,
  /rezultat/i,
]

const KEEP_TITLE = [
  /thirrje publike/i,
  /thirrje p[eë]r/i,
  /p[eë]rkrahjen financiare/i,
  /skem[ae]\s+p[eë]r/i,
  /grant/i,
  /fond[i]?\s+kosovar/i,
  /nmvm/i,
  /\bnvm[s]?\b/i,
  /subvencionim/i,
]

// Items that mention NMVM/NVM are guaranteed SME-relevant; other "thirrje
// publike" items (consumer subsidies, etc.) we still include but flag with
// `non_sme` tag so the UI / admin can filter.
const SME_HINTS = [/nmvm/i, /\bnvm[s]?\b/i, /nd[eë]rmarrje/i, /biznes/i]

function classify(title: string): OpportunityType | 'SKIP' {
  if (SKIP_TITLE.some((r) => r.test(title))) return 'SKIP'
  if (!KEEP_TITLE.some((r) => r.test(title))) return 'SKIP'
  return 'GRANT'
}

function isSme(title: string): boolean {
  return SME_HINTS.some((r) => r.test(title))
}

function externalIdFor(href: string): string {
  return createHash('sha1').update(`KOSME:${href}`).digest('hex')
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export interface ScrapeKosmeOptions {
  fetchImpl?: typeof fetch
  baseUrl?: string
  /** Enables Claude PDF extraction for deadline/value enrichment. */
  enrich?: boolean
  maxEnrich?: number
}

export async function scrapeKosme(opts: ScrapeKosmeOptions = {}): Promise<OpportunityInput[]> {
  const base = opts.baseUrl ?? BASE_URL

  const html = opts.fetchImpl
    ? await opts.fetchImpl(`${base}${LISTING_PATH}`, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
      }).then((r) => {
        if (!r.ok) throw new Error(`KOSME listing fetch failed: HTTP ${r.status}`)
        return r.text()
      })
    : await fetchTextTolerant(`${base}${LISTING_PATH}`)

  const $ = cheerio.load(html)
  const seen = new Set<string>()
  const items: OpportunityInput[] = []

  $('a[href*=".pdf"]').each((_, el) => {
    const $a = $(el)
    const hrefRaw = ($a.attr('href') ?? '').trim()
    if (!hrefRaw) return
    const href = hrefRaw.startsWith('/') ? `${base}${hrefRaw}` : hrefRaw
    if (seen.has(href)) return

    const title = decodeEntities($a.text())
    if (!title || title.length < 12) return

    const c = classify(title)
    if (c === 'SKIP') return

    seen.add(href)
    const sme = isSme(title)
    items.push({
      externalId: externalIdFor(href),
      type: c,
      title,
      description:
        'Thirrje publike e Ministrisë së Ekonomisë (KOSME / NMVM). Detajet e plota gjenden në dokumentin PDF.',
      sourceUrl: href,
      legacy: {
        provider: 'Ministria e Ekonomisë (KOSME)',
        country: 'Kosovo',
        sectors: [],
        tags: ['kosme', 'me', c.toLowerCase(), 'qeveria', sme ? 'sme' : 'non_sme'],
      },
    })
  })

  const env = enrichmentEnvFor('KOSME')
  const enrich = opts.enrich ?? env.enabled
  if (enrich) {
    const maxEnrich = opts.maxEnrich ?? env.max
    let count = 0
    for (const item of items) {
      if (count >= maxEnrich) break
      if (item.type !== 'GRANT') continue
      try {
        const extracted = await extractFromPdf({ pdfUrl: item.sourceUrl, context: item.title })
        mergeExtractedFields(item, extracted)
        count++
      } catch (err) {
        console.warn(`[kosme] enrichment failed for ${item.externalId}:`, (err as Error).message)
      }
    }
  }

  return items
}
