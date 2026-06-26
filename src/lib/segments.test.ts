import { describe, it, expect } from 'vitest'
import {
  BUSINESS_SEGMENTS, SEGMENT_LABELS, isBusinessSegment,
  isDiasporaRole, isStartupStage, isLookingFor,
  DIASPORA_ROLES, STARTUP_STAGES,
  DIASPORA_ROLE_LABELS, STARTUP_STAGE_LABELS, DIASPORA_COUNTRIES, countryLabel,
} from './segments'

describe('segments', () => {
  it('ka tre segmente kanonike', () => {
    expect(BUSINESS_SEGMENTS).toEqual(['STANDARD', 'STARTUP', 'DIASPORA'])
  })
  it('ka etiketa sq/en/de per çdo segment', () => {
    for (const s of BUSINESS_SEGMENTS) {
      expect(SEGMENT_LABELS[s].sq.length).toBeGreaterThan(0)
      expect(SEGMENT_LABELS[s].en.length).toBeGreaterThan(0)
      expect(SEGMENT_LABELS[s].de.length).toBeGreaterThan(0)
    }
  })
  it('isBusinessSegment pranon vlera valide dhe refuzon te tjerat', () => {
    expect(isBusinessSegment('DIASPORA')).toBe(true)
    expect(isBusinessSegment('standard')).toBe(false)
    expect(isBusinessSegment('OJQ')).toBe(false)
  })
  it('guardet e roleve/fazave/looking-for punojne', () => {
    expect(isDiasporaRole('buyer')).toBe(true)
    expect(isDiasporaRole('xx')).toBe(false)
    expect(isStartupStage('early')).toBe(true)
    expect(isStartupStage('xx')).toBe(false)
    expect(isLookingFor('supplier')).toBe(true)
    expect(isLookingFor('xx')).toBe(false)
  })
})

describe('segment labels + countries', () => {
  it('ka etiketë sq/en/de për çdo rol diaspore', () => {
    for (const r of DIASPORA_ROLES) {
      expect(DIASPORA_ROLE_LABELS[r].sq.length).toBeGreaterThan(0)
      expect(DIASPORA_ROLE_LABELS[r].en.length).toBeGreaterThan(0)
      expect(DIASPORA_ROLE_LABELS[r].de.length).toBeGreaterThan(0)
    }
  })

  it('ka etiketë për çdo fazë startup', () => {
    for (const s of STARTUP_STAGES) {
      expect(STARTUP_STAGE_LABELS[s].sq.length).toBeGreaterThan(0)
    }
  })

  it('shtetet janë ISO2 uppercase, unike, dhe përfshijnë DE/CH/AT', () => {
    const codes = DIASPORA_COUNTRIES.map((c) => c.code)
    expect(codes).toContain('DE')
    expect(codes).toContain('CH')
    expect(codes).toContain('AT')
    expect(new Set(codes).size).toBe(codes.length)
    for (const c of codes) expect(c).toMatch(/^[A-Z]{2}$/)
  })

  it('countryLabel kthen emrin sq ose vetë kodin për të panjohur', () => {
    expect(countryLabel('DE')).toBe('Gjermani')
    expect(countryLabel('ZZ')).toBe('ZZ')
  })
})
