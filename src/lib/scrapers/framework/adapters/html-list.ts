import * as cheerio from 'cheerio'
import { politeFetch } from '../fetcher'
import type { Adapter, StandardOpportunity } from '../types'

function abs(base: string, href: string): string {
  try { return new URL(href, base).toString() } catch { return href }
}

// Generic list scraper driven entirely by selectors in the source config.
// No per-site code: configure itemSelector (+ optional title/link/date/desc).
export const htmlListAdapter: Adapter = async (source, cfg) => {
  const url = cfg.listUrl || source.baseUrl
  if (!cfg.itemSelector) throw new Error('html-list adapter requires itemSelector in config')
  const r = await politeFetch(url)
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`)
  const $ = cheerio.load(r.body)
  const out: StandardOpportunity[] = []
  const max = cfg.maxItems ?? 40
  $(cfg.itemSelector).each((_, el) => {
    if (out.length >= max) return
    const node = $(el)
    const titleEl = cfg.titleSelector ? node.find(cfg.titleSelector).first() : node.find('a').first()
    const title = titleEl.text().trim()
    if (!title) return
    const linkEl = cfg.linkSelector
      ? node.find(cfg.linkSelector).first()
      : (titleEl.is('a') ? titleEl : node.find('a').first())
    const href = linkEl.attr('href') || ''
    const desc = cfg.descriptionSelector ? node.find(cfg.descriptionSelector).first().text().trim() : ''
    const dateTxt = cfg.dateSelector ? node.find(cfg.dateSelector).first().text().trim() : ''
    const d = dateTxt ? new Date(dateTxt) : null
    out.push({
      title,
      description: desc || null,
      sourceName: source.name,
      sourceUrl: href ? abs(url, href) : url,
      publishedAt: d && !isNaN(+d) ? d : null,
      extractedFrom: url,
      originalTextSnippet: (desc || title).slice(0, 500),
    })
  })
  return out
}
