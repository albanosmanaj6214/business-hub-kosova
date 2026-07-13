// Dekodon nje "data URL" base64 ne bytes imazhi, duke validuar tipin dhe madhesine.
// Perdoret nga ngarkimi i logos (Company) dhe fotografive te produkteve (Offering).
// Imazhet ruhen ne tabelen MediaAsset (jashte tabelave Company/Offering) qe blob-et
// te mos ndotin query-t ekzistuese e as te dergohen ne JSON.

const ALLOWED: Record<string, true> = {
  'image/jpeg': true,
  'image/png': true,
  'image/webp': true,
}

export const LOGO_MAX_BYTES = 1_500_000
export const OFFERING_IMAGE_MAX_BYTES = 3_000_000

export function parseDataUrlImage(dataUrl: string, maxBytes: number): { mime: string; buffer: Buffer; size: number } {
  const m = /^data:([a-z/+.-]+);base64,(.+)$/i.exec(dataUrl.trim())
  if (!m) throw new Error('Format i pavlefshëm imazhi.')
  const mime = m[1].toLowerCase()
  if (!ALLOWED[mime]) throw new Error('Lejohen vetëm JPG, PNG ose WebP.')
  const buffer = Buffer.from(m[2], 'base64')
  if (buffer.length === 0) throw new Error('Imazh bosh.')
  if (buffer.length > maxBytes) throw new Error(`Imazhi është shumë i madh (max ${Math.round(maxBytes / 1024 / 1024)}MB).`)
  return { mime, buffer, size: buffer.length }
}
