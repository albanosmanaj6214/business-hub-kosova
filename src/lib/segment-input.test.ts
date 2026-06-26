import { describe, it, expect } from 'vitest'
import { parseSegmentInput } from './segment-input'

describe('parseSegmentInput', () => {
  it('refuzon segment te pavlefshem', () => {
    expect(parseSegmentInput({ businessSegment: 'OJQ' }).ok).toBe(false)
    expect(parseSegmentInput({}).ok).toBe(false)
  })
  it('STANDARD pastron fushat e degeve', () => {
    const r = parseSegmentInput({ businessSegment: 'STANDARD', diasporaCountry: 'DE', startupStage: 'early' })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value.businessSegment).toBe('STANDARD')
      expect(r.value.diasporaCountry).toBeNull()
      expect(r.value.startupStage).toBeNull()
    }
  })
  it('DIASPORA mban shtetin (ISO2 uppercase) + rolin', () => {
    const r = parseSegmentInput({ businessSegment: 'DIASPORA', diasporaCountry: 'de', diasporaRole: 'buyer', lookingFor: ['supplier', 'xx'] })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value.diasporaCountry).toBe('DE')
      expect(r.value.diasporaRole).toBe('buyer')
      expect(r.value.lookingFor).toEqual(['supplier'])
    }
  })
  it('STARTUP mban fazen, hedh shtetin', () => {
    const r = parseSegmentInput({ businessSegment: 'STARTUP', startupStage: 'idea', diasporaCountry: 'DE' })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value.startupStage).toBe('idea')
      expect(r.value.diasporaCountry).toBeNull()
    }
  })
})
