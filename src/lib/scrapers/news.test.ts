import { describe, it, expect } from 'vitest'
import { parseRssNews, stripHtml } from '@/lib/scrapers/news'

const SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Ekonomi</title>
    <item>
      <title><![CDATA[Rritet paga minimale ne Kosove]]></title>
      <link>https://example.com/lajme/paga-minimale</link>
      <pubDate>Tue, 23 Jun 2026 10:00:00 +0000</pubDate>
      <description><![CDATA[<p>Qeveria <a href="#">vendosi</a> rritjen e pages minimale.</p>]]></description>
    </item>
    <item>
      <title>Banka qendrore ul normat</title>
      <link>https://example.com/lajme/bqk-normat</link>
      <pubDate>Mon, 22 Jun 2026 08:30:00 +0000</pubDate>
      <description>Njoftim i shkurter.</description>
    </item>
    <item>
      <title>Dyfishim i njejtit link</title>
      <link>https://example.com/lajme/bqk-normat</link>
      <description>Duplikat sipas URL.</description>
    </item>
    <item>
      <title></title>
      <link>https://example.com/lajme/pa-titull</link>
    </item>
  </channel>
</rss>`

describe('stripHtml', () => {
  it('removes tags and decodes common entities', () => {
    expect(stripHtml('<p>Hello&nbsp;&amp; <b>bye</b></p>')).toBe('Hello & bye')
  })
})

describe('parseRssNews', () => {
  const items = parseRssNews(SAMPLE, 'Ekonomi', 'https://example.com/feed/')

  it('parses items with a non-empty title only', () => {
    // 4 items in feed, but one duplicate URL + one empty title are dropped.
    expect(items).toHaveLength(2)
  })

  it('extracts title, link and parses date', () => {
    expect(items[0].title).toBe('Rritet paga minimale ne Kosove')
    expect(items[0].sourceUrl).toBe('https://example.com/lajme/paga-minimale')
    expect(items[0].publishedAt).toBeInstanceOf(Date)
    expect(items[0].sourceName).toBe('Ekonomi')
  })

  it('strips HTML from the description into summary + body', () => {
    expect(items[0].summary).toBe('Qeveria vendosi rritjen e pages minimale.')
    expect(items[0].body).toContain('Qeveria vendosi')
    expect(items[0].body).not.toContain('<')
  })

  it('falls back to title for body when description is empty', () => {
    const noDesc = parseRssNews(
      `<rss><channel><item><title>Vetem titull</title><link>https://x.com/a</link></item></channel></rss>`,
      'S', 'https://x.com/feed',
    )
    expect(noDesc[0].body).toBe('Vetem titull')
    expect(noDesc[0].summary).toBeNull()
    expect(noDesc[0].publishedAt).toBeNull()
  })

  it('dedupes within a feed by sourceUrl', () => {
    const urls = items.map((i) => i.sourceUrl)
    expect(new Set(urls).size).toBe(urls.length)
  })
})
