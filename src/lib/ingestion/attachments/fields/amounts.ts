// Deterministic MONETARY-amount extraction with semantic typing. Distinguishes total
// programme budget / min award / max award / grant range / applicant contribution /
// co-financing percentage / eligible-cost ceiling. Guards against confusing programme
// budget with per-applicant award, turnover requirements with grant amounts, percentages
// with monetary amounts, and budget-TEMPLATE example values with official funding limits.
import type { TextSource, Provenance } from './types'
import { sourceChunks } from './chunks'

export type AmountType =
  | 'total_programme_budget'
  | 'minimum_award'
  | 'maximum_award'
  | 'grant_range'
  | 'applicant_contribution'
  | 'co_financing_percentage'
  | 'eligible_cost_ceiling'
  | 'unknown'

export interface AmountResult {
  value: number | null       // numeric (money) or percent value
  currency: string | null    // 'EUR' or null for percentages
  isPercent: boolean
  amountType: AmountType
  isTemplateExample: boolean  // from a budget_template attachment — never an official limit
  matchedText: string
  provenance: Provenance
  confidence: 'EXACT' | 'RULE_MATCH' | 'AMBIGUOUS'
}

// Money token: optional € prefix, grouped digits, optional EUR/€/euro suffix.
const MONEY = /(?:€\s*)?(\d{1,3}(?:[.,\s]\d{3})+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s*(eur\b|€|euro\b)?/gi
const PERCENT = /(\d{1,3}(?:[.,]\d{1,2})?)\s*%/g

/** Parse a grouped SQ/EN number ("10,000" / "10.000" / "10 000" / "10.50") to a number. */
export function parseAmount(raw: string): number | null {
  let s = raw.replace(/€|eur|euro/gi, '').replace(/\s+/g, '').trim()
  if (!s) return null
  const hasDot = s.includes('.'), hasComma = s.includes(',')
  if (hasDot && hasComma) {
    const dec = s.lastIndexOf('.') > s.lastIndexOf(',') ? '.' : ','
    const thou = dec === '.' ? ',' : '.'
    s = s.split(thou).join('').replace(dec, '.')
  } else if (hasDot || hasComma) {
    const sep = hasDot ? '.' : ','
    const parts = s.split(sep)
    const last = parts[parts.length - 1]
    if (parts.length > 1 && last.length === 3) s = parts.join('')            // grouping → thousands
    else if (parts.length === 2 && last.length <= 2) s = `${parts[0]}.${last}` // decimal
    else s = parts.join('')
  }
  const n = Number(s)
  return isNaN(n) ? null : n
}

const TYPE_LABELS: Array<{ type: AmountType; re: RegExp }> = [
  { type: 'total_programme_budget', re: /buxhet(i)?\s+(total|i\s+programit|i\s+p[eë]rgjithsh[eë]m)|fondi\s+total|total\s+(programme\s+)?budget|programme\s+budget/i },
  { type: 'eligible_cost_ceiling', re: /kufi(ri)?\s+i\s+kostove|kostove\s+t[eë]\s+pranueshme|eligible\s+cost(s)?\s+ceiling/i },
  { type: 'applicant_contribution', re: /kontribut(i)?\s+(i\s+)?(aplikant|aplikues)|applicant\s+contribution/i },
  { type: 'minimum_award', re: /shuma\s+minimale|minimumi|vlera\s+minimale|minimum\s+(grant|award|amount)/i },
  { type: 'maximum_award', re: /shuma\s+maksimale|maksimumi|vlera\s+maksimale|deri\s+n[eë]|maximum\s+(grant|award|amount)|up\s+to|per\s+applicant/i },
]
const RANGE = /(nga|prej)\s+.*\bderi\b|\b\d[\d.,\s]*\s*(?:eur|€|euro)?\s*[-–]\s*\d/i
const TURNOVER = /qarkullim|xhiro|t[eë]\s+hyra\s+vjetore|turnover|annual\s+revenue/i
const COFIN = /bashk[eë]\s*-?\s*financim|co-?financing/i

function typeFor(chunk: string): AmountType {
  if (RANGE.test(chunk)) return 'grant_range'
  for (const t of TYPE_LABELS) if (t.re.test(chunk)) return t.type
  return 'unknown'
}

/** All typed monetary + percentage amounts across the sources (order preserved). */
export function findAmounts(sources: TextSource[]): AmountResult[] {
  const out: AmountResult[] = []
  for (const s of sources) {
    if (!s.extractable) continue
    const isTemplate = s.role === 'budget_template'
    for (const c of sourceChunks(s)) {
      const prov: Provenance = { sourceKind: s.kind, attachmentId: s.attachmentId, url: s.url, role: s.role, locator: c.locator }
      const turnover = TURNOVER.test(c.text)
      // Percentages (co-financing / contribution), never treated as money.
      for (const p of Array.from(c.text.matchAll(PERCENT))) {
        const v = parseAmount(p[1])
        out.push({ value: v, currency: null, isPercent: true, amountType: COFIN.test(c.text) ? 'co_financing_percentage' : (TYPE_LABELS.find((t) => t.re.test(c.text))?.type ?? 'co_financing_percentage'), isTemplateExample: isTemplate, matchedText: p[0], provenance: prov, confidence: COFIN.test(c.text) ? 'EXACT' : 'RULE_MATCH' })
      }
      // Monetary amounts — only when a currency marker OR a monetary label is present,
      // to avoid capturing counts/years/ids. Turnover figures are NOT awards.
      const monetaryContext = /eur\b|€|euro\b/i.test(c.text) || typeFor(c.text) !== 'unknown'
      if (!monetaryContext) continue
      for (const m of Array.from(c.text.matchAll(MONEY))) {
        if (!m[2] && !/eur\b|€|euro\b/i.test(c.text)) { /* no currency at all in chunk */ }
        const v = parseAmount(m[1])
        if (v == null) continue
        const type = turnover ? 'unknown' : typeFor(c.text)
        out.push({ value: v, currency: 'EUR', isPercent: false, amountType: type, isTemplateExample: isTemplate, matchedText: m[0].trim(), provenance: prov, confidence: type === 'unknown' ? 'RULE_MATCH' : 'EXACT' })
      }
    }
  }
  return out
}

export interface AwardResult {
  value: number | null
  currency: string | null
  amountType: AmountType | null
  matchedText: string | null
  confidence: 'EXACT' | 'RULE_MATCH' | 'AMBIGUOUS' | 'NOT_FOUND'
  provenance: Provenance | null
}

/** Select the per-applicant AWARD amount from typed amounts, respecting the guards:
 *  template examples and turnover/programme-budget figures never become the award; a
 *  maximum award is preferred, then a range max; genuinely unclear → AMBIGUOUS. */
export function selectAward(amounts: AmountResult[]): AwardResult {
  const eligible = amounts.filter((a) => !a.isTemplateExample && !a.isPercent && a.value != null)
  const max = eligible.find((a) => a.amountType === 'maximum_award')
  if (max) return { value: max.value, currency: max.currency, amountType: 'maximum_award', matchedText: max.matchedText, confidence: 'EXACT', provenance: max.provenance }
  const range = eligible.filter((a) => a.amountType === 'grant_range')
  if (range.length) {
    const top = range.reduce((a, b) => ((b.value ?? 0) > (a.value ?? 0) ? b : a))
    return { value: top.value, currency: top.currency, amountType: 'grant_range', matchedText: top.matchedText, confidence: 'RULE_MATCH', provenance: top.provenance }
  }
  const min = eligible.find((a) => a.amountType === 'minimum_award')
  if (min && eligible.length === 1) return { value: min.value, currency: min.currency, amountType: 'minimum_award', matchedText: min.matchedText, confidence: 'RULE_MATCH', provenance: min.provenance }
  // Only a programme budget / unknown figures → cannot infer a per-applicant award.
  if (eligible.some((a) => a.amountType === 'total_programme_budget') || eligible.length > 1) {
    return { value: null, currency: null, amountType: null, matchedText: null, confidence: 'AMBIGUOUS', provenance: null }
  }
  return { value: null, currency: null, amountType: null, matchedText: null, confidence: 'NOT_FOUND', provenance: null }
}
