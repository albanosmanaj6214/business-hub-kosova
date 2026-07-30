// Stable canonical record identity with deterministic precedence. This is the
// DURABLE identity used to detect the same source record across reruns. It is
// NEVER the mutable content hash.
import type { CanonicalRecord } from './contracts'
import { deterministicFingerprint, computeRecordFingerprint } from './dedupe'

export type IdentityKind = 'official_id' | 'dataset_id' | 'canonical_url' | 'fingerprint'

export interface RecordIdentity {
  kind: IdentityKind
  value: string
  // Hashed, namespaced by kind so different kinds never collide.
  hash: string
}

function mk(kind: IdentityKind, recordKind: string, value: string): RecordIdentity {
  return { kind, value, hash: deterministicFingerprint([recordKind, kind, value]) }
}

/**
 * Precedence: official record id → dataset/call id → canonical URL → documented
 * fallback identity fingerprint (title/url/date, never the content hash).
 */
export function computeIdentity(rec: CanonicalRecord, datasetId?: string | null): RecordIdentity {
  if (rec.identifiers.officialId) return mk('official_id', rec.kind, rec.identifiers.officialId)
  if (datasetId) return mk('dataset_id', rec.kind, datasetId)
  const url = rec.identifiers.canonicalUrl || rec.url
  if (url) return mk('canonical_url', rec.kind, url)
  const fp = computeRecordFingerprint(rec)
  return { kind: 'fingerprint', value: fp, hash: deterministicFingerprint([rec.kind, 'fingerprint', fp]) }
}
