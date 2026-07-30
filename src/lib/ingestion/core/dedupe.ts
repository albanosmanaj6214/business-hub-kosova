// Deterministic, reproducible deduplication. No fuzzy-only title matching; no
// automatic deletion of uncertain duplicates. Idempotent: the same snapshot /
// source record / normalized fingerprint never creates a second review record.
import { createHash } from 'node:crypto'
import type { CanonicalRecord, DedupeOutcome } from './contracts'

export function sha256hex(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex')
}

/** Stable fingerprint from ordered, normalized key parts. */
export function deterministicFingerprint(parts: (string | null | undefined)[]): string {
  const key = parts.map((p) => (p ?? '').toString().normalize('NFC').trim().toLowerCase()).join('␟')
  return sha256hex(key)
}

/**
 * Prefer strong keys (official id / canonical url / source-record id); fall back
 * to a normalized identity fingerprint. Deterministic for a given record.
 */
export function computeRecordFingerprint(rec: CanonicalRecord): string {
  const strong = rec.identifiers.officialId || rec.identifiers.canonicalUrl || rec.identifiers.sourceRecordId
  if (strong) return deterministicFingerprint([rec.kind, strong])
  return deterministicFingerprint([rec.kind, rec.title, rec.url, rec.publicationDate])
}

/** Content hash used for version-aware change detection. */
export function contentHash(payload: unknown): string {
  return sha256hex(stableStringify(payload))
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']'
  const obj = value as Record<string, unknown>
  const keys = Object.keys(obj).sort()
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + stableStringify(obj[k])).join(',') + '}'
}

export interface ExistingRecord {
  id: string
  fingerprint: string
  contentHash?: string | null
}

/**
 * Decide new / duplicate / version_changed. A matching fingerprint whose content
 * hash differs is a version change (same identity, new content); identical hash
 * is an exact duplicate (idempotent skip).
 */
export function dedupeDecision(fingerprint: string, currentContentHash: string, existing: ExistingRecord[]): DedupeOutcome {
  const match = existing.find((e) => e.fingerprint === fingerprint)
  if (!match) return { decision: 'new', fingerprint }
  if (match.contentHash && match.contentHash !== currentContentHash) {
    return { decision: 'version_changed', fingerprint, matchedId: match.id }
  }
  return { decision: 'duplicate', fingerprint, matchedId: match.id }
}

/** In-run dedup: collapse identical fingerprints so a rerun stays idempotent. */
export function dedupeWithinRun<T extends { fingerprint: string }>(items: T[]): { unique: T[]; duplicates: T[] } {
  const seen = new Set<string>()
  const unique: T[] = []
  const duplicates: T[] = []
  for (const it of items) {
    if (seen.has(it.fingerprint)) duplicates.push(it)
    else { seen.add(it.fingerprint); unique.push(it) }
  }
  return { unique, duplicates }
}
