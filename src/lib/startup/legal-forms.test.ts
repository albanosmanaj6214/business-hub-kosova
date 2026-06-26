import { describe, it, expect } from 'vitest'
import { LEGAL_FORMS, legalFormBySlug, LEGAL_FORM_SLUGS } from './legal-forms'

describe('legal-forms', () => {
  it('ka 6 forma me slug-et kanonike, pa OJQ', () => {
    expect(LEGAL_FORMS).toHaveLength(6)
    expect(LEGAL_FORMS.map((f) => f.slug).sort()).toEqual(['bi', 'dega', 'ok', 'op', 'sha', 'shpk'])
    const blob = JSON.stringify(LEGAL_FORMS).toLowerCase()
    expect(blob).not.toContain('ojq')
    expect(blob).not.toContain('joqeveritar')
  })

  it('slug-et janë unike', () => {
    const slugs = LEGAL_FORMS.map((f) => f.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('çdo formë ka emër sq/en/de jo bosh dhe burim me URL', () => {
    for (const f of LEGAL_FORMS) {
      expect(f.name.sq.length).toBeGreaterThan(0)
      expect(f.name.en.length).toBeGreaterThan(0)
      expect(f.name.de.length).toBeGreaterThan(0)
      expect(f.source.url).toMatch(/^https?:\/\//)
      expect(Array.isArray(f.pros)).toBe(true)
      expect(Array.isArray(f.cons)).toBe(true)
    }
  })

  it('asnjë string copy s’ka em-dash', () => {
    expect(JSON.stringify(LEGAL_FORMS)).not.toContain('—')
  })

  it('legalFormBySlug gjen formën ose kthen undefined', () => {
    expect(legalFormBySlug('shpk')?.slug).toBe('shpk')
    expect(legalFormBySlug('xxx')).toBeUndefined()
  })

  it('LEGAL_FORM_SLUGS përputhet me LEGAL_FORMS', () => {
    expect([...LEGAL_FORM_SLUGS].sort()).toEqual(LEGAL_FORMS.map((f) => f.slug).sort())
  })
})
