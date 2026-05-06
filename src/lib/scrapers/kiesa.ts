import * as cheerio from 'cheerio'
import { createHash } from 'crypto'
import type { OpportunityInput, OpportunityType } from './types'
import { extractFromPdf, fetchTextTolerant, mergeExtractedFields, enrichmentEnvFor } from '../extractors/claude-pdf'

const BASE_URL = 'https://kiesa.rks-gov.net'
const LISTING_PATH = '/page.aspx?id=2,134'
const USER_AGENT = 'BusinessHubKosova/1.0 (+https://kosovabusinesses.aiaohub.com)'

const SKIP_PATTERNS = [
  /anulim/i, /anulohet/i, /shtyhet/i,
  /sesion informues/i, /information session/i,
]
const FAIR_PATTERNS: RegExp[] = []
const STAND_CALL_PATTERNS = [
  /pjesemarrje/i, /pjesëmarrje/i,
  /stenden/i, /stendën/i, /stenda/i,
  /panairin/i, /panair/i,
]
const GRANT_PATTERNS = [
  /public call/i, /thirrje publike/i, /thirrje/i,
  /financial support/i, /perkrahje financiare/i, /përkrahje financiare/i,
  /grant/i, /skeme grante/i, /skemë grante/i,
  /msme/i, /nmvm/i,
]
const REGULATION_PATTERNS = [
  /rregullore/i, /vendim/i, /udhezim administrativ/i, /udhëzim administrativ/i,
]

// Items that announce results / decisions / lists rather than open calls.
// We skip enrichment for these because the PDF won't contain a deadline or amount.
const RESULT_PATTERNS = [
  /lista/i, /perfitues/i, /përfitues/i,
  /vendimi/i, /rezultat/i, /preliminare/i,
]

export type KiesaClassification = OpportunityType | 'SKIP'

export function classifyKiesaTitle(title: string): KiesaClassification {
  if (SKIP_PATTERNS.some((r) => r.test(title))) return 'SKIP'
  // Result / winner-list announcements MUST be skipped - they pollute the
  // grants list with already-decided items that have no deadline or amount.
  if (RESULT_PATTERNS.some((r) => r.test(title))) return 'SKIP'
  if (REGULATION_PATTERNS.some((r) => r.test(title))) return 'REGULATION'
  if (STAND_CALL_PATTERNS.some((r) => r.test(title))) return 'REGULATION'
  if (FAIR_PATTERNS.some((r) => r.test(title))) return 'FAIR'
  if (GRANT_PATTERNS.some((r) => r.test(title))) return 'GRANT'
  return 'SKIP'
}

function externalIdFor(itemId: string): string {
  return createHash('sha1').update(`KIESA:${itemId}`).digest('hex')
}

