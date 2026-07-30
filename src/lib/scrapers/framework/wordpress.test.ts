import { describe, it, expect } from 'vitest'
import { mapWpPosts } from './adapters/wordpress'
import posts from './fixtures/stikk-posts.json'

describe('framework/wordpress mapWpPosts — STIKK recorded posts', () => {
  it('maps WordPress REST posts to opportunities (STIKK source works)', () => {
    const items = mapWpPosts(posts as any, 'STIKK', 'https://stikk.org/wp-json/wp/v2/posts')
    expect(items.length).toBeGreaterThan(0)
    expect(items.every((i) => i.title.length > 0)).toBe(true)
    expect(items.every((i) => i.sourceUrl.startsWith('http'))).toBe(true)
  })
  it('throws on a non-array payload', () => {
    expect(() => mapWpPosts({} as any, 'S', 'e')).toThrow()
  })
})
