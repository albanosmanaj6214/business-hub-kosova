import { describe, it, expect } from 'vitest'
import { ECONOMIC_ZONES, zonesByMunicipality, type EconomicZone } from './zones'

const SAMPLE: EconomicZone[] = [
  { id: 'z1', name: 'Zona A', municipality: 'Prizren', type: 'industrial' },
  { id: 'z2', name: 'Zona B', municipality: 'Drenas', type: 'economic' },
  { id: 'z3', name: 'Zona C', municipality: 'Prizren', type: 'business' },
]

describe('economic zones', () => {
  it('prodhimi nis bosh (pa të dhëna sintetike) dhe është array', () => {
    expect(Array.isArray(ECONOMIC_ZONES)).toBe(true)
    expect(ECONOMIC_ZONES.length).toBe(0)
  })

  it('zonesByMunicipality grupon sipas komunës, alfabetikisht', () => {
    const g = zonesByMunicipality(SAMPLE)
    expect(g.map((x) => x.municipality)).toEqual(['Drenas', 'Prizren'])
    expect(g.find((x) => x.municipality === 'Prizren')?.zones.length).toBe(2)
  })

  it('zonesByMunicipality kthen [] për listë bosh (default = prodhimi)', () => {
    expect(zonesByMunicipality([])).toEqual([])
    expect(zonesByMunicipality()).toEqual([])
  })

  it('asnjë string s’ka em-dash', () => {
    expect(JSON.stringify(ECONOMIC_ZONES)).not.toContain('—')
  })
})
