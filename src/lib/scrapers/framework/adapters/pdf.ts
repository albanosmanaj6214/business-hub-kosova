import * as cheerio from 'cheerio'
import { politeFetch } from '../fetcher'
import type { Adapter, StandardOpportunity } from '../types'

function abs(base: string, href: string): string {
  try { return new URL(href, base).toString() } catch { return href }
}

// Phase 1: find PDF documents on a listing page and surface each as a
// needs-review opportunity with the PDF attached. Full PDF text extraction
// (parsing deadline/criteria/amount out of the file) is a later enhancement;
// until then these always go to the review queue for a human to confirm.
export const pdfAdapter: Adapter = async (source, cfg) => {
  const url = cfg.listUrl || source.baseUrl
  const r = await politeFetch(url)
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`)
  const $ = cheerio.load(r.body)
  const sel = cfg.pdfLinkSelector || 'a[href$=".pdf"], a[href*=".pdf"]'
  const out: StandardOpportunity[] = []
  const seen = new Set<string>()
  const max = cfg.maxItems ?? 30
  $(sel).each((_, el) => {
    if (out.length >= max) return
    const a = $(el)
    const href = a.attr('href') || ''
    if (!href) return
    const full = abs(url, href)
    if (seen.has(full)) return
    seen.add(full)
    const title = (a.text().trim() || a.attr('title') || href.split('/').pop() || 'Dokument PDF').trim()
    out.push({
      title,
      description: null,
      sourceName: source.name,
      sourceUrl: full,
      extractedFrom: url,
      attachments: [{ type: 'pdf', url: full }],
      originalTextSnippet: title.slice(0, 500),
    })
  })
  return out
}
