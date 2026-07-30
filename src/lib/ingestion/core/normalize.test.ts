import { describe, it, expect } from 'vitest'
import {
  normalizeText, normalizeTitle, canonicalizeUrl, parseDateSafe, normalizeCurrency,
  normalizeDecimal, normalizeCountryCode, normalizeLanguageCode, formatHsCode, formatNaceCode,
} from './normalize'

describe('normalize — preserves originals, fixes safely', () => {
  it('fixes mojibake but keeps Albanian ë/ç and preserves the original', () => {
    const r = normalizeText('BiznesÃ«t nÃ« KosovÃ«')
    expect(r.value).toBe('Biznesët në Kosovë')
    expect(r.original).toBe('BiznesÃ«t nÃ« KosovÃ«')
  })
  it('decodes entities and collapses whitespace', () => {
    expect(normalizeText('A &amp;  B\n\tC').value).toBe('A & B C')
  })
  it('normalizeTitle trims trailing separators, keeps case', () => {
    expect(normalizeTitle('  Grant për eksport —  ').value).toBe('Grant për eksport')
  })
  it('canonicalizes URLs: lowercases host, drops utm + fragment, keeps real params', () => {
    expect(canonicalizeUrl('HTTPS://Example.ORG/a?utm_source=x&b=2#frag').value).toBe('https://example.org/a?b=2')
    expect(canonicalizeUrl('https://example.org/a/').value).toBe('https://example.org/a')
  })
  it('flags an invalid URL without throwing', () => {
    const r = canonicalizeUrl('not a url')
    expect(r.warnings.length).toBe(1)
    expect(r.value).toBe('not a url')
  })
  it('parses ISO dates and unambiguous dd/mm', () => {
    expect(parseDateSafe('2026-08-15').value).toBe('2026-08-15')
    expect(parseDateSafe('15/08/2026').value).toBe('2026-08-15')
  })
  it('swaps mm/dd and warns', () => {
    const r = parseDateSafe('03/13/2026')
    expect(r.value).toBe('2026-03-13')
    expect(r.warnings.some((w) => w.reason === 'date_swapped_mm_dd')).toBe(true)
  })
  it('warns on ambiguous dd/mm when day-first not assumed', () => {
    expect(parseDateSafe('02/03/2026').warnings.some((w) => w.reason === 'date_ambiguous_dd_mm')).toBe(true)
    expect(parseDateSafe('02/03/2026', { assumeDayFirst: true }).warnings.length).toBe(0)
  })
  it('normalizes currency + decimal separators', () => {
    expect(normalizeCurrency('€').value).toBe('EUR')
    expect(normalizeDecimal('10.000,50').value).toBe(10000.5)
    expect(normalizeDecimal('1,234.56').value).toBe(1234.56)
    expect(normalizeDecimal('10000').value).toBe(10000)
  })
  it('normalizes country + language codes', () => {
    expect(normalizeCountryCode('Kosova').value).toBe('XK')
    expect(normalizeCountryCode('de').value).toBe('DE')
    expect(normalizeCountryCode('Wakanda').warnings.length).toBe(1)
    expect(normalizeLanguageCode('Shqip').value).toBe('sq')
  })
  it('formats HS and NACE codes; rejects bad lengths', () => {
    expect(formatHsCode('2204 10 00').value).toBe('2204.10.00')
    expect(formatHsCode('220').warnings.length).toBe(1)
    expect(formatNaceCode('1102').value).toBe('11.02')
  })
})
