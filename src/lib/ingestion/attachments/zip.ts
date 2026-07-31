// Minimal, dependency-free ZIP reader (DOCX/XLSX/ZIP are ZIP containers). Uses the
// central directory for accurate sizes/offsets and node:zlib inflateRawSync for
// DEFLATE. Read-only: it never executes anything. Bounded against zip bombs.
import { inflateRawSync } from 'node:zlib'

export interface ZipEntry { name: string; compressedSize: number; uncompressedSize: number; method: number; offset: number }
export interface ZipLimits { maxEntries?: number; maxTotalBytes?: number; maxEntryBytes?: number }
const DEFAULTS: Required<ZipLimits> = { maxEntries: 2000, maxTotalBytes: 80 * 1024 * 1024, maxEntryBytes: 25 * 1024 * 1024 }

const EOCD = 0x06054b50, CEN = 0x02014b50, LOC = 0x04034b50

function findEocd(buf: Buffer): number {
  const min = Math.max(0, buf.length - 65_557) // max comment 65535 + 22
  for (let i = buf.length - 22; i >= min; i--) if (buf.readUInt32LE(i) === EOCD) return i
  return -1
}

/** Inventory (names + sizes) from the central directory WITHOUT extracting data. */
export function zipInventory(buf: Buffer, limits: ZipLimits = {}): ZipEntry[] {
  const L = { ...DEFAULTS, ...limits }
  const eocd = findEocd(buf)
  if (eocd < 0) throw new Error('not a zip (no EOCD)')
  const count = buf.readUInt16LE(eocd + 10)
  if (count > L.maxEntries) throw new Error(`zip has too many entries (${count} > ${L.maxEntries})`)
  let p = buf.readUInt32LE(eocd + 16)
  const out: ZipEntry[] = []
  let total = 0
  for (let i = 0; i < count; i++) {
    if (p + 46 > buf.length || buf.readUInt32LE(p) !== CEN) break
    const method = buf.readUInt16LE(p + 10)
    const compressedSize = buf.readUInt32LE(p + 20)
    const uncompressedSize = buf.readUInt32LE(p + 24)
    const fnLen = buf.readUInt16LE(p + 28)
    const extraLen = buf.readUInt16LE(p + 30)
    const cmtLen = buf.readUInt16LE(p + 32)
    const offset = buf.readUInt32LE(p + 42)
    const name = buf.slice(p + 46, p + 46 + fnLen).toString('utf8')
    total += uncompressedSize
    if (uncompressedSize > L.maxEntryBytes) throw new Error(`zip entry too large: ${name}`)
    if (total > L.maxTotalBytes) throw new Error('zip uncompressed size exceeds limit (possible zip bomb)')
    out.push({ name, compressedSize, uncompressedSize, method, offset })
    p += 46 + fnLen + extraLen + cmtLen
  }
  return out
}

/** Extract one named entry's bytes. Returns null if absent. */
export function zipReadFile(buf: Buffer, name: string, limits: ZipLimits = {}): Buffer | null {
  const entry = zipInventory(buf, limits).find((e) => e.name === name)
  if (!entry) return null
  return extractEntry(buf, entry)
}

/** Extract all entries into a name→Buffer map (bounded). */
export function zipReadAll(buf: Buffer, limits: ZipLimits = {}): Map<string, Buffer> {
  const map = new Map<string, Buffer>()
  for (const e of zipInventory(buf, limits)) {
    if (e.name.endsWith('/')) continue // directory
    try { map.set(e.name, extractEntry(buf, e)) } catch { /* skip unreadable entry */ }
  }
  return map
}

function extractEntry(buf: Buffer, e: ZipEntry): Buffer {
  if (buf.readUInt32LE(e.offset) !== LOC) throw new Error('bad local header')
  const fnLen = buf.readUInt16LE(e.offset + 26)
  const extraLen = buf.readUInt16LE(e.offset + 28)
  const dataStart = e.offset + 30 + fnLen + extraLen
  const data = buf.slice(dataStart, dataStart + e.compressedSize)
  if (e.method === 0) return data // stored
  if (e.method === 8) return inflateRawSync(data) // deflate
  throw new Error(`unsupported compression method ${e.method}`)
}
