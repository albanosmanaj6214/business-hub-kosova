import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { parseKiesaListing, legacyExternalId, createKiesaAdapter } from './adapter'

const html = readFileSync(new URL('./fixtures/kiesa-listing.html', import.meta.url), 'utf8')

describe('KIESA canonical adapter — deterministic parse (no AI)', () => {
  it('parses real KIESA listing items with stable id, title, official URL, classification', () => {
    const items = parseKiesaListing(html)
    expect(items.length).toBeGreaterThan(0)
    for (const it of items) {
      expect(it.itemId).toMatch(/^\d+$/)
      expect(it.title.length).toBeGreaterThan(0)
      expect(it.url).toMatch(/^https:\/\/kiesa\.rks-gov\.net\//)
      expect(['GRANT', 'FAIR', 'REGULATION']).toContain(it.type)
    }
  })
  it('legacyExternalId reproduces the legacy sha1("KIESA:<id>") for reconciliation parity', () => {
    const id = '1148'
    expect(legacyExternalId(id)).toBe(createHash('sha1').update('KIESA:1148').digest('hex'))
  })
  it('official URLs and identity are stable across reparse (idempotent input)', () => {
    const a = parseKiesaListing(html)
    const b = parseKiesaListing(html)
    expect(a.map((x) => [x.itemId, x.url])).toEqual(b.map((x) => [x.itemId, x.url]))
  })
  it('the adapter runs fetch→parse→normalize with NO network and NO AI (offlineBody)', async () => {
    const adapter = createKiesaAdapter({ offlineBody: html })
    const conn = await adapter.testConnection({} as never)
    expect(conn.ok).toBe(true)
    const refs = await adapter.discover({} as never)
    const fetched = await adapter.fetch(refs[0], { now: () => new Date() } as never)
    expect(fetched.checksum).toHaveLength(64)
    const parsed = await adapter.parse(fetched, { now: () => new Date() } as never)
    expect(parsed.length).toBeGreaterThan(0)
    const norm = await adapter.normalize(parsed[0], { now: () => new Date() } as never)
    expect(norm.canonical.destination).toBe('opportunity')
    expect(norm.canonical.identifiers.officialId).toBe(parsed[0].sourceRecordId)
    expect((norm.canonical.payload as any).legacyExternalId).toBe(legacyExternalId(parsed[0].sourceRecordId!))
  })
})

import { parseKiesaDetail } from './adapter'
import { readFileSync as _rf } from 'node:fs'
const detailHtml = _rf(new URL('./fixtures/kiesa-detail.html', import.meta.url), 'utf8')

describe('KIESA detail parser — deterministic, no AI', () => {
  it('extracts publication date + PDF attachments; leaves deadline/amount/eligibility null', () => {
    const d = parseKiesaDetail(detailHtml)
    expect(d.publicationDate).toMatch(/^\d{4}-\d{2}-\d{2}$/) // fixture has dd/mm/yyyy
    expect(d.attachmentUrls.length).toBeGreaterThan(0)
    expect(d.attachmentUrls[0]).toMatch(/^https:\/\/kiesa\.rks-gov\.net\/.*\.pdf$/)
    expect(d.deadline).toBeNull()   // lives in the PDF -> AI-only
    expect(d.amount).toBeNull()
    expect(d.eligibility).toBeNull()
  })
  it('returns nulls (no throw) for an empty/garbage detail page', () => {
    const d = parseKiesaDetail('<html><body></body></html>')
    expect(d.publicationDate).toBeNull()
    expect(d.attachmentUrls).toEqual([])
  })
})
