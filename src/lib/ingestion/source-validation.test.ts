import { describe, it, expect } from 'vitest'
import { sourceGovernanceSchema, endpointSchema, toClientSource } from '@/lib/ingestion/source-validation'

const valid = {
  code: 'EUROSTAT', name: 'Eurostat', baseUrl: 'https://ec.europa.eu/eurostat', tier: 'B' as const,
  contentTypes: ['official_statistic'], authenticationType: 'none' as const,
}

describe('sourceGovernanceSchema', () => {
  it('accepts valid governance input', () => {
    expect(sourceGovernanceSchema.safeParse(valid).success).toBe(true)
  })
  it('rejects a non-URL baseUrl and an unknown tier', () => {
    expect(sourceGovernanceSchema.safeParse({ ...valid, baseUrl: 'not-a-url' }).success).toBe(false)
    expect(sourceGovernanceSchema.safeParse({ ...valid, tier: 'Z' }).success).toBe(false)
  })
  it('rejects a negative rate limit', () => {
    expect(sourceGovernanceSchema.safeParse({ ...valid, rateLimitPerMin: -5 }).success).toBe(false)
  })
  it('secretReference must be an ENV VAR NAME, not a secret value', () => {
    expect(sourceGovernanceSchema.safeParse({ ...valid, secretReference: 'EUROSTAT_API_KEY' }).success).toBe(true)
    expect(sourceGovernanceSchema.safeParse({ ...valid, secretReference: 'sk-live-abc123-secret' }).success).toBe(false)
  })
})

describe('endpointSchema', () => {
  it('validates a real endpoint', () => {
    expect(endpointSchema.safeParse({ name: 'Comext', url: 'https://ec.europa.eu/api', enabled: false }).success).toBe(true)
  })
})

describe('secret non-disclosure', () => {
  it('toClientSource strips secret references by default', () => {
    const out = toClientSource({ code: 'X', secretReference: 'EUROSTAT_API_KEY', authReference: 'FOO' })
    expect(out.code).toBe('X')
    expect('secretReference' in out).toBe(false)
    expect('authReference' in out).toBe(false)
  })
  it('includes them only when explicitly requested by an authorized admin', () => {
    const out = toClientSource({ code: 'X', secretReference: 'EUROSTAT_API_KEY' }, { includeSecretRefs: true })
    expect(out.secretReference).toBe('EUROSTAT_API_KEY')
  })
})