function absoluteUrl(href: string): string {
  if (/^https?:\/\//i.test(href)) return href
  if (href.startsWith('/')) return `${BASE_URL}${href}`
  return `${BASE_URL}/${href}`
}

const ITEM_ID_RE = /id=2,5,(\d+)/i
const PUBDATE_RE = /(\d{1,2})\/(\d{1,2})\/(\d{4})/

function parsePubDate(text: string): Date | undefined {
  const m = text.match(PUBDATE_RE)
  if (!m) return undefined
  const [, dd, mm, yyyy] = m
  const d = new Date(`${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}T00:00:00Z`)
  return isNaN(d.getTime()) ? undefined : d
}

export interface ScrapeKiesaOptions {
  fetchImpl?: typeof fetch
  baseUrl?: string
  /** When true, fetches each open-call detail page + PDF and asks Claude
   *  to extract structured fields (deadline, amount, eligibility, sectors).
   *  Defaults to env var KIESA_ENRICH === 'true'. */
  enrich?: boolean
  /** Cap on enrichment calls per scrape run, to bound Anthropic spend.
   *  Defaults to env var KIESA_ENRICH_MAX (number) or 5. */
  maxEnrich?: number
}

export async function scrapeKiesa(opts: ScrapeKiesaOptions = {}): Promise<OpportunityInput[]> {
  const base = opts.baseUrl ?? BASE_URL

  // KIESA's IIS server emits HTTP/1.1 headers with leading whitespace that
  // undici (global fetch) intermittently rejects. fetchTextTolerant uses
  // node:https with insecureHTTPParser to bypass the strict parser.
  const html = opts.fetchImpl
    ? await opts.fetchImpl(`${base}${LISTING_PATH}`, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
      }).then((r) => {
        if (!r.ok) throw new Error(`KIESA listing fetch failed: HTTP ${r.status}`)
        return r.text()
      })
    : await fetchTextTolerant(`${base}${LISTING_PATH}`)

  const $ = cheerio.load(html)
  const items: OpportunityInput[] = []

  $('article.icon-teaser').each((_, el) => {
    const $el = $(el)
    const $link = $el.find('h4 a').first()
    const title = $link.text().trim().replace(/\s+/g, ' ')
    const href = $link.attr('href') ?? ''
    const idMatch = href.match(ITEM_ID_RE)
    if (!title || !idMatch) return

    const itemId = idMatch[1]
    const classification = classifyKiesaTitle(title)
    if (classification === 'SKIP') return

    items.push({
      externalId: externalIdFor(itemId),
      type: classification,
      title,
      description: `Detajet e plota (afati, vlera, eligibility) gjenden në dokumentet PDF në faqen origjinale.`,
      sourceUrl: absoluteUrl(href),
      legacy: {
        provider: 'KIESA',
        country: 'Kosovo',
        sectors: [],
        tags: ['kiesa', classification.toLowerCase()],
      },
    })
  })

  const env = enrichmentEnvFor('KIESA')
  const enrich = opts.enrich ?? env.enabled
  if (enrich) {
    const maxEnrich = opts.maxEnrich ?? env.max
    let count = 0
    for (const item of items) {
      if (count >= maxEnrich) break
      if (item.type !== 'GRANT') continue
      if (RESULT_PATTERNS.some((r) => r.test(item.title))) continue
      try {
        await enrichKiesaItem(item)
        count++
      } catch (err) {
        console.warn(`[kiesa] enrichment failed for ${item.externalId}:`, (err as Error).message)
      }
    }
  }

  return items
}

/**
 * Mutates `item` in place. Fetches the KIESA detail page, finds the first PDF
 * link (skipping declarations and forms), extracts structured fields with
 * Claude, and merges them into the OpportunityInput.
 */
export async function enrichKiesaItem(item: OpportunityInput): Promise<void> {
  const html = await fetchTextTolerant(item.sourceUrl)
  const $ = cheerio.load(html)
  const pdfLinks: string[] = []
  $('a[href$=".pdf"]').each((_, a) => {
    const h = $(a).attr('href')
    if (!h) return
    pdfLinks.push(absoluteUrl(h))
  })
  if (pdfLinks.length === 0) return
  // Prefer the main thirrje PDF over annex declarations / forms.
  // KIESA detail pages typically list the main call first.
  const extracted = await extractFromPdf({ pdfUrl: pdfLinks[0], context: item.title })
  mergeExtractedFields(item, extracted)
}

/**
 * Pulls the publication date from a KIESA detail page if needed.
 * Not used by the listing-only scraper; retained for Phase 12.
 */
export async function fetchKiesaPubDate(detailUrl: string, opts: ScrapeKiesaOptions = {}): Promise<Date | undefined> {
  const fetchFn = opts.fetchImpl ?? fetch
  const res = await fetchFn(detailUrl, { headers: { 'User-Agent': USER_AGENT } })
  if (!res.ok) return undefined
  const html = await res.text()
  const $ = cheerio.load(html)
  const main = $('#main.main-content').text()
  return parsePubDate(main)
}

