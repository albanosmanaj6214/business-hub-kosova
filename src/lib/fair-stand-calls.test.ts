import { describe, it, expect } from 'vitest'
import {
  isFairStandCall, classifyFairStandCall, filterFairStandCalls,
  fairStandSectorLabel, daysLeft, type FairStandCallRow,
} from '@/lib/fair-stand-calls'

const base: FairStandCallRow = {
  id: 'x', title: '', titleSq: null, provider: 'KIESA', deadline: null, url: null,
  sectors: [], isOngoing: false, isGeneral: false, targetActivityTypes: [], forFemaleOwned: false,
}

describe('isFairStandCall', () => {
  it('njeh thirrjet e stendes me diakritike', () => {
    expect(isFairStandCall({ title: 'THIRRJE PUBLIKE PËR APLIKIM NË STENDËN SHTETËRORE' })).toBe(true)
  })

  it('njeh variantin pa diakritike', () => {
    expect(isFairStandCall({ title: 'APLIKIM NE STENDEN SHTETERORE' })).toBe(true)
  })

  it('njeh bashkefinancimin e panairit', () => {
    expect(isFairStandCall({ title: 'Thirrje per bashkefinancim te pjesemarrjes ne panair' })).toBe(true)
  })

  it('lexon titullin shqip kur ekziston', () => {
    expect(isFairStandCall({ title: 'Public call', titleSq: 'Aplikim në STENDËN shtetërore' })).toBe(true)
  })

  it('nuk e ngaterron me grant te rregullt', () => {
    expect(isFairStandCall({ title: 'Grant për digjitalizimin e NVM-ve' })).toBe(false)
  })
})

describe('classifyFairStandCall', () => {
  it('nxjerr sektorin nga panairi i emertuar ne titull', () => {
    const r = classifyFairStandCall({ title: '... NË PANAIRIN “SIAL PARIS 2026”', sectors: [] })
    expect(r.sectors).toEqual(['ushqim-dhe-pije'])
    expect(r.fairName).toBe('SIAL Paris')
    expect(r.source).toBe('fair')
  })

  it('panairi ka prioritet mbi etiketat e lira te scraper-it', () => {
    const r = classifyFairStandCall({
      title: '... PANAIRIN “WEB SUMMIT 2026”',
      sectors: ['ushqim dhe pije'],
    })
    expect(r.sectors).toEqual(['tik'])
    expect(r.source).toBe('fair')
  })

  it('bie te etiketat kur panairi nuk njihet', () => {
    const r = classifyFairStandCall({ title: '... NË STENDËN ... PANAIRIN X', sectors: ['ushqim dhe pije'] })
    expect(r.sectors).toEqual(['ushqim-dhe-pije'])
    expect(r.source).toBe('tags')
  })

  it('kthen liste boshe kur nuk zgjidhet asgje (= i dukshem per te gjithe)', () => {
    const r = classifyFairStandCall({ title: '... NË STENDËN ... EVENT I PANJOHUR', sectors: [] })
    expect(r.sectors).toEqual([])
    expect(r.source).toBe('none')
  })

  it('mbulon panaire me shume sektore', () => {
    const r = classifyFairStandCall({ title: '... PANAIRIN “HANNOVER MESSE 2026”', sectors: [] })
    expect(r.fairName).toBe('Hannover Messe')
    expect(r.sectors.length).toBeGreaterThan(1)
    expect(r.sectors).toContain('metale-makineri')
  })
})

describe('filterFairStandCalls', () => {
  const food = { activityType: null, entitledSectors: ['ushqim-dhe-pije'], femaleOwnership: null }
  const ict = { activityType: null, entitledSectors: ['tik'], femaleOwnership: null }

  const sial: FairStandCallRow = { ...base, id: 'sial', title: '... PANAIRIN “SIAL PARIS 2026”', deadline: new Date('2026-08-21') }
  const web: FairStandCallRow = { ...base, id: 'web', title: '... PANAIRIN “WEB SUMMIT 2026”', deadline: new Date('2026-08-16') }

  it('biznesi i ushqimit sheh vetem SIAL', () => {
    expect(filterFairStandCalls(food, [sial, web]).map((c) => c.id)).toEqual(['sial'])
  })

  it('biznesi i TIK-ut sheh vetem Web Summit', () => {
    expect(filterFairStandCalls(ict, [sial, web]).map((c) => c.id)).toEqual(['web'])
  })

  it('thirrja pa sektor te zgjidhur shkon te te gjithe', () => {
    const univ: FairStandCallRow = { ...base, id: 'u', title: '... STENDËN ... EVENT I PANJOHUR' }
    expect(filterFairStandCalls(food, [univ]).map((c) => c.id)).toEqual(['u'])
    expect(filterFairStandCalls(ict, [univ]).map((c) => c.id)).toEqual(['u'])
  })

  it('rendit afatin me te afert te parin, te vazhdueshmet ne fund', () => {
    const ongoing: FairStandCallRow = { ...base, id: 'ong', title: '... STENDËN ...', isOngoing: true }
    // Profil me dy sektore, qe te tria thirrjet te kalojne filtrin dhe te testohet renditja.
    const both = { activityType: null, entitledSectors: ['ushqim-dhe-pije', 'tik'], femaleOwnership: null }
    const ids = filterFairStandCalls(both, [ongoing, sial, web]).map((c) => c.id)
    expect(ids).toEqual(['web', 'sial', 'ong'])
  })

  it('biznesi pa sektor te caktuar sheh vetem thirrjet universale', () => {
    // Rregull i gjithe platformes (matchesAudience): targetSectors jo-bosh + entitledSectors
    // bosh => nuk perputhet. Prandaj profili duhet plotesuar per te marre thirrje sektoriale.
    const noSector = { activityType: null, entitledSectors: [], femaleOwnership: null }
    expect(filterFairStandCalls(noSector, [sial, web])).toEqual([])
  })
})

describe('fairStandSectorLabel', () => {
  it('kthen etiketen shqip te sektoreve', () => {
    expect(fairStandSectorLabel(['ushqim-dhe-pije'])).toBe('Ushqim dhe pije')
  })

  it('lista boshe do te thote te gjithe sektoret', () => {
    expect(fairStandSectorLabel([])).toBe('Të gjithë sektorët')
  })
})

describe('daysLeft', () => {
  it('numeron ditet e plota mes datave', () => {
    expect(daysLeft(new Date('2026-08-16T00:00:00Z'), new Date('2026-08-10T18:00:00Z'))).toBe(6)
  })

  it('kthen 0 ditene e afatit', () => {
    expect(daysLeft(new Date('2026-08-10T00:00:00Z'), new Date('2026-08-10T23:00:00Z'))).toBe(0)
  })

  it('kthen negativ pas afatit', () => {
    expect(daysLeft(new Date('2026-08-01T00:00:00Z'), new Date('2026-08-10T00:00:00Z'))).toBe(-9)
  })
})
