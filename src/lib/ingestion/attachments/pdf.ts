// Deterministic best-effort PDF text extraction (no AI, no OCR). Inflates FlateDecode
// content streams and reads text-showing operators (Tj / TJ). PDFs with only scanned
// images yield little/no text — reported honestly (not an error).
import { inflateSync } from 'node:zlib'

function decodePdfString(s: string): string {
  return s.replace(/\\(\d{1,3})/g, (_, o) => String.fromCharCode(parseInt(o, 8)))
          .replace(/\\n/g, ' ').replace(/\\r/g, ' ').replace(/\\t/g, ' ')
          .replace(/\\([()\\])/g, '$1')
}

export interface PdfResult { ok: boolean; text: string; streams: number; extractedStreams: number; note: string }

export function extractPdfText(buf: Buffer): PdfResult {
  let streams = 0, extracted = 0
  const chunks: string[] = []
  const s = buf.toString('latin1')
  const re = /stream\r?\n/g
  let m: RegExpExecArray | null
  while ((m = re.exec(s))) {
    streams++
    const start = m.index + m[0].length
    const end = s.indexOf('endstream', start)
    if (end < 0) continue
    const raw = Buffer.from(s.slice(start, end), 'latin1')
    let content: Buffer | null = null
    try { content = inflateSync(raw) } catch { content = null }
    if (!content) continue
    extracted++
    const txt = content.toString('latin1')
    for (const t of Array.from(txt.matchAll(/\(((?:[^()\\]|\\.)*)\)\s*Tj/g))) chunks.push(decodePdfString(t[1]))
    for (const arr of Array.from(txt.matchAll(/\[((?:[^\][]|\\.)*)\]\s*TJ/g))) {
      for (const t of Array.from(arr[1].matchAll(/\(((?:[^()\\]|\\.)*)\)/g))) chunks.push(decodePdfString(t[1]))
    }
  }
  const text = chunks.join(' ').replace(/\s+/g, ' ').trim()
  return { ok: true, text, streams, extractedStreams: extracted, note: text ? 'deterministic text extracted' : 'no extractable text (likely scanned/image PDF) — deferred to enrichment' }
}
