import * as cheerio from 'cheerio'
import { createHash } from 'crypto'
import type { OpportunityInput, OpportunityType } from './types'

const BASE_URL = 'https://kiesa.rks-gov.net'
const LISTING_PATH = '/page.aspx?id=2,134'
const USER_AGENT = 'BusinessHubKosova/1.0 (+https://kosovabusinesses.aiaohub.com)'

const SKIP_PATTERNS = [
  /anulim/i, /anulohet/i, /shtyhet/i,
  /sesion informues/i, /information session/i,
]
const FAIR_PATTERNS: RegExp[] = [
  // Currently disabled: KIESA only publishes state-stand application calls,
  // not actual fair listings. Real fair calendar lives in seed-fairs-real.js.
]
// State-stand application calls (e.g. "Thirrje publike per aplikim ne stenden")
// These are administrative notices, NOT grants and NOT the fairs themselves.
// Stored as REGULATION so they remain tracked without polluting grants/fairs UIs.
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

export type KiesaClassification = OpportunityType | 'SKIP'

export function classifyKiesaTitle(title: string): KiesaClassification {
  if (SKIP_PATTERNS.some((r) => r.test(title))) return 'SKIP'
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
  /** Override base URL for testing. */
  baseUrl?: string
}

export async function scrapeKiesa(opts: ScrapeKiesaOptions = {}): Promise<OpportunityInput[]> {
  const fetchFn = opts.fetchImpl ?? fetch
  const base = opts.baseUrl ?? BASE_URL

  const res = await fetchFn(`${base}${LISTING_PATH}`, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
  })
  if (!res.ok) throw new Error(`KIESA listing fetch failed: HTTP ${res.status}`)
  const html = await res.text()

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

  return items
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
