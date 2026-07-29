import { describe, it, expect } from 'vitest'
import {
  tierMayAuthoritativelySource, assertTierAllowsContentTypes, isCriticalContentType,
  canTransition, isActivation, classifySource, INITIAL_LIFECYCLE,
} from '@/lib/ingestion/source-governance'

describe('authority tiers', () => {
  it('critical content is A/B only; C and D are rejected', () => {
    for (const ct of ['law', 'tariff', 'official_statistic', 'mandatory_certificate', 'grant_eligibility', 'customs_requirement', 'official_deadline']) {
      expect(isCriticalContentType(ct)).toBe(true)
      expect(tierMayAuthoritativelySource('A', ct)).toBe(true)
      expect(tierMayAuthoritativelySource('B', ct)).toBe(true)
      expect(tierMayAuthoritativelySource('C', ct)).toBe(false)
      expect(tierMayAuthoritativelySource('D', ct)).toBe(false)
    }
  })
  it('non-critical content is allowed for every tier incl. D', () => {
    for (const t of ['A', 'B', 'C', 'D'] as const) expect(tierMayAuthoritativelySource(t, 'event')).toBe(true)
  })
  it('assertTierAllowsContentTypes throws for Tier D + critical', () => {
    expect(() => assertTierAllowsContentTypes('D', ['event', 'tariff'])).toThrow()
    expect(() => assertTierAllowsContentTypes('A', ['tariff', 'official_statistic'])).not.toThrow()
    expect(() => assertTierAllowsContentTypes('C', ['event', 'training'])).not.toThrow()
  })
})

describe('lifecycle transitions', () => {
  it('new sources start at DRAFT', () => expect(INITIAL_LIFECYCLE).toBe('DRAFT'))
  it('approval does NOT auto-activate (APPROVED -> ACTIVE is a separate step)', () => {
    expect(canTransition('PENDING_REVIEW', 'APPROVED')).toBe(true)
    expect(canTransition('PENDING_REVIEW', 'ACTIVE')).toBe(false) // cannot jump straight to active
    expect(canTransition('APPROVED', 'ACTIVE')).toBe(true)
    expect(isActivation('ACTIVE')).toBe(true)
    expect(isActivation('APPROVED')).toBe(false)
  })
  it('rejects invalid transitions', () => {
    expect(canTransition('DRAFT', 'ACTIVE')).toBe(false)
    expect(canTransition('ARCHIVED', 'ACTIVE')).toBe(false)
    expect(canTransition('DRAFT', 'DRAFT')).toBe(false)
  })
  it('legacy (null) may only enter at DRAFT/PENDING_REVIEW', () => {
    expect(canTransition(null, 'DRAFT')).toBe(true)
    expect(canTransition(null, 'PENDING_REVIEW')).toBe(true)
    expect(canTransition(null, 'ACTIVE')).toBe(false)
  })
})

describe('operational classification', () => {
  const base = { isActive: true, kind: null as string | null, isLegacyCustom: false, consecutiveFailures: 0, hasEverSucceeded: true }
  it('framework RSS active + healthy = operational (AUV/ME)', () =>
    expect(classifySource({ ...base, kind: 'rss' })).toBe('operational'))
  it('legacy custom active + healthy = legacy (KIESA/MINT)', () =>
    expect(classifySource({ ...base, isLegacyCustom: true })).toBe('legacy'))
  it('active but failing = broken (ATK 27 fails / OEK 18 fails)', () => {
    expect(classifySource({ ...base, kind: 'rss', consecutiveFailures: 27, hasEverSucceeded: false })).toBe('broken')
    expect(classifySource({ ...base, isLegacyCustom: true, consecutiveFailures: 18 })).toBe('broken')
  })
  it('inactive + adapter = dormant (MBPZHR pdf)', () =>
    expect(classifySource({ ...base, isActive: false, kind: 'pdf' })).toBe('dormant'))
  it('inactive + no adapter = decorative (donor rows)', () =>
    expect(classifySource({ ...base, isActive: false, kind: null })).toBe('decorative'))
})
