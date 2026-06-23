import { describe, it, expect } from 'vitest'
import { valueToCriteria, isValueComplete, deriveAudienceValue, parseAudience } from './dispatch'

describe('valueToCriteria', () => {
  it('maps "all" without female to general', () => {
    expect(valueToCriteria({ mode: 'all', activityTypes: [], sectors: [], forFemaleOwned: false }))
      .toEqual({ isGeneral: true, targetActivityTypes: [], targetSectors: [], forFemaleOwned: false })
  })
  it('maps "all" with female to non-general female-only', () => {
    expect(valueToCriteria({ mode: 'all', activityTypes: [], sectors: [], forFemaleOwned: true }))
      .toEqual({ isGeneral: false, targetActivityTypes: [], targetSectors: [], forFemaleOwned: true })
  })
  it('maps activity mode', () => {
    expect(valueToCriteria({ mode: 'activity', activityTypes: ['prodhues-perpunues'], sectors: ['x'], forFemaleOwned: false }))
      .toEqual({ isGeneral: false, targetActivityTypes: ['prodhues-perpunues'], targetSectors: [], forFemaleOwned: false })
  })
})

describe('isValueComplete', () => {
  it('all is always complete', () => {
    expect(isValueComplete({ mode: 'all', activityTypes: [], sectors: [], forFemaleOwned: false })).toBe(true)
  })
  it('activity needs at least one activity', () => {
    expect(isValueComplete({ mode: 'activity', activityTypes: [], sectors: [], forFemaleOwned: false })).toBe(false)
    expect(isValueComplete({ mode: 'activity', activityTypes: ['sherbime'], sectors: [], forFemaleOwned: false })).toBe(true)
  })
})

describe('deriveAudienceValue', () => {
  it('prefers activity, then sector, else all', () => {
    expect(deriveAudienceValue({ targetActivityTypes: ['bujqesi'], targetSectors: [], forFemaleOwned: false }).mode).toBe('activity')
    expect(deriveAudienceValue({ targetActivityTypes: [], targetSectors: ['ushqim-dhe-pije'], forFemaleOwned: false }).mode).toBe('sector')
    expect(deriveAudienceValue({ targetActivityTypes: [], targetSectors: [], forFemaleOwned: true }).mode).toBe('all')
  })
})

describe('parseAudience', () => {
  it('rejects an empty non-general audience', () => {
    const r = parseAudience({ isGeneral: false, targetActivityTypes: [], targetSectors: [], forFemaleOwned: false })
    expect(r.ok).toBe(false)
  })
  it('drops invalid slugs and keeps valid ones', () => {
    const r = parseAudience({ isGeneral: false, targetSectors: ['ushqim-dhe-pije', 'fake-sector'], targetActivityTypes: ['nope'] })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.criteria.targetSectors).toEqual(['ushqim-dhe-pije'])
      expect(r.criteria.targetActivityTypes).toEqual([])
    }
  })
})
