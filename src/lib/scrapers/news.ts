import * as cheerio from 'cheerio'
import { prisma } from '@/lib/prisma'

// Burimet RSS te lajmeve (reale, te verifikuara). Kategori "Ekonomi" ku ekziston,
// qe lajmet te jene sa me relevante per bizneset. Asgje s'u shkon bizneseve direkt:
// çdo lajm i skrepuar ruhet PENDING dhe pret dispeçimin e adminit (audience).
// Lista zgjerohet lehte; analoge me kodet e hardkoduara te scraper-ave te granteve.
export const NEWS_FEEDS: { name: string; url: string }[] = [
  { name: 'IndeksOnline — Ekonomi', url: 'https://indeksonline.net/category/ekonomi/feed/' },
  { name: 'BotaSot — Ekonomi', url: 'https://www.botasot.info/rss/ekonomi/' },
]

const USER_AGENT = 'BusinessHubKosova/1.0 (+https://kosovabusinesses.aiaohub.com)'

export interface NewsItemInput {
  title: string
  summary: string | null
  body: string
  sourceName: string
  sourceUrl: string
  publishedAt: Date | null
}

// Heq tag-et HTML nga teksti i nje pershkrimi RSS (qe shpesh permban <p>, <a>, entitete).
export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#8217;|&#39;/g, '’')
    .replace(/&#8211;|&#8212;/g, '-')
    .replace(/&#8220;|&#8221;/g, '"')
    .replace(/&hellip;/g, '...')
    .replace(/\s+/g, ' ')
    .trim()
}

// Parser i paster (pa rrjet, pa DB) qe te testohet ne izolim. Punon per RSS (<item>)
// dhe Atom (<entry>). Dedup brenda nje feed sipas sourceUrl.
export function parseRssNews(xml: string, sourceName: string, feedUrl: string): NewsItemInput[] {
  const $ = cheerio.load(xml, { xmlMode: true })
  const out: NewsItemInput[] = []
  const seen = new Set<string>()

  $('item, entry').each((_, el) => {
    const node = $(el)
    const title = stripHtml(node.find('title').first().text())
    if (!title) return

    let link = node.find('link').first().text().trim()
    if (!link) link = node.find('link').first().attr('href') || ''
    const sourceUrl = (link || feedUrl).trim()
    if (seen.has(sourceUrl)) return
    seen.add(sourceUrl)

    const rawDesc = node.find('description, summary, content').first().text()
    const text = stripHtml(rawDesc)
    const pub = node.find('pubDate, published, updated').first().text().trim()
    const d = pub ? new Date(pub) : null

    out.push({
      title,
      summary: text ? text.slice(0, 300) : null,
      body: text || title,
      sourceName,
      sourceUrl,
      publishedAt: d && !isNaN(+d) ? d : null,
    })
  })

  return out
}

async function fetchFeed(url: string): Promise<string> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(20000),
    headers: { 'user-agent': USER_AGENT, accept: 'application/rss+xml, application/xml, text/xml, */*' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.text()
}

export interface NewsScrapeResult {
  feeds: { name: string; url: string; ok: boolean; items: number; error?: string }[]
  items: NewsItemInput[]
}

// Skrepon te gjitha feed-et e konfiguruara. Deshtimi i nje feed-i s'e ndal te tjeret.
export async function scrapeNews(): Promise<NewsScrapeResult> {
  const feeds: NewsScrapeResult['feeds'] = []
  const items: NewsItemInput[] = []
  for (const f of NEWS_FEEDS) {
    try {
      const xml = await fetchFeed(f.url)
      const parsed = parseRssNews(xml, f.name, f.url)
      items.push(...parsed)
      feeds.push({ name: f.name, url: f.url, ok: true, items: parsed.length })
    } catch (e) {
      feeds.push({ name: f.name, url: f.url, ok: false, items: 0, error: String((e as Error)?.message || e) })
    }
  }
  return { feeds, items }
}

export interface UpsertResult { created: number; updated: number }

// Ruajtje idempotente sipas sourceUrl (njesoj si scraper-i i granteve ruan sipas url).
// Lajme te reja krijohen PENDING + isGeneral=true; ekzistueset rifreskohen pa prekur
// audiencen apo statusin e dispeçimit (qe admini i ka caktuar).
export async function upsertNewsItems(items: NewsItemInput[]): Promise<UpsertResult> {
  let created = 0
  let updated = 0
  for (const it of items) {
    const existing = await prisma.newsItem.findFirst({ where: { sourceUrl: it.sourceUrl } })
    if (existing) {
      await prisma.newsItem.update({
        where: { id: existing.id },
        data: {
          title: it.title,
          summary: it.summary,
          body: it.body,
          sourceName: it.sourceName,
          publishedAt: it.publishedAt ?? existing.publishedAt,
        },
      })
      updated++
    } else {
      await prisma.newsItem.create({
        data: {
          title: it.title,
          titleSq: it.title,
          summary: it.summary,
          body: it.body,
          sourceName: it.sourceName,
          sourceUrl: it.sourceUrl,
          publishedAt: it.publishedAt,
          isGeneral: true,
          dispatchStatus: 'PENDING',
        },
      })
      created++
    }
  }
  return { created, updated }
}
