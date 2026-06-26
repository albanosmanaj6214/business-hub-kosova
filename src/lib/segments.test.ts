import { describe, it, expect } from 'vitest'
import {
  BUSINESS_SEGMENTS, SEGMENT_LABELS, isBusinessSegment,
  isDiasporaRole, isStartupStage, isLookingFor,
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
