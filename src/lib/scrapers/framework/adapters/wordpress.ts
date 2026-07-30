import { politeFetchJson } from '../fetcher'
import type { Adapter, StandardOpportunity } from '../types'

interface WpPost {
  link: string
  date_gmt?: string
  title?: { rendered?: string }
  excerpt?: { rendered?: string }
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim()
}

// Pure mapping (no network) so it is unit-testable with fixtures.
export function mapWpPosts(posts: WpPost[], sourceName: string, endpoint: string): StandardOpportunity[] {
  if (!Array.isArray(posts)) throw new Error('WordPress endpoint did not return an array')
  return posts
    .map((p): StandardOpportunity => {
      const title = stripHtml(p.title?.rendered ?? '')
      const desc = stripHtml(p.excerpt?.rendered ?? '')
      const d = p.date_gmt ? new Date(p.date_gmt + 'Z') : null
      return {
        title,
        description: desc || null,
        sourceName,
        sourceUrl: p.link,
        publishedAt: d && !isNaN(+d) ? d : null,
        extractedFrom: endpoint,
        originalTextSnippet: desc ? desc.slice(0, 500) : null,
      }
    })
    .filter((o) => o.title)
}

// Uses the WordPress REST API (/wp-json/wp/v2/posts). More stable than scraping HTML.
export const wordpressAdapter: Adapter = async (source, cfg) => {
  const base = (cfg.feedUrl || source.baseUrl).replace(/\/$/, '')
  const endpoint = base.includes('/wp-json/')
    ? base
    : `${base}/wp-json/wp/v2/posts?per_page=${cfg.maxItems ?? 30}&_fields=link,date_gmt,title,excerpt`
  const posts = await politeFetchJson<WpPost[]>(endpoint)
  return mapWpPosts(posts, source.name, endpoint)
}
