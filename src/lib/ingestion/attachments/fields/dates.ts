// Deterministic APPLICATION-DEADLINE extraction. A date is accepted as the application
// deadline ONLY when it sits in an explicitly labelled application-deadline context
// (SQ + EN). Publication / clarification / event / implementation / contract / reference
// dates are actively excluded. Multiple conflicting application deadlines → AMBIGUOUS
// (never silently pick one). No AI, no OCR.
import type { TextSource, FieldResult, Provenance } from './types'
import { notFound } from './types'
import { sourceChunks } from './chunks'

const SQ_MONTHS: Record<string, number> = {
  janar: 1, shkurt: 2, mars: 3, prill: 4, maj: 5, qershor: 6, korrik: 7,
  gusht: 8, shtator: 9, tetor: 10, nentor: 11, 'nëntor': 11, dhjetor: 12,
}
const EN_MONTHS: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7,
  august: 8, september: 9, october: 10, november: 11, december: 12,
}

const NUM_DATE = /\b(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})\b/g
const TXT_DATE = /\b(\d{1,2})\s+(janar|shkurt|mars|prill|maj|qershor|korrik|gusht|shtator|tetor|n[eë]ntor|dhjetor|january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})\b/gi

function iso(y: number, m: number, d: number): string | null {
  if (m < 1 || m > 12 || d < 1 || d > 31) return null
  const dt = new Date(Date.UTC(y, m - 1, d))
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null
  return dt.toISOString().slice(0, 10)
}

export interface DateHit { isoDate: string; matchedText: string }

/** All parseable dates in a text chunk (numeric dd/mm/yyyy + textual "d Month yyyy"). */
export function findDatesInText(text: string): DateHit[] {
  const hits: DateHit[] = []
  for (const m of Array.from(text.matchAll(NUM_DATE))) {
    const v = iso(Number(m[3]), Number(m[2]), Number(m[1]))
    if (v) hits.push({ isoDate: v, matchedText: m[0] })
  }
  for (const m of Array.from(text.matchAll(TXT_DATE))) {
    const mm = SQ_MONTHS[m[2].toLowerCase()] ?? EN_MONTHS[m[2].toLowerCase()]
    const v = mm ? iso(Number(m[3]), mm, Number(m[1])) : null
    if (v) hits.push({ isoDate: v, matchedText: m[0] })
  }
  return hits
}

const DEADLINE_LABELS: RegExp[] = [
  /afati\s+(i\s+)?(fundit\s+)?(p[eë]r\s+)?aplikim/i,
  /afati\s+i\s+fundit/i,
  /aplikim\w*(\s+\w+){0,4}\s+dor[eë]zoh\w*\s+deri/i,
  /dor[eë]zohen\s+deri\s+m[eë]/i,
  /data\s+e\s+mbylljes/i,
  /application\s+deadline/i,
  /closing\s+date/i,
  /applications?\s+must\s+be\s+submitted\s+by/i,
  /submission\s+deadline/i,
  /deadline\s+for\s+applications?/i,
]

const EXCLUDE_LABELS: Array<{ cat: string; re: RegExp }> = [
  { cat: 'publication', re: /data\s+e\s+publikimit|publikuar\s+m[eë]|published(\s+on)?|prishtin[eë]\s*,/i },
  { cat: 'clarification', re: /sqarim|pyetje|clarification|questions?\s+deadline|q&a/i },
  { cat: 'event', re: /data\s+e\s+(ngjarjes|mbajtjes)|event\s+date|forum(i)?\s+ekonomik|takim(i)?|do\s+t[eë]\s+mbahet/i },
  { cat: 'implementation', re: /implementim|implementation\s+period|periudha\s+e\s+zbatimit/i },
  { cat: 'contract', re: /kontrat|contract\s+period/i },
  { cat: 'reference', re: /\bnr\.?\s*\d|\bref\.?\s*\d|referenc/i },
]

function hasDeadlineLabel(t: string): boolean { return DEADLINE_LABELS.some((re) => re.test(t)) }
function excludedCategory(t: string): string | null {
  for (const e of EXCLUDE_LABELS) if (e.re.test(t)) return e.cat
  return null
}

/** Extract the application deadline from an ordered (precedence-sorted) source list.
 *  The FIRST source that yields ≥1 labelled deadline is authoritative; if that source
 *  yields >1 distinct date, the result is AMBIGUOUS. */
export function findDeadline(sources: TextSource[]): FieldResult<string> {
  for (const s of sources) {
    if (!s.extractable) continue
    const chunks = sourceChunks(s)
    const strong = new Map<string, { matchedText: string; provenance: Provenance }>()
    const weak = new Map<string, { matchedText: string; provenance: Provenance }>()

    // Pass 1 — label and date in the SAME chunk (row/paragraph) → EXACT.
    chunks.forEach((c) => {
      if (!hasDeadlineLabel(c.text)) return
      for (const d of findDatesInText(c.text)) {
        strong.set(d.isoDate, { matchedText: c.text.slice(0, 200), provenance: { sourceKind: s.kind, attachmentId: s.attachmentId, url: s.url, role: s.role, locator: c.locator } })
      }
    })
    // Pass 2 — a lone label chunk immediately followed by a date chunk → RULE_MATCH.
    for (let i = 0; i < chunks.length - 1; i++) {
      if (!hasDeadlineLabel(chunks[i].text) || findDatesInText(chunks[i].text).length) continue
      const next = chunks[i + 1]
      if (excludedCategory(next.text)) continue
      for (const d of findDatesInText(next.text)) {
        if (!strong.has(d.isoDate)) weak.set(d.isoDate, { matchedText: `${chunks[i].text} → ${next.text}`.slice(0, 200), provenance: { sourceKind: s.kind, attachmentId: s.attachmentId, url: s.url, role: s.role, locator: next.locator } })
      }
    }

    const bucket = strong.size ? strong : weak
    const conf = strong.size ? 'EXACT' : 'RULE_MATCH'
    if (bucket.size === 0) continue
    const candidates = Array.from(bucket.entries()).map(([isoDate, v]) => ({ value: isoDate, matchedText: v.matchedText, provenance: v.provenance }))
    if (candidates.length > 1) {
      return { value: null, matchedText: null, confidence: 'AMBIGUOUS', provenance: null, candidates }
    }
    return { value: candidates[0].value, matchedText: candidates[0].matchedText, confidence: conf, provenance: candidates[0].provenance, candidates }
  }
  return notFound<string>()
}
