import * as cheerio from 'cheerio'
import { politeFetch } from '../fetcher'
import type { Adapter, StandardOpportunity } from '../types'

// Pure RSS/Atom parser (no network) so feed parsing is unit-testable with fixtures.
// Works for both RSS (<item>) and Atom (<entry>).
export function parseFeed(body: string, sourceName: string, feedUrl: string, maxItems = 40): StandardOpportunity[] {
  const $ = cheerio.load(body, { xmlMode: true })
  const out: StandardOpportunity[] = []
  $('item, entry').each((_, el) => {
    if (out.length >= maxItems) return
    const node = $(el)
    const title = node.find('title').first().text().trim()
    if (!title) return
    let link = node.find('link').first().text().trim()
    if (!link) link = node.find('link').first().attr('href') || ''
    const desc = node.find('description, summary, content').first().text().trim()
    const pub = node.find('pubDate, published, updated').first().text().trim()
    const d = pub ? new Date(pub) : null
    out.push({
      title,
      description: desc || null,
      sourceName,
      sourceUrl: link || feedUrl,
      publishedAt: d && !isNaN(+d) ? d : null,
      extractedFrom: feedUrl,
      originalTextSnippet: desc ? desc.slice(0, 500) : null,
    })
  })
  return out
}

// Feeds are the most stable way to track a site, so prefer this over HTML scraping.
export const rssAdapter: Adapter = async (source, cfg) => {
  const url = cfg.feedUrl || source.baseUrl
  const r = await politeFetch(url)
  if (!r.ok) throw new Error(`HTTP ${r.status} for feed ${url}`)
  return parseFeed(r.body, source.name, url, cfg.maxItems ?? 40)
}
