import * as cheerio from 'cheerio'
import { createHash } from 'crypto'
import type { OpportunityInput, OpportunityType } from './types'

const BASE_URL = 'https://mzhr.rks-gov.net'
const LISTING_PATHS = [
  '/thirrje-per-propozime/',
  '/ftesa-njoftime/',
]
const USER_AGENT =
  'Mozilla/5.0 (BusinessHubKosova/1.0; +https://kosovabusinesses.aiaohub.com)'

const SLUG_GRANT_PREFIXES = [
  'thirrje-per-propozime',
  'thirrja-per-propozime',
  'thirrje-per-aplikim',
  'pzhrb',
  'pzhr',
]

const SKIP_PATTERNS = [/anulim/i, /anulohet/i, /shtyhet/i]
const FAIR_PATTERNS = [/panair/i, /stenden/i, /stendë/i]

function classifyTitle(title: string, slug: string): OpportunityType | 'SKIP' {
  if (SKIP_PATTERNS.some((r) => r.test(title))) return 'SKIP'
  if (FAIR_PATTERNS.some((r) => r.test(title))) return 'FAIR'
  return 'GRANT'
}

function externalIdFor(slug: string): string {
  return createHash('sha1').update(`MZHR:${slug}`).digest('hex')
}

function slugFromUrl(url: string): string | null {
  const m = url.match(/^https?:\/\/mzhr\.rks-gov\.net\/([^/?#]+)\/?(?:[?#]|$)/i)
  return m ? m[1].toLowerCase() : null
}

function isCallSlug(slug: string): boolean {
  return SLUG_GRANT_PREFIXES.some((p) => slug.startsWith(p))
}

function decodeEntities(text: string): string {
  return text
    .replace(/&#8211;/g, '–')
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export interface ScrapeMzhrOptions {
  fetchImpl?: typeof fetch
  baseUrl?: string
}

export async function scrapeMzhr(opts: ScrapeMzhrOptions = {}): Promise<OpportunityInput[]> {
  const fetchFn = opts.fetchImpl ?? fetch
  const base = opts.baseUrl ?? BASE_URL

  const seen = new Set<string>()
  const items: OpportunityInput[] = []

  for (const path of LISTING_PATHS) {
    let html: string
    try {
      const res = await fetchFn(`${base}${path}`, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
      })
      if (!res.ok) continue
      html = await res.text()
    } catch {
      continue
    }

    const $ = cheerio.load(html)

    $('a[href*="mzhr.rks-gov.net/"], a[href^="/"]').each((_, el) => {
      const $a = $(el)
      const hrefRaw = $a.attr('href') ?? ''
      const href = hrefRaw.startsWith('/') ? `${base}${hrefRaw}` : hrefRaw
      if (!href.startsWith(base)) return
      const slug = slugFromUrl(href)
      if (!slug || !isCallSlug(slug) || seen.has(slug)) return

      // skip the listing pages themselves
      if (slug === 'thirrje-per-propozime' || slug === 'ftesa-njoftime') return

      const title = decodeEntities($a.text())
      if (!title || title.length < 12) return

      const classification = classifyTitle(title, slug)
      if (classification === 'SKIP') return

      seen.add(slug)
      items.push({
        externalId: externalIdFor(slug),
        type: classification,
        title,
        description:
          'Detajet e plota (afati, vlera, kriteret e pranueshmërisë) gjenden në faqen origjinale të MZHR.',
        sourceUrl: href.replace(/\/?$/, '/'),
        legacy: {
          provider: 'Ministria e Zhvillimit Rajonal (MZHR)',
          country: 'Kosovo',
          sectors: [],
          tags: ['mzhr', classification.toLowerCase(), 'qeveria'],
        },
      })
    })
  }

  return items
}
