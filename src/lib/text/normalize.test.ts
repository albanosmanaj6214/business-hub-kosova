import { describe, it, expect } from 'vitest'
import { normalizeText, decodeHtmlEntities } from '@/lib/text/normalize'

const ZWSP = String.fromCharCode(0x200b) // zero-width space
const RCHAR = String.fromCharCode(0xfffd) // replacement char

describe('decodeHtmlEntities', () => {
  it('decodes named Latin entities (euml)', () => {
    expect(decodeHtmlEntities('industris&euml; n&euml; Kosov&euml;')).toBe('industrisë në Kosovë')
  })
  it('decodes numeric decimal and hex', () => {
    expect(decodeHtmlEntities('n&#235; Kosov&#xEB;')).toBe('në Kosovë')
  })
  it('leaves unknown named entities untouched', () => {
    expect(decodeHtmlEntities('a &foobar; b')).toBe('a &foobar; b')
  })
})

describe('normalizeText', () => {
  it('decodes entities and normalizes the non-breaking space', () => {
    expect(normalizeText('Ventoro&#160;Motors solli n&euml; Kosov&euml;')).toBe(
      'Ventoro Motors solli në Kosovë',
    )
  })
  it('strips a leading zero-width space', () => {
    expect(normalizeText(ZWSP + 'Qarkullimi')).toBe('Qarkullimi')
  })
  it('drops replacement characters conservatively', () => {
    expect(normalizeText('kthehen në Kosovë p' + RCHAR)).toBe('kthehen në Kosovë p')
  })
  it('handles one level of double-encoding (&amp;euml;)', () => {
    expect(normalizeText('industris&amp;euml;')).toBe('industrisë')
  })
  it('normalizes em/en dashes to a hyphen', () => {
    expect(normalizeText('2020&#8211;2024')).toBe('2020-2024')
  })
  it('collapses whitespace and trims', () => {
    expect(normalizeText('  a   b\n c ')).toBe('a b c')
  })
  it('leaves clean plain text unchanged', () => {
    expect(normalizeText('Rritet paga minimale në Kosovë')).toBe('Rritet paga minimale në Kosovë')
  })
  it('passes through null and undefined', () => {
    expect(normalizeText(null)).toBeNull()
    expect(normalizeText(undefined)).toBeUndefined()
  })
})
