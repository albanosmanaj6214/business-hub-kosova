import { describe, it, expect } from 'vitest'
import { validateRecord, qualityScore } from './validation'
import type { NormalizedRecord } from './contracts'

const record = (over: Partial<NormalizedRecord['canonical']> = {}, warnings: NormalizedRecord['warnings'] = [], confidence = 1): NormalizedRecord => ({
  canonical: { kind: 'opportunity', title: 'Grant', url: 'https://x/1', publicationDate: '2026-07-01', identifiers: { officialId: 'K-1', canonicalUrl: 'https://x/1' }, payload: {}, ...over },
  original: {}, warnings, confidence,
})

describe('validation + quality', () => {
  it('a complete, cited record passes without review', () => {
    const v = validateRecord(record(), { hasCitation: true, hasSnapshot: true })
    expect(v.ok).toBe(true)
    expect(v.requiresReview).toBe(false)
  })
  it('missing citation is CRITICAL and blocks (ok=false)', () => {
    const v = validateRecord(record(), { hasCitation: false, hasSnapshot: true })
    expect(v.ok).toBe(false)
    expect(v.issues.some((i) => i.code === 'missing_citation' && i.severity === 'critical')).toBe(true)
  })
  it('missing title + identity are critical', () => {
    const v = validateRecord(record({ title: '', url: undefined, identifiers: {} }), { hasCitation: true, hasSnapshot: true })
    expect(v.ok).toBe(false)
    expect(v.issues.some((i) => i.code === 'missing_title')).toBe(true)
    expect(v.issues.some((i) => i.code === 'missing_identity')).toBe(true)
  })
  it('a warning forces review but still ok', () => {
    const v = validateRecord(record({ publicationDate: undefined }), { hasCitation: true, hasSnapshot: true })
    expect(v.ok).toBe(true)
    expect(v.requiresReview).toBe(true)
    expect(v.issues.some((i) => i.code === 'missing_publication_date' && i.severity === 'warning')).toBe(true)
  })
  it('low normalization confidence is surfaced', () => {
    const v = validateRecord(record({}, [{ field: 'x', reason: 'r', confidence: 0.3 }], 0.3), { hasCitation: true, hasSnapshot: true })
    expect(v.requiresReview).toBe(true)
    expect(qualityScore(v)).toBeLessThan(1)
  })
})
