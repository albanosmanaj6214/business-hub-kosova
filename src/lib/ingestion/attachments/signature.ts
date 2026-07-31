// Deterministic file-signature (magic-byte) detection + MIME/extension cross-check.
// No external libraries. Used to verify every downloaded official attachment.
export type DetectedFormat = 'pdf' | 'ooxml_zip' | 'ole2' | 'zip' | 'unknown'

export interface SignatureResult {
  detected: DetectedFormat
  ext: string | null
  declaredContentType: string | null
  trusted: boolean      // signature is consistent with the extension
  reason: string
}

const OOXML_EXT = new Set(['docx', 'xlsx', 'pptx'])

function magic(buf: Buffer): DetectedFormat {
  if (buf.length >= 4 && buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) return 'pdf' // %PDF
  if (buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4b && (buf[2] === 0x03 || buf[2] === 0x05 || buf[2] === 0x07)) return 'ooxml_zip' // PK.. (zip/OOXML)
  if (buf.length >= 8 && buf[0] === 0xd0 && buf[1] === 0xcf && buf[2] === 0x11 && buf[3] === 0xe0) return 'ole2' // legacy DOC/XLS
  return 'unknown'
}

export function extOf(urlOrName: string): string | null {
  const m = urlOrName.split('?')[0].split('#')[0].match(/\.([A-Za-z0-9]{2,5})$/)
  return m ? m[1].toLowerCase() : null
}

/** Verify the magic bytes are consistent with the file extension. Never trusts the
 *  extension or Content-Type alone. A mismatch is reported (and the caller rejects it). */
export function verifySignature(buf: Buffer, urlOrName: string, contentType?: string | null): SignatureResult {
  const ext = extOf(urlOrName)
  const detected = magic(buf)
  let trusted = false
  let reason = 'unverified'
  if (ext === 'pdf') { trusted = detected === 'pdf'; reason = trusted ? 'pdf ok' : 'ext .pdf but magic != %PDF' }
  else if (ext && OOXML_EXT.has(ext)) { trusted = detected === 'ooxml_zip'; reason = trusted ? `${ext} ooxml ok` : `ext .${ext} but magic != PK zip` }
  else if (ext === 'zip') { trusted = detected === 'ooxml_zip'; reason = trusted ? 'zip ok' : 'ext .zip but magic != PK' }
  else if (ext === 'doc' || ext === 'xls' || ext === 'ppt') { trusted = detected === 'ole2'; reason = trusted ? `${ext} ole2 ok` : `ext .${ext} but magic != OLE2` }
  else { reason = `unhandled ext ${ext ?? 'none'}` }
  return { detected, ext, declaredContentType: contentType ?? null, trusted, reason }
}
