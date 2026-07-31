// Shared types for DETERMINISTIC (rule-based, no AI / no OCR) field extraction from
// KIESA official documents and HTML. Every extracted field carries its source provenance
// and an explicit confidence so downstream consumers can reason about reliability and
// route only genuinely ambiguous/unavailable cases to a future optional AI/OCR fallback.
import type { AttachmentRole } from '../role'

export type Confidence = 'EXACT' | 'RULE_MATCH' | 'AMBIGUOUS' | 'NOT_FOUND'
export type TextSourceKind = 'html' | 'docx' | 'pdf' | 'xlsx' | 'doc' | 'xls' | 'zip' | 'unknown'

/** A scannable text unit: the HTML detail page or one extracted attachment. */
export interface TextSource {
  kind: TextSourceKind
  attachmentId: string | null // stable id (sha256) — null for html
  url: string | null
  role: AttachmentRole | null // null for html
  extractable: boolean        // false for OLE2 .doc/.xls / scanned pdf (no deterministic text)
  text: string                // block-structured text (newline between blocks)
  tables?: string[][][]
  cells?: Array<{ ref: string; value: string }>
}

export interface Provenance {
  sourceKind: TextSourceKind
  attachmentId: string | null
  url: string | null
  role: AttachmentRole | null
  locator: string // e.g. "html:para3", "docx:table0:row2", "xlsx:cells"
}

export interface FieldResult<T> {
  value: T | null
  matchedText: string | null
  confidence: Confidence
  provenance: Provenance | null
  /** All distinct candidates found (populated especially when AMBIGUOUS). */
  candidates: Array<{ value: T; matchedText: string; provenance: Provenance }>
}

export function notFound<T>(): FieldResult<T> {
  return { value: null, matchedText: null, confidence: 'NOT_FOUND', provenance: null, candidates: [] }
}
