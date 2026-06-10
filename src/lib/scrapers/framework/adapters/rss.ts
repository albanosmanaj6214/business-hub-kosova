import * as cheerio from 'cheerio'
import { politeFetch } from '../fetcher'
import type { Adapter, StandardOpportunity } from '../types'

// Works for both RSS (<item>) and Atom (<entry>). Feeds are the most stable
// way to track a site, so prefer this over HTML scraping when available.
export const rssAdapter: Adapter = async (source, cfg) => {
  const url = cfg.feedUrl || source.baseUrl
  const r = await politeFetch(url)
  if (!r.ok) throw new Error(`HTTP ${r.status} for feed ${url}`)
  const $ = cheerio.load(r.body, { xmlMode: true })
  const out: StandardOpportunity[] = []
  const max = cfg.maxItems ?? 40
  $('item, entry').each((_, el) => {
    if (out.length >= max) return
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
      sourceName: source.name,
      sourceUrl: link || url,
      publishedAt: d && !isNaN(+d) ? d : null,
      extractedFrom: url,
      originalTextSnippet: desc ? desc.slice(0, 500) : null,
    })
  })
  return out
}
