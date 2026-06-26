import { describe, it, expect } from 'vitest'
import { DOUBLE_TAX_TREATIES, treatyForCountry, type DoubleTaxTreaty } from './treaties'

const SAMPLE: DoubleTaxTreaty[] = [
  { country: 'DE', countrySq: 'Gjermani', hasTreaty: true, status: 'in_force', url: 'https://example.test/de' },
  { country: 'CH', countrySq: 'Zvicër', hasTreaty: false, status: 'none', url: 'https://example.test/ch' },
]

describe('double-tax treaties', () => {
  it('prodhimi nis bosh (pa të dhëna sintetike) dhe është array', () => {
    expect(Array.isArray(DOUBLE_TAX_TREATIES)).toBe(true)
    expect(DOUBLE_TAX_TREATIES.length).toBe(0)
  })

  it('treatyForCountry gjen sipas ISO2 (case-insensitive) te lista e dhënë', () => {
    expect(treatyForCountry('DE', SAMPLE)?.countrySq).toBe('Gjermani')
    expect(treatyForCountry('de', SAMPLE)?.country).toBe('DE')
  })

  it('treatyForCountry kthen undefined për shtet që mungon ose listë bosh', () => {
    expect(treatyForCountry('FR', SAMPLE)).toBeUndefined()
    expect(treatyForCountry('DE', [])).toBeUndefined()
    expect(treatyForCountry('DE')).toBeUndefined() // default = prodhimi bosh
  })

  it('asnjë string s’ka em-dash', () => {
    expect(JSON.stringify(DOUBLE_TAX_TREATIES)).not.toContain('—')
  })
})
