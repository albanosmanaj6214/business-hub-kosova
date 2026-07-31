// Deterministic XLSX structured extraction (no AI). XLSX = OOXML zip: sharedStrings +
// per-sheet xml. Returns sheet names + a bounded cell grid of the first sheet.
import { zipReadAll } from './zip'

function decode(s: string): string {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
}

export interface XlsxResult { ok: boolean; sheetNames: string[]; cells: Array<{ ref: string; value: string }>; error?: string }

export function extractXlsx(buf: Buffer, maxCells = 500): XlsxResult {
  try {
    const files = zipReadAll(buf)
    const wb = files.get('xl/workbook.xml')?.toString('utf8') ?? ''
    const sheetNames = Array.from(wb.matchAll(/<sheet\b[^>]*name="([^"]*)"/g)).map((m) => decode(m[1]))
    const ss = files.get('xl/sharedStrings.xml')?.toString('utf8') ?? ''
    const shared: string[] = Array.from(ss.matchAll(/<si>([\s\S]*?)<\/si>/g)).map((m) =>
      Array.from(m[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)).map((x) => decode(x[1])).join(''))
    const sheetKey = Array.from(files.keys()).filter((k) => /^xl\/worksheets\/sheet\d+\.xml$/.test(k)).sort()[0]
    const sheet = sheetKey ? files.get(sheetKey)!.toString('utf8') : ''
    const cells: Array<{ ref: string; value: string }> = []
    for (const m of Array.from(sheet.matchAll(/<c\b[^>]*r="([A-Z]+\d+)"[^>]*?(?:t="([a-z]+)")?[^>]*>([\s\S]*?)<\/c>/g))) {
      if (cells.length >= maxCells) break
      const ref = m[1], type = m[2]
      const v = m[3].match(/<v>([\s\S]*?)<\/v>/)?.[1]
      const inline = m[3].match(/<t\b[^>]*>([\s\S]*?)<\/t>/)?.[1]
      let value = ''
      if (type === 's' && v != null) value = shared[+v] ?? ''
      else if (type === 'inlineStr' && inline != null) value = decode(inline)
      else if (v != null) value = decode(v)
      if (value !== '') cells.push({ ref, value })
    }
    return { ok: true, sheetNames, cells }
  } catch (e) {
    return { ok: false, sheetNames: [], cells: [], error: (e as Error).message }
  }
}
