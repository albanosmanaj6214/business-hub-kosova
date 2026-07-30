// Shared, deterministic normalization utilities. Every function preserves the
// ORIGINAL value separately from the normalized value and never silently alters
// factual meaning: uncertain transformations emit a warning + confidence.
export interface NormResult<T> {
  value: T
  original: T
  changed: boolean
  warnings: { reason: string; confidence: number }[]
}

function ok<T>(value: T, original: T, warnings: NormResult<T>['warnings'] = []): NormResult<T> {
  return { value, original, changed: value !== original, warnings }
}

// Common UTF-8-decoded-as-latin1 mojibake seen in Albanian text.
const MOJIBAKE: [RegExp, string][] = [
  [/Ã«/g, 'ë'], [/Ã‡/g, 'Ç'], [/Ã§/g, 'ç'], [/Ã‹/g, 'Ë'],
  [/â€“/g, '-'], [/â€”/g, '-'], [/â€™/g, "'"], [/â€œ/g, '"'], [/â€/g, '"'], [/Â /g, ' '],
]
const HTML_ENTITIES: Record<string, string> = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&apos;': "'",
  '&nbsp;': ' ', '&euro;': '€', '&ndash;': '-', '&mdash;': '-', '&hellip;': '…',
}

export function normalizeUnicode(input: string): NormResult<string> {
  const original = input
  let v = input.normalize('NFC')
  for (const [re, to] of MOJIBAKE) v = v.replace(re, to)
  return ok(v, original)
}

export function stripInvisible(input: string): NormResult<string> {
  // zero-width space/joiner/BOM/soft hyphen
  const v = input.replace(/[​-‍﻿­]/g, '')
  return ok(v, input)
}

export function decodeHtmlEntities(input: string): NormResult<string> {
  let v = input
  for (const [ent, ch] of Object.entries(HTML_ENTITIES)) v = v.split(ent).join(ch)
  v = v.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  return ok(v, input)
}

export function normalizeWhitespace(input: string): NormResult<string> {
  const v = input.replace(/\s+/g, ' ').trim()
  return ok(v, input)
}

/** Full text pipeline: unicode → entities → invisible → whitespace. Preserves ë/ç. */
export function normalizeText(input: string): NormResult<string> {
  const original = input
  const a = normalizeUnicode(input).value
  const b = decodeHtmlEntities(a).value
  const c = stripInvisible(b).value
  const d = normalizeWhitespace(c).value
  return ok(d, original)
}

export function normalizeTitle(input: string): NormResult<string> {
  // Preserve case (proper nouns); only clean text + drop a trailing separator.
  const cleaned = normalizeText(input).value.replace(/[\s\-–—|·]+$/, '').trim()
  return ok(cleaned, input)
}

export function normalizeOrgName(input: string): NormResult<string> {
  const cleaned = normalizeText(input).value.replace(/\b(sh\.?p\.?k\.?|l\.?l\.?c\.?|gmbh|ltd)\b\.?$/i, (m) => m.toUpperCase().replace(/\.$/, ''))
  return ok(cleaned.trim(), input)
}

const TRACKING = /^(utm_|fbclid$|gclid$|mc_)/i
export function canonicalizeUrl(input: string): NormResult<string> {
  const original = input
  try {
    const u = new URL(input.trim())
    u.hostname = u.hostname.toLowerCase()
    u.hash = ''
    const keep: [string, string][] = []
    u.searchParams.forEach((val, key) => { if (!TRACKING.test(key)) keep.push([key, val]) })
    u.search = ''
    keep.sort(([a], [b]) => a.localeCompare(b)).forEach(([k, v]) => u.searchParams.append(k, v))
    let s = u.toString()
    if (s.endsWith('/') && u.pathname !== '/') s = s.slice(0, -1)
    return ok(s, original)
  } catch {
    return { value: original, original, changed: false, warnings: [{ reason: 'url_i_pavlefshem', confidence: 0 }] }
  }
}

