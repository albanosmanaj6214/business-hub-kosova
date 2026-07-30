import { describe, it, expect } from 'vitest'
import { deterministicFingerprint, computeRecordFingerprint, contentHash, dedupeDecision, dedupeWithinRun } from './dedupe'
import type { CanonicalRecord } from './contracts'

const rec = (over: Partial<CanonicalRecord> = {}): CanonicalRecord => ({
  kind: 'opportunity', title: 'Grant', url: 'https://x/1',
  identifiers: { officialId: 'KIESA-1' }, payload: { a: 1 }, ...over,
})

describe('deterministic dedup', () => {
  it('fingerprint is deterministic + case/whitespace-insensitive on parts', () => {
    expect(deterministicFingerprint(['A', ' b '])).toBe(deterministicFingerprint(['a', 'B']))
  })
  it('prefers a strong identifier for the record fingerprint', () => {
    expect(computeRecordFingerprint(rec())).toBe(computeRecordFingerprint(rec({ title: 'different title' })))
  })
  it('new vs duplicate vs version_changed', () => {
    const fp = computeRecordFingerprint(rec())
    const ch = contentHash(rec().payload)
    expect(dedupeDecision(fp, ch, []).decision).toBe('new')
    expect(dedupeDecision(fp, ch, [{ id: 'x', fingerprint: fp, contentHash: ch }]).decision).toBe('duplicate')
    expect(dedupeDecision(fp, ch, [{ id: 'x', fingerprint: fp, contentHash: 'other' }]).decision).toBe('version_changed')
  })
  it('collapses duplicates within a run (idempotent)', () => {
    const items = [{ fingerprint: 'a' }, { fingerprint: 'a' }, { fingerprint: 'b' }]
    const { unique, duplicates } = dedupeWithinRun(items)
    expect(unique.length).toBe(2)
    expect(duplicates.length).toBe(1)
  })
})
