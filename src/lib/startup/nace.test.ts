import { describe, it, expect } from 'vitest'
import { NACE_CODES, searchNace } from './nace'

describe('nace finder', () => {
  it('seed ka kode unike në formatin NN.NN dhe emër sq', () => {
    const codes = NACE_CODES.map((c) => c.code)
    expect(new Set(codes).size).toBe(codes.length)
    expect(codes.length).toBeGreaterThanOrEqual(10)
    for (const c of NACE_CODES) {
      expect(c.code).toMatch(/^\d{2}(\.\d{1,2})?$/)
      expect(c.name.sq.length).toBeGreaterThan(0)
    }
  })

  it('query bosh kthen listë bosh', () => {
    expect(searchNace('')).toEqual([])
    expect(searchNace('   ')).toEqual([])
  })

  it('kërkon me prefiks kodi', () => {
    const r = searchNace('62')
    expect(r.length).toBeGreaterThan(0)
    expect(r.every((c) => c.code.startsWith('62'))).toBe(true)
  })

  it('kërkon me fragment emri (pa ndjeshmëri ndaj shkronjave të mëdha)', () => {
    const r = searchNace('BUKË')
    expect(r.some((c) => c.code === '10.71')).toBe(true)
  })

  it('kërkon me variant sinonim', () => {
    const r = searchNace('softuer')
    expect(r.some((c) => c.code === '62.01')).toBe(true)
  })

  it('respekton limit-in', () => {
    expect(searchNace('a', 3).length).toBeLessThanOrEqual(3)
  })

  it('asnjë string s’ka em-dash', () => {
    expect(JSON.stringify(NACE_CODES)).not.toContain('—')
  })
})