/** Parse a date safely. Ambiguous dd/mm vs mm/dd yields a warning + lower confidence. */
export function parseDateSafe(input: string, opts: { assumeDayFirst?: boolean } = {}): NormResult<string | null> {
  const original = input as unknown as string | null
  const s = input.trim()
  const warnings: NormResult<string | null>['warnings'] = []
  // ISO first
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s)
  if (iso) return { value: `${iso[1]}-${iso[2]}-${iso[3]}`, original, changed: true, warnings }
  const dmy = /^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})/.exec(s)
  if (dmy) {
    let d = Number(dmy[1]); let m = Number(dmy[2]); const y = Number(dmy[3])
    if (d > 12 && m <= 12) { /* unambiguous dd/mm */ }
    else if (m > 12 && d <= 12) { const t = d; d = m; m = t; warnings.push({ reason: 'date_swapped_mm_dd', confidence: 0.6 }) }
    else if (!opts.assumeDayFirst) { warnings.push({ reason: 'date_ambiguous_dd_mm', confidence: 0.5 }) }
    if (m < 1 || m > 12 || d < 1 || d > 31) return { value: null, original, changed: true, warnings: [{ reason: 'date_invalide', confidence: 0 }] }
    return { value: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`, original, changed: true, warnings }
  }
  return { value: null, original, changed: true, warnings: [{ reason: 'date_e_panjohur', confidence: 0 }] }
}

const CURRENCY_MAP: Record<string, string> = { '€': 'EUR', 'eur': 'EUR', 'euro': 'EUR', '$': 'USD', usd: 'USD', '£': 'GBP', gbp: 'GBP', chf: 'CHF' }
export function normalizeCurrency(input: string): NormResult<string | null> {
  const key = input.trim().toLowerCase()
  const v = CURRENCY_MAP[key] ?? CURRENCY_MAP[input.trim()] ?? null
  if (!v) return { value: null, original: input as unknown as string | null, changed: true, warnings: [{ reason: 'valute_e_panjohur', confidence: 0 }] }
  return { value: v, original: input as unknown as string | null, changed: true, warnings: [] }
}

/** Normalize a decimal that may use comma decimal + dot/space thousands. */
export function normalizeDecimal(input: string): NormResult<number | null> {
  const original = input as unknown as number | null
  let s = input.trim().replace(/\s/g, '')
  const warnings: NormResult<number | null>['warnings'] = []
  const hasComma = s.includes(','); const hasDot = s.includes('.')
  if (hasComma && hasDot) {
    // last separator is the decimal
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) s = s.replace(/\./g, '').replace(',', '.')
    else s = s.replace(/,/g, '')
  } else if (hasComma) {
    // comma as decimal (EU) unless it looks like thousands (e.g. 1,000)
    if (/,\d{3}(\D|$)/.test(s) && !/,\d{1,2}$/.test(s)) { s = s.replace(/,/g, ''); warnings.push({ reason: 'presje_si_mijëshe', confidence: 0.7 }) }
    else s = s.replace(',', '.')
  }
  const n = Number(s)
  if (Number.isNaN(n)) return { value: null, original, changed: true, warnings: [{ reason: 'numer_i_pavlefshem', confidence: 0 }] }
  return { value: n, original, changed: true, warnings }
}

const COUNTRY_MAP: Record<string, string> = {
  kosova: 'XK', kosovë: 'XK', kosovo: 'XK', xk: 'XK', shqipëria: 'AL', shqiperia: 'AL', albania: 'AL', al: 'AL',
  gjermania: 'DE', germany: 'DE', de: 'DE', 'north macedonia': 'MK', maqedonia: 'MK', mk: 'MK', serbia: 'RS', rs: 'RS',
}
export function normalizeCountryCode(input: string): NormResult<string | null> {
  const key = input.trim().toLowerCase()
  const v = COUNTRY_MAP[key] ?? (/^[A-Za-z]{2}$/.test(input.trim()) ? input.trim().toUpperCase() : null)
  if (!v) return { value: null, original: input as unknown as string | null, changed: true, warnings: [{ reason: 'shtet_i_panjohur', confidence: 0 }] }
  return { value: v, original: input as unknown as string | null, changed: true, warnings: [] }
}

export function normalizeLanguageCode(input: string): NormResult<string | null> {
  const map: Record<string, string> = { sq: 'sq', shqip: 'sq', albanian: 'sq', en: 'en', english: 'en', de: 'de', german: 'de' }
  const v = map[input.trim().toLowerCase()] ?? (/^[a-z]{2}$/i.test(input.trim()) ? input.trim().toLowerCase() : null)
  return v ? ok(v, input as unknown as string | null) : { value: null, original: input as unknown as string | null, changed: true, warnings: [{ reason: 'gjuhë_e_panjohur', confidence: 0 }] }
}

/** HS code: keep digits, group as HHHH.HH.HH; require 2/4/6/8/10 digits. */
export function formatHsCode(input: string): NormResult<string | null> {
  const digits = input.replace(/\D/g, '')
  if (![2, 4, 6, 8, 10].includes(digits.length)) {
    return { value: null, original: input as unknown as string | null, changed: true, warnings: [{ reason: 'hs_gjatesi_e_pavlefshme', confidence: 0 }] }
  }
  const parts = digits.match(/.{1,2}/g) ?? []
  const grouped = parts[0] + (parts[1] ? parts[1] : '') + (parts.length > 2 ? '.' + parts.slice(2).join('.') : '')
  return ok(grouped, input as unknown as string | null)
}

/** NACE code: keep digits, format as NN.NN. */
export function formatNaceCode(input: string): NormResult<string | null> {
  const digits = input.replace(/\D/g, '')
  if (digits.length < 2 || digits.length > 4) {
    return { value: null, original: input as unknown as string | null, changed: true, warnings: [{ reason: 'nace_gjatesi_e_pavlefshme', confidence: 0 }] }
  }
  const v = digits.length <= 2 ? digits : digits.slice(0, 2) + '.' + digits.slice(2)
  return ok(v, input as unknown as string | null)
}
