// Split a TextSource into scannable chunks with a stable locator each. Table ROWS are
// kept whole so a "label | value" layout (label in one cell, value in the next) is
// scanned together. XLSX cells are exposed both as a joined chunk and per-cell.
import type { TextSource } from './types'

export interface Chunk { text: string; locator: string }

export function sourceChunks(s: TextSource): Chunk[] {
  const chunks: Chunk[] = []
  s.text.split(/\n+/).map((p) => p.trim()).filter(Boolean)
    .forEach((p, i) => chunks.push({ text: p, locator: `${s.kind}:para${i}` }))
  if (s.tables) {
    s.tables.forEach((tbl, ti) => tbl.forEach((row, ri) => {
      const joined = row.map((c) => c.trim()).filter(Boolean).join(' | ')
      if (joined) chunks.push({ text: joined, locator: `${s.kind}:table${ti}:row${ri}` })
    }))
  }
  if (s.cells && s.cells.length) {
    const joined = s.cells.map((c) => c.value).filter(Boolean).join(' | ')
    if (joined) chunks.push({ text: joined, locator: `${s.kind}:cells` })
  }
  return chunks
}
