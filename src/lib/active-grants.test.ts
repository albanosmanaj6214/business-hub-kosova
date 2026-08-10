import { describe, it, expect } from 'vitest'
import { isActiveGrant, kosovoToday } from '@/lib/active-grants'

const g = (o: Partial<Parameters<typeof isActiveGrant>[0]> = {}) => ({
  title: 'Grant per digjitalizim',
  titleSq: null,
  deadline: null,
  isOngoing: false,
  ...o,
})
const TODAY = new Date('2026-08-10T00:00:00.000Z')

describe('isActiveGrant', () => {
  it('numeron grantin me afat ne te ardhmen', () => {
    expect(isActiveGrant(g({ deadline: new Date('2026-09-01') }), TODAY)).toBe(true)
  })

  it('numeron grantin qe skadon sot', () => {
    expect(isActiveGrant(g({ deadline: new Date('2026-08-10T00:00:00.000Z') }), TODAY)).toBe(true)
  })

  it('nuk numeron grantin e skaduar', () => {
    expect(isActiveGrant(g({ deadline: new Date('2026-08-09') }), TODAY)).toBe(false)
  })

  it('nuk numeron grantin pa afat qe nuk eshte i vazhdueshem', () => {
    expect(isActiveGrant(g({ deadline: null, isOngoing: false }), TODAY)).toBe(false)
  })

  it('numeron grantin e vazhdueshem edhe pa afat', () => {
    expect(isActiveGrant(g({ deadline: null, isOngoing: true }), TODAY)).toBe(true)
  })

  it('numeron te vazhdueshmin edhe kur afati ka kaluar', () => {
    expect(isActiveGrant(g({ deadline: new Date('2020-01-01'), isOngoing: true }), TODAY)).toBe(true)
  })

  it('perjashton thirrjen per stenden e panairit — i takon modulit te panaireve', () => {
    const stand = g({ titleSq: 'THIRRJE PUBLIKE PËR APLIKIM NË STENDËN SHTETËRORE', deadline: new Date('2026-09-01') })
    expect(isActiveGrant(stand, TODAY)).toBe(false)
  })

  it('perjashton thirrjen e stendes edhe kur eshte e vazhdueshme', () => {
    const stand = g({ titleSq: 'Bashkefinancim i pjesemarrjes ne panair', isOngoing: true })
    expect(isActiveGrant(stand, TODAY)).toBe(false)
  })

  it('lexon edhe titullin anglisht kur titleSq mungon', () => {
    const stand = g({ title: 'Call for the STENDEN shteterore', deadline: new Date('2026-09-01') })
    expect(isActiveGrant(stand, TODAY)).toBe(false)
  })
})

describe('kosovoToday', () => {
  it('kthen mesnaten UTC te dites, pa ore', () => {
    const d = kosovoToday()
    expect(d.getUTCHours()).toBe(0)
    expect(d.getUTCMinutes()).toBe(0)
    expect(d.getUTCSeconds()).toBe(0)
    expect(d.getUTCMilliseconds()).toBe(0)
  })
})
