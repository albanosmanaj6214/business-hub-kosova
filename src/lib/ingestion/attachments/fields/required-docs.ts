// Deterministic REQUIRED-DOCUMENTS extraction. Reads an EXPLICIT required-documents list
// (labelled section) and preserves the items IN ORDER with their original text + source
// location. It does NOT treat every downloadable attachment as a required submission
// document — only what the official text lists.
import type { TextSource, Provenance } from './types'
import { sourceChunks } from './chunks'

export interface RequiredDoc { index: number; text: string; docType: string | null; provenance: Provenance }

// Require an explicit qualifier so the generic word "Dokumentet" in prose (e.g.
// "Dokumentet zyrtare janë bashkëngjitur") does NOT open a required-documents section.
const HEADING = /(dokument(et|acioni|e)\s+(e\s+nevojsh\w+|e\s+k[eë]rkuar\w*|p[eë]r\s+aplikim|q[eë]\s+k[eë]rkohen)|dokumentacioni\s+i\s+k[eë]rkuar|required\s+documents?|list[aë]\s+e\s+dokumenteve\s+t[eë]\s+nevojsh\w+)/i
const STOP = /(afati|deadline|si\s+t[eë]\s+aplikoni|how\s+to\s+apply|kriteret|eligibility|application\s+channel|https?:|p[eë]rmes\s+portalit|aplikimi\s+b[eë]het|p[eë]r\s+pyetje)/i
const BULLET = /^\s*(?:[-•*]|\d+[.)]|[a-zç][.)])\s+/i

const DOC_TYPES: Array<{ type: string; re: RegExp }> = [
  { type: 'application_form', re: /formular(i)?\s+(i\s+)?aplikim|application\s+form|aplikacion/i },
  { type: 'business_registration', re: /regjistrim\w*\s+(t[eë]\s+)?biznesit|certifikat[aeë]\s+e\s+biznesit|arbk|business\s+registration/i },
  { type: 'tax_certificate', re: /certifikat[aeë]\s+tatimore|certifikat[aeë]\s+e\s+atk|v[eë]rtetim\s+tatimor|tax\s+certificate|\batk\b/i },
  { type: 'financial_statements', re: /pasqyr(a|at)\s+financiare|bilanc|financial\s+statements?/i },
  { type: 'declaration', re: /deklarat/i },
  { type: 'project_proposal', re: /propozim\w*\s+(i\s+)?projekt|project\s+proposal/i },
  { type: 'budget', re: /buxhet|budget/i },
  { type: 'quotations', re: /oferta|kuotim|quotation/i },
  { type: 'licence_permit', re: /licenc|leje|permit|licen[cs]e/i },
  { type: 'technical_form', re: /formular(i)?\s+teknik|technical\s+form/i },
]

function docType(t: string): string | null {
  for (const d of DOC_TYPES) if (d.re.test(t)) return d.type
  return null
}

export function findRequiredDocuments(sources: TextSource[]): RequiredDoc[] {
  for (const s of sources) {
    if (!s.extractable) continue
    const chunks = sourceChunks(s)
    const startIdx = chunks.findIndex((c) => HEADING.test(c.text))
    if (startIdx === -1) continue
    const docs: RequiredDoc[] = []
    for (let i = startIdx + 1; i < chunks.length; i++) {
      const t = chunks[i].text
      if (STOP.test(t)) break
      // Accept bulleted/numbered items, or " | "-joined table rows within the section.
      const items = BULLET.test(t) ? [t] : t.split(/\s\|\s|;/).map((x) => x.trim()).filter((x) => x.length > 2 && x.length < 200 && docType(x))
      for (const raw of items) {
        const clean = raw.replace(BULLET, '').trim()
        if (!clean) continue
        docs.push({ index: docs.length, text: clean, docType: docType(clean), provenance: { sourceKind: s.kind, attachmentId: s.attachmentId, url: s.url, role: s.role, locator: chunks[i].locator } })
      }
      if (docs.length > 40) break
    }
    if (docs.length) return docs
  }
  return []
}
