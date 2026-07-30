import { describe, it, expect } from 'vitest'
import { decideChangeType, structuredDiff, canonicalSummary } from './versioning'

describe('versioning helpers', () => {
  it('decides new / unchanged / changed', () => {
    expect(decideChangeType(null, 'h1')).toBe('new')
    expect(decideChangeType({ contentHash: 'h1' }, 'h1')).toBe('unchanged')
    expect(decideChangeType({ contentHash: 'h1' }, 'h2')).toBe('changed')
  })
  it('produces a field-level structured diff', () => {
    const d = structuredDiff({ a: 1, b: 2 }, { a: 1, b: 3, c: 4 })
    expect(d).toEqual([{ field: 'b', from: 2, to: 3 }, { field: 'c', from: null, to: 4 }])
  })
  it('canonicalSummary excludes identifiers (content only)', () => {
    const sum = canonicalSummary({ title: 'T', url: 'u', payload: { amount: 5 } })
    expect(sum).toMatchObject({ title: 'T', url: 'u', amount: 5 })
    expect(sum).not.toHaveProperty('identifiers')
  })
})
