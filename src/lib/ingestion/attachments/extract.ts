// Attachment extraction orchestrator. Verifies the file signature, dispatches to the
// deterministic extractor for the detected format, classifies the role, and computes a
// content hash for duplicate detection. No AI, no OCR, no execution.
import { createHash } from 'node:crypto'
import { verifySignature, extOf, type DetectedFormat } from './signature'
import { extractDocx } from './docx'
import { extractXlsx } from './xlsx'
import { extractPdfText } from './pdf'
import { handleLegacyOle } from './doc'
import { zipInventory } from './zip'
import { classifyAttachmentRole, type AttachmentRole } from './role'

export interface AttachmentExtraction {
  url: string
  filename: string | null
  ext: string | null
  label: string
  role: AttachmentRole
  format: DetectedFormat
  signatureTrusted: boolean
  signatureReason: string
  sha256: string
  byteSize: number
  text: string | null
  tables?: string[][][]
  sheetNames?: string[]
  cells?: Array<{ ref: string; value: string }>
  zipInventory?: Array<{ name: string; uncompressedSize: number }>
  note: string
}

export function extractAttachment(buf: Buffer, url: string, label = '', contentType?: string | null): AttachmentExtraction {
  const ext = extOf(url)
  const sig = verifySignature(buf, url, contentType)
  const sha256 = createHash('sha256').update(buf).digest('hex')
  const base: AttachmentExtraction = {
    url, filename: url.split('/').pop() ?? null, ext, label,
    role: classifyAttachmentRole(label, url), format: sig.detected,
    signatureTrusted: sig.trusted, signatureReason: sig.reason, sha256, byteSize: buf.length,
    text: null, note: '',
  }
  // Reject when the signature does not match the extension (never trust ext/MIME alone).
  if (!sig.trusted) return { ...base, note: `signature mismatch — not extracted (${sig.reason})` }

  if (ext === 'docx') { const r = extractDocx(buf); return { ...base, text: r.text || null, tables: r.tables, note: r.ok ? `docx: ${r.paragraphs} paragraphs, ${r.tables.length} tables` : `docx error: ${r.error}` } }
  if (ext === 'xlsx') { const r = extractXlsx(buf); return { ...base, sheetNames: r.sheetNames, cells: r.cells, text: r.cells.map((c) => c.value).join(' ') || null, note: r.ok ? `xlsx: ${r.sheetNames.length} sheets, ${r.cells.length} cells` : `xlsx error: ${r.error}` } }
  if (ext === 'pdf') { const r = extractPdfText(buf); return { ...base, text: r.text || null, note: r.note } }
  if (ext === 'zip') { const inv = zipInventory(buf).map((e) => ({ name: e.name, uncompressedSize: e.uncompressedSize })); return { ...base, zipInventory: inv, note: `zip inventory: ${inv.length} entries (not extracted)` } }
  if (ext === 'doc' || ext === 'xls') { const r = handleLegacyOle(buf); return { ...base, note: r.note } }
  return { ...base, note: `unhandled type .${ext}` }
}

/** Duplicate detection by content hash across a set of attachments. */
export function dedupeAttachments(items: AttachmentExtraction[]): { unique: AttachmentExtraction[]; duplicates: Array<{ sha256: string; urls: string[] }> } {
  const byHash = new Map<string, AttachmentExtraction[]>()
  for (const a of items) { const arr = byHash.get(a.sha256) ?? []; arr.push(a); byHash.set(a.sha256, arr) }
  const unique: AttachmentExtraction[] = []
  const duplicates: Array<{ sha256: string; urls: string[] }> = []
  for (const [h, arr] of Array.from(byHash)) { unique.push(arr[0]); if (arr.length > 1) duplicates.push({ sha256: h, urls: arr.map((x) => x.url) }) }
  return { unique, duplicates }
}
