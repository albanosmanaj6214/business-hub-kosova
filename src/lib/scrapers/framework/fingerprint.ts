import { createHash } from 'crypto'
import type { StandardOpportunity } from './types'

export function normalizeTitle(t: string): string {
  return t
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .slice(0, 120)
}

export function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

// fingerprint = normalizedTitle + sourceDomain + deadline + amountRange
// Used for cross-source deduplication (a call republished by MINT/MZHR/etc.).
export function fingerprintOf(o: StandardOpportunity): string {
  const parts = [
    normalizeTitle(o.title),
    domainOf(o.sourceUrl),
    o.deadline ? o.deadline.toISOString().slice(0, 10) : '',
    o.amountMin != null || o.amountMax != null ? `${o.amountMin ?? ''}-${o.amountMax ?? ''}` : '',
  ]
  return createHash('sha1').update(parts.join('|')).digest('hex')
}
