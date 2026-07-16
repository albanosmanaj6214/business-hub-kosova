import { describe, it, expect } from 'vitest'
import { TIER_ENTITLEMENTS, entitlementsFor, maxSectorsFor, hasEntitlement, isTierKey } from '@/lib/tier-entitlements'

describe('tier-entitlements', () => {
  it('has the four canonical tiers', () => {
    expect(Object.keys(TIER_ENTITLEMENTS)).toEqual(['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'])
  })

  it('encodes the §12 sector caps', () => {
    expect(maxSectorsFor('STARTER')).toBe(1)
    expect(maxSectorsFor('PROFESSIONAL')).toBe(3)
    expect(maxSectorsFor('ENTERPRISE')).toBe(6)
  })

  it('treats unknown/null tier as FREE', () => {
    expect(entitlementsFor(null)).toEqual(TIER_ENTITLEMENTS.FREE)
    expect(entitlementsFor('NOPE')).toEqual(TIER_ENTITLEMENTS.FREE)
    expect(maxSectorsFor(undefined)).toBe(1)
  })

  it('gates email alerts / checklists by tier', () => {
    expect(hasEntitlement('STARTER', 'emailAlerts')).toBe(false)
    expect(hasEntitlement('PROFESSIONAL', 'emailAlerts')).toBe(true)
    expect(hasEntitlement('STARTER', 'checklists')).toBe(false)
    expect(hasEntitlement('ENTERPRISE', 'checklists')).toBe(true)
    expect(hasEntitlement('FREE', 'newsletter')).toBe(true)
  })

  it('marks guides paid-only for Starter, full for Pro/Ent', () => {
    expect(entitlementsFor('STARTER').guides).toBe('none')
    expect(entitlementsFor('PROFESSIONAL').guides).toBe('full')
    expect(entitlementsFor('ENTERPRISE').consultationsPerMonth).toBe(-1)
  })

  it('guards tier keys', () => {
    expect(isTierKey('ENTERPRISE')).toBe(true)
    expect(isTierKey('gold')).toBe(false)
    expect(isTierKey(null)).toBe(false)
  })
})
