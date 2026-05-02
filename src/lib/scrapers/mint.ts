import * as cheerio from 'cheerio'
import { createHash } from 'crypto'
import type { OpportunityInput, OpportunityType } from './types'

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
}

export async function scrapeMint(opts: ScrapeMintOptions = {}): Promise<OpportunityInput[]> {
  const fetchFn = opts.fetchImpl ?? fetch
  const base = opts.baseUrl ?? BASE_URL

  const res = await fetchFn(`${base}${LISTING_PATH}`, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
  })
  if (!res.ok) throw new Error(`MINT listing fetch failed: HTTP ${res.status}`)
  const html = await res.text()

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
    items.push({
      externalId: externalIdFor(href),
      type: c,
      title,
      description:
        'Thirrje publike e Ministrisë së Industrisë, Ndërmarrësisë dhe Tregtisë. Detajet e plota (afati, vlera, kriteret) gjenden në dokumentin PDF.',
      sourceUrl: href,
      legacy: {
        provider: 'Ministria e Industrisë, Ndërmarrësisë dhe Tregtisë (MINT)',
        country: 'Kosovo',
        sectors: [],
        tags: ['mint', c.toLowerCase(), 'qeveria'],
      },
    })
  })

  return items
}
