import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { parseFeed } from './adapters/rss'

const atk = readFileSync(new URL('./fixtures/atk-feed.xml', import.meta.url), 'utf8')

describe('framework/rss parseFeed — ATK recorded feed', () => {
  it('parses all 10 items with title + http link + source name', () => {
    const items = parseFeed(atk, 'ATK', 'https://www.atk-ks.org/feed/', 40)
    expect(items.length).toBe(10)
    expect(items.every((i) => i.title.length > 0)).toBe(true)
    expect(items.every((i) => i.sourceUrl.startsWith('http'))).toBe(true)
    expect(items[0].sourceName).toBe('ATK')
    expect(items[0].extractedFrom).toBe('https://www.atk-ks.org/feed/')
  })
  it('respects maxItems', () => {
    expect(parseFeed(atk, 'ATK', 'u', 3).length).toBe(3)
  })
  it('empty/invalid feed yields 0 items and does not throw', () => {
    expect(parseFeed('<rss version="2.0"></rss>', 'X', 'u').length).toBe(0)
    expect(parseFeed('', 'X', 'u').length).toBe(0)
  })
})
