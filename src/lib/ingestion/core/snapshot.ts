// Immutable raw-source snapshots. Small fixture payloads may be stored inline
// (under a documented cap); larger payloads MUST be a file/object reference —
// we never store arbitrarily large documents inline in PostgreSQL.
import { createHash } from 'node:crypto'

// Documented inline cap. Anything larger must use a storage reference.
export const INLINE_SNAPSHOT_LIMIT_BYTES = 262_144 // 256 KB

export type SnapshotStorageKind = 'INLINE' | 'FILE' | 'OBJECT'
export type SnapshotRetention = 'ephemeral' | 'standard' | 'long_term'

export interface SnapshotInput {
  sourceId: string
  sourceEndpointId?: string | null
  importRunId: string
  requestedUrl?: string | null
  datasetId?: string | null
  retrievedAt: string
  httpStatus?: number | null
  contentType?: string | null
  bodyText?: string
  etag?: string | null
  lastModified?: string | null
  publicationDate?: string | null
  adapterVersion?: string | null
  parserVersion?: string | null
  storageRef?: string | null // provided when body is stored externally
  retention?: SnapshotRetention
}

export interface SnapshotRecord {
  sourceId: string
  sourceEndpointId?: string | null
  importRunId: string
  requestedUrl?: string | null
  datasetId?: string | null
  retrievedAt: string
  httpStatus?: number | null
  contentType?: string | null
  contentLength: number
  checksum: string
  etag?: string | null
  lastModified?: string | null
  publicationDate?: string | null
  adapterVersion?: string | null
  parserVersion?: string | null
  storageKind: SnapshotStorageKind
  storageRef?: string | null
  inlineBody?: string | null
  retention: SnapshotRetention
}

export function checksumOf(bodyText: string): string {
  return createHash('sha256').update(bodyText, 'utf8').digest('hex')
}

export function verifyChecksum(bodyText: string, checksum: string): boolean {
  return checksumOf(bodyText) === checksum
}

/** Build an immutable snapshot record. Chooses inline vs reference by size. */
export function buildSnapshot(input: SnapshotInput): SnapshotRecord {
  const body = input.bodyText ?? ''
  const contentLength = Buffer.byteLength(body, 'utf8')
  const checksum = checksumOf(body)
  const retention = input.retention ?? 'standard'
  let storageKind: SnapshotStorageKind
  let inlineBody: string | null = null
  let storageRef: string | null = input.storageRef ?? null
  if (input.storageRef) {
    storageKind = 'FILE'
  } else if (contentLength <= INLINE_SNAPSHOT_LIMIT_BYTES) {
    storageKind = 'INLINE'
    inlineBody = body
  } else {
    // Too large to inline and no reference provided: the caller must persist the
    // body externally first. We record metadata only and mark it as a reference.
    storageKind = 'OBJECT'
    storageRef = null
  }
  return {
    sourceId: input.sourceId,
    sourceEndpointId: input.sourceEndpointId ?? null,
    importRunId: input.importRunId,
    requestedUrl: input.requestedUrl ?? null,
    datasetId: input.datasetId ?? null,
    retrievedAt: input.retrievedAt,
    httpStatus: input.httpStatus ?? null,
    contentType: input.contentType ?? null,
    contentLength,
    checksum,
    etag: input.etag ?? null,
    lastModified: input.lastModified ?? null,
    publicationDate: input.publicationDate ?? null,
    adapterVersion: input.adapterVersion ?? null,
    parserVersion: input.parserVersion ?? null,
    storageKind,
    storageRef,
    inlineBody,
    retention,
  }
}
