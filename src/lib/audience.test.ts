import { describe, it, expect } from 'vitest'
import { matchesAudience, filterForUser, AudienceProfile, AudienceCriteria } from './audience'

const woodProducer: AudienceProfile = { activityType: 'prodhues-perpunues', entitledSectors: ['druri-mobilje'], femaleOwnership: false }
const foodProducerWoman: AudienceProfile = { activityType: 'prodhues-perpunues', entitledSectors: ['ushqim-dhe-pije'], femaleOwnership: true }
const serviceBiz: AudienceProfile = { activityType: 'sherbime', entitledSectors: [], femaleOwnership: false }
const trader: AudienceProfile = { activityType: 'tregti', entitledSectors: [], femaleOwnership: false }
const multiSector: AudienceProfile = { activityType: 'prodhues-perpunues', entitledSectors: ['ushqim-dhe-pije', 'druri-mobilje'], femaleOwnership: false }

const crit = (p: Partial<AudienceCriteria>): AudienceCriteria => ({
  isGeneral: false, targetActivityTypes: [], targetSectors: [], forFemaleOwned: false, ...p,
})

describe('matchesAudience', () => {
  it('general content reaches everyone, including trade', () => {
    const pagaMinimale = crit({ isGeneral: true })
    expect(matchesAudience(trader, pagaMinimale)).toBe(true)
    expect(matchesAudience(woodProducer, pagaMinimale)).toBe(true)
  })

  it('producer grant reaches all producers, not services or trade', () => {
    const producerGrant = crit({ targetActivityTypes: ['prodhues-perpunues'] })
    expect(matchesAudience(woodProducer, producerGrant)).toBe(true)
    expect(matchesAudience(foodProducerWoman, producerGrant)).toBe(true)
    expect(matchesAudience(serviceBiz, producerGrant)).toBe(false)
    expect(matchesAudience(trader, producerGrant)).toBe(false)
  })

  it('food fair reaches food sector, not wood', () => {
    const foodFair = crit({ targetSectors: ['ushqim-dhe-pije'] })
    expect(matchesAudience(foodProducerWoman, foodFair)).toBe(true)
    expect(matchesAudience(multiSector, foodFair)).toBe(true)
    expect(matchesAudience(woodProducer, foodFair)).toBe(false)
  })

  it('female-only content reaches only female-owned businesses in scope', () => {
    const womenGrant = crit({ targetActivityTypes: ['prodhues-perpunues'], forFemaleOwned: true })
    expect(matchesAudience(foodProducerWoman, womenGrant)).toBe(true)
    expect(matchesAudience(woodProducer, womenGrant)).toBe(false)
  })

  it('filterForUser keeps only matching items', () => {
    const items = [
      crit({ isGeneral: true }),
      crit({ targetSectors: ['ushqim-dhe-pije'] }),
      crit({ targetSectors: ['tekstil-konfeksion'] }),
    ]
    expect(filterForUser(foodProducerWoman, items)).toHaveLength(2)
  })
})

// --- Faza 0: boshtet segment + shtet ---
const woodDiaspora: AudienceProfile = { activityType: 'prodhues-perpunues', entitledSectors: ['druri-mobilje'], femaleOwnership: null, businessSegment: 'DIASPORA', diasporaCountry: 'DE' }
const woodStandard: AudienceProfile = { activityType: 'prodhues-perpunues', entitledSectors: ['druri-mobilje'], femaleOwnership: null, businessSegment: 'STANDARD' }

describe('audience: boshti i segmentit', () => {
  it('targetSegments bosh => pa kufizim segmenti', () => {
    expect(matchesAudience(woodStandard, crit({}))).toBe(true)
  })
  it('targetSegments=[DIASPORA] sheh vetem diasporen', () => {
    const item = crit({ targetSegments: ['DIASPORA'] })
    expect(matchesAudience(woodDiaspora, item)).toBe(true)
    expect(matchesAudience(woodStandard, item)).toBe(false)
    expect(matchesAudience({ ...woodStandard, businessSegment: null }, item)).toBe(false)
  })
  it('isGeneral mbizoteron segmentin', () => {
    const item = crit({ isGeneral: true, targetSegments: ['DIASPORA'] })
    expect(matchesAudience(woodStandard, item)).toBe(true)
  })
})

describe('audience: boshti i shtetit te diaspores', () => {
  it('targetCountries=[DE] sheh vetem diasporen nga DE', () => {
    const item = crit({ targetSegments: ['DIASPORA'], targetCountries: ['DE'] })
    expect(matchesAudience(woodDiaspora, item)).toBe(true)
    expect(matchesAudience({ ...woodDiaspora, diasporaCountry: 'CH' }, item)).toBe(false)
  })
  it('segment + aktivitet kombinohen me AND', () => {
    const item = crit({ targetSegments: ['STANDARD'], targetActivityTypes: ['sherbime'] })
    expect(matchesAudience({ ...woodStandard, activityType: 'sherbime' }, item)).toBe(true)
    expect(matchesAudience({ ...woodStandard, activityType: 'prodhues-perpunues' }, item)).toBe(false)
  })
})
