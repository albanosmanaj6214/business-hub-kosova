import { describe, it, expect } from 'vitest'
import { validateGuideShape, assertGuideShape, isBilingual } from './export-guide-shape'

const bi = (en: string) => ({ sq: en, en })

/** Udhëzues i vlefshëm minimal, i modeluar sipas asaj që vizaton faqja. */
const OK = {
  customs: {
    vat: '20%',
    authority: { name: 'Dogana', url: 'https://example.gov' },
    importDuties: bi('Duties apply.'),
  },
  requiredDocs: [{ name: bi('Invoice'), description: bi('Commercial invoice'), issuedBy: 'Exporter', mandatory: true }],
  certifications: [{ name: 'ISO 9001', description: bi('Quality'), authority: 'ISO', appliesTo: ['ushqim'] }],
  labeling: { languages: ['sq', 'en'], rules: [{ rule: bi('Label in Albanian'), mandatory: true }] },
  sectorRules: [{ sector: 'Ushqim dhe pije', rules: [{ rule: bi('Keep cold'), mandatory: true }] }],
  tradeAgreements: [{ name: 'CEFTA', benefit: bi('Duty free') }],
}

describe('kontrata e formës së udhëzuesit', () => {
  it('e pranon një udhëzues të vlefshëm', () => {
    expect(validateGuideShape(OK)).toEqual([])
  })

  it('e pranon një udhëzues krejt bosh', () => {
    expect(validateGuideShape({})).toEqual([])
  })

  it('nuk i quan shkelje fushat null ose që mungojnë', () => {
    expect(validateGuideShape({ customs: { vat: null }, requiredDocs: [{ name: bi('x') }] })).toEqual([])
  })

  // Ky është saktësisht gabimi që prishi tre faqe më 26 gusht 2026.
  it('e kap objektin te tradeAgreements[].name, fusha që faqja e vizaton drejtpërdrejt', () => {
    const keq = { ...OK, tradeAgreements: [{ name: bi('Një paragraf i tërë'), benefit: bi('x') }] }
    const v = validateGuideShape(keq)
    expect(v).toHaveLength(1)
    expect(v[0].severity).toBe('RENDER_BREAK')
    expect(v[0].path).toBe('tradeAgreements[].name')
  })

  it('e kap objektin te certifications[].name dhe sectorRules[].sector', () => {
    const v = validateGuideShape({
      certifications: [{ name: bi('ISO') }],
      sectorRules: [{ sector: bi('Ushqim'), rules: [] }],
    })
    expect(v.map((x) => x.path).sort()).toEqual(['certifications[].name', 'sectorRules[].sector'])
    expect(v.every((x) => x.severity === 'RENDER_BREAK')).toBe(true)
  })

  // Klasa e kundërt: teksti nuk e prish faqen, thjesht zhduket pa zë.
  it('e kap vargun aty ku pritet {sq,en}, sepse teksti humbet në heshtje', () => {
    const v = validateGuideShape({ labeling: { rules: [{ rule: 'varg i thjeshtë', mandatory: true }] } })
    expect(v).toHaveLength(1)
    expect(v[0].severity).toBe('TEXT_LOST')
    expect(v[0].path).toBe('labeling.rules[].rule')
  })

  it('e kap tekstin e humbur brenda rregullave sektoriale të ndërthurura', () => {
    const v = validateGuideShape({ sectorRules: [{ sector: 'Tekstil', rules: [{ rule: 'varg' }] }] })
    expect(v).toHaveLength(1)
    expect(v[0].path).toBe('sectorRules[].rules[].rule')
  })

  it('e kërkon që gjuhët dhe appliesTo të jenë vargje vargjesh', () => {
    const v = validateGuideShape({
      labeling: { languages: [{ sq: 'shqip' }], rules: [] },
      certifications: [{ name: 'ISO', appliesTo: [1, 2] }],
    })
    expect(v.map((x) => x.path).sort()).toEqual(['certifications[].appliesTo', 'labeling.languages'])
  })

  it('pranon një objekt dygjuhësh me vetëm njërën gjuhë', () => {
    expect(isBilingual({ en: 'only english' })).toBe(true)
    expect(isBilingual({ sq: 'vetëm shqip' })).toBe(true)
    expect(isBilingual({})).toBe(false)
    expect(isBilingual('varg')).toBe(false)
    expect(isBilingual(['a'])).toBe(false)
  })

  it('i numëron të gjitha shkeljet, jo vetëm të parën', () => {
    const v = validateGuideShape({
      tradeAgreements: [{ name: bi('a'), benefit: 'varg' }, { name: bi('b'), benefit: bi('ok') }],
    })
    expect(v).toHaveLength(3)
  })
})

describe('porta e shkrimit', () => {
  it('e lejon një udhëzues të vlefshëm të kalojë pa zhurmë', () => {
    expect(() => assertGuideShape(OK, 'FR')).not.toThrow()
  })

  it('e ndal shkrimin dhe e emërton fushën fajtore', () => {
    const keq = { tradeAgreements: [{ name: { sq: 'x', en: 'x' } }] }
    expect(() => assertGuideShape(keq, 'CH')).toThrow(/CH/)
    expect(() => assertGuideShape(keq, 'CH')).toThrow(/tradeAgreements\[\]\.name/)
    expect(() => assertGuideShape(keq, 'CH')).toThrow(/RENDER_BREAK/)
  })
})
