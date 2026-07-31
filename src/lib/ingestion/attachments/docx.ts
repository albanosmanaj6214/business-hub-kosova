// Deterministic DOCX text + table extraction (no AI). DOCX = OOXML zip; the body is
// word/document.xml. We extract paragraph text and table cells structurally.
import { zipReadFile } from './zip'

function decode(s: string): string {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
}
function runsText(xml: string): string {
  // join <w:t> runs; a paragraph boundary </w:p> becomes a newline; <w:tab/> -> space
  const withBreaks = xml.replace(/<w:tab\b[^>]*\/>/g, ' ').replace(/<\/w:p>/g, '\n')
  const parts: string[] = []
  const re = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>|(\n)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(withBreaks))) parts.push(m[1] != null ? decode(m[1]) : '\n')
  return parts.join('').replace(/\n{3,}/g, '\n\n').replace(/[ \t]+/g, ' ').trim()
}

export interface DocxResult { ok: boolean; text: string; tables: string[][][]; paragraphs: number; error?: string }

export function extractDocx(buf: Buffer): DocxResult {
  try {
    const doc = zipReadFile(buf, 'word/document.xml')
    if (!doc) return { ok: false, text: '', tables: [], paragraphs: 0, error: 'word/document.xml missing' }
    const xml = doc.toString('utf8')
    const text = runsText(xml)
    const tables: string[][][] = []
    for (const t of xml.match(/<w:tbl>[\s\S]*?<\/w:tbl>/g) ?? []) {
      const rows: string[][] = []
      for (const r of t.match(/<w:tr\b[\s\S]*?<\/w:tr>/g) ?? []) {
        const cells: string[] = []
        for (const c of r.match(/<w:tc>[\s\S]*?<\/w:tc>/g) ?? []) cells.push(runsText(c).replace(/\n/g, ' ').trim())
        rows.push(cells)
      }
      tables.push(rows)
    }
    return { ok: true, text, tables, paragraphs: (xml.match(/<\/w:p>/g) ?? []).length }
  } catch (e) {
    return { ok: false, text: '', tables: [], paragraphs: 0, error: (e as Error).message }
  }
}
