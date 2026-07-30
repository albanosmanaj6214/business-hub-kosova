import { describe, it, expect } from 'vitest'
import { computeIdentity } from './identity'
import type { CanonicalRecord } from './contracts'

const base = (over: Partial<CanonicalRecord> = {}): CanonicalRecord => ({
  kind: 'opportunity', title: 'T', url: 'https://x/1', identifiers: {}, payload: {}, ...over,
})

describe('computeIdentity — deterministic precedence', () => {
  it('prefers the official record id', () => {
    expect(computeIdentity(base({ identifiers: { officialId: 'OID' } })).kind).toBe('official_id')
  })
  it('then the dataset/call id', () => {
    expect(computeIdentity(base({ identifiers: {} }), 'DS-1').kind).toBe('dataset_id')
  })
  it('then the canonical url', () => {
    expect(computeIdentity(base({ identifiers: { canonicalUrl: 'https://x/1' } })).kind).toBe('canonical_url')
  })
  it('falls back to a fingerprint (never the content hash)', () => {
    expect(computeIdentity(base({ url: undefined, identifiers: {} })).kind).toBe('fingerprint')
  })
  it('is stable + namespaced by kind', () => {
    const a = computeIdentity(base({ identifiers: { officialId: 'X' } }))
    const b = computeIdentity(base({ identifiers: { officialId: 'X' }, title: 'different' }))
    expect(a.hash).toBe(b.hash) // identity independent of content
  })
})
