import { describe, it, expect } from 'vitest'
import { activationReadiness, type ActivationCandidate } from '@/lib/ingestion/source-governance'

const ready: ActivationCandidate = {
  tier: 'B', institutionName: 'Eurostat', baseUrl: 'https://ec.europa.eu/eurostat',
  accessMethod: 'api', kind: null, license: 'CC BY 4.0', termsOfUseStatus: 'approved',
  rateLimitPerMin: 60, requestTimeoutMs: 15000, owner: 'data-team', reviewer: 'qa', lifecycle: 'APPROVED',
}

describe('activationReadiness (preconditions before ACTIVE)', () => {
  it('a fully-governed APPROVED source is ready', () => {
    expect(activationReadiness(ready)).toEqual({ ok: true, missing: [] })
  })
  it('a non-APPROVED source is never ready (activation requires prior approval)', () => {
    const r = activationReadiness({ ...ready, lifecycle: 'DRAFT' })
    expect(r.ok).toBe(false)
    expect(r.missing.some((m) => m.includes('APPROVED'))).toBe(true)
  })
  it('lists every missing precondition', () => {
    const r = activationReadiness({
      tier: null, institutionName: null, baseUrl: null, accessMethod: null, kind: null,
      license: null, termsOfUseStatus: 'not_reviewed', rateLimitPerMin: null, requestTimeoutMs: null,
      owner: null, reviewer: null, lifecycle: 'PENDING_REVIEW',
    })
    expect(r.ok).toBe(false)
    for (const m of ['authority tier', 'institucioni', 'URL e burimit', 'metoda e qasjes', 'rate limit', 'timeout', 'owner', 'reviewer']) {
      expect(r.missing.some((x) => x.includes(m)), m).toBe(true)
    }
  })
  it('accepts kind as an access method fallback and licence OR reviewed terms', () => {
    expect(activationReadiness({ ...ready, accessMethod: null, kind: 'rss' }).ok).toBe(true)
    expect(activationReadiness({ ...ready, license: null, termsOfUseStatus: 'approved' }).ok).toBe(true)
    expect(activationReadiness({ ...ready, license: null, termsOfUseStatus: 'not_reviewed' }).ok).toBe(false)
  })
})
