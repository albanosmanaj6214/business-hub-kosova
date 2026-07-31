// Deterministic ELIGIBILITY extraction: preserve the COMPLETE official eligibility text
// and surface only safely-detectable structured elements by keyword. It does NOT decide
// whether any specific company is eligible, and does NOT infer eligibility from generic
// introductory language.
import type { TextSource, FieldResult, Provenance } from './types'
import { notFound } from './types'
import { sourceChunks } from './chunks'

export type EligibilityKey =
  | 'applicant_type' | 'msme_category' | 'sector' | 'geographic'
  | 'years_of_operation' | 'employee_threshold' | 'turnover_threshold'
  | 'ownership' | 'registration' | 'co_financing'

export interface EligibilityElement { key: EligibilityKey; matchedText: string; provenance: Provenance }

const HEADING = /(kriteret?\s+e\s+(pranueshm[eë]ris[eë]|p[eë]rzgjedhjes)|p[eë]rfitues(it)?\s+e\s+pranuesh[eë]m|kush\s+mund\s+t[eë]\s+aplikoj|aplikues(it)?\s+e\s+pranuesh[eë]m|eligibility|eligible\s+applicants|who\s+can\s+apply)/i
const STOP = /(dokument(et|acioni)|required\s+documents|afati|deadline|si\s+t[eë]\s+aplikoni|how\s+to\s+apply|buxhet|budget)/i

const ELEMENTS: Array<{ key: EligibilityKey; re: RegExp }> = [
  { key: 'msme_category', re: /\bnmvm\b|\bmsme\b|mikro|nd[eë]rmarrje\s+(mikro|t[eë]\s+vogla|t[eë]\s+mesme)|micro|small\s+and\s+medium/i },
  { key: 'applicant_type', re: /person\s+juridik|person\s+fizik|kompani|biznes|shoq[eë]ri|ojq|nvo|legal\s+entit|natural\s+person|start-?up/i },
  { key: 'sector', re: /sektor(i|it)?|industri|bujq[eë]si|prodhim|turiz[eë]m|teknologji|sector|industry/i },
  { key: 'geographic', re: /kosov[eë]|komun[eë]|territor|regjion|geographic|municipalit/i },
  { key: 'years_of_operation', re: /(t[eë]\s+paktën|minimum)\s+\d+\s+vit|\d+\s+vite\s+(operim|aktivitet)|years?\s+of\s+operation|regjistruar\s+p[eë]r\s+t[eë]\s+paktën/i },
  { key: 'employee_threshold', re: /\d+\s+(t[eë]\s+)?pun[eë](tor[eë]|sues)|numri\s+i\s+t[eë]\s+pun[eë]suarve|employees?/i },
  { key: 'turnover_threshold', re: /qarkullim|xhiro|t[eë]\s+hyra\s+vjetore|turnover|annual\s+revenue/i },
  { key: 'ownership', re: /pron[eë]si|ownership|aksionar|shareholder/i },
  { key: 'registration', re: /regjistr(uar|im)|arbk|certifikat[eë]\s+e\s+biznesit|business\s+registration/i },
  { key: 'co_financing', re: /bashk[eë]\s*-?\s*financim|co-?financing/i },
]

/** Full eligibility text (highest-precedence source that has a labelled section). */
export function findEligibility(sources: TextSource[]): { text: FieldResult<string>; elements: EligibilityElement[] } {
  for (const s of sources) {
    if (!s.extractable) continue
    const chunks = sourceChunks(s)
    const startIdx = chunks.findIndex((c) => HEADING.test(c.text))
    if (startIdx === -1) continue
    const collected: string[] = []
    let loc = chunks[startIdx].locator
    for (let i = startIdx; i < chunks.length; i++) {
      if (i > startIdx && STOP.test(chunks[i].text)) break
      collected.push(chunks[i].text)
      if (collected.join(' ').length > 4000) break
    }
    const text = collected.join('\n').trim()
    if (!text) continue
    const prov: Provenance = { sourceKind: s.kind, attachmentId: s.attachmentId, url: s.url, role: s.role, locator: loc }
    const elements: EligibilityElement[] = []
    const seen = new Set<string>()
    for (const c of chunks.slice(startIdx)) {
      for (const el of ELEMENTS) {
        if (seen.has(el.key)) continue
        if (el.re.test(c.text)) { elements.push({ key: el.key, matchedText: c.text.slice(0, 200), provenance: { sourceKind: s.kind, attachmentId: s.attachmentId, url: s.url, role: s.role, locator: c.locator } }); seen.add(el.key) }
      }
    }
    return { text: { value: text.slice(0, 4000), matchedText: text.slice(0, 200), confidence: 'RULE_MATCH', provenance: prov, candidates: [] }, elements }
  }
  return { text: notFound<string>(), elements: [] }
}
