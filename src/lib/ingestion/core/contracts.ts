// Canonical ingestion adapter + pipeline contracts. This is the ONE target
// contract that the existing three ingestion paths (news, framework adapters,
// legacy scrapers) may later migrate toward. Phase 2 does not migrate them.
import type { StageResult } from './stages'

export type AdapterFamily =
  | 'rest_json'
  | 'jsonstat'
  | 'sdmx'
  | 'csv'
  | 'excel'
  | 'xml'
  | 'rss'
  | 'atom'
  | 'sitemap'
  | 'html'
  | 'pdf'
  | 'manual_upload'
  | 'manual_entry'
  | 'fixture'

export type TriggerType = 'MANUAL' | 'SCHEDULED' | 'FIXTURE' | 'DRY_RUN'

/** A reference to something discovered that can be fetched (url or dataset id). */
export interface DiscoveredRef {
  id: string
  url?: string
  datasetId?: string
  label?: string
  meta?: Record<string, unknown>
}

/** Raw bytes/text plus reproducibility metadata from a single fetch. */
export interface FetchResult {
  ref: DiscoveredRef
  status: number
  contentType: string | null
  bodyText: string
  sizeBytes: number
  checksum: string
  etag?: string | null
  lastModified?: string | null
  retrievedAt: string
  fromCache?: boolean
}

export interface ParsedItem {
  sourceRecordId?: string
  fields: Record<string, unknown>
  parserVersion: string
}

/** The normalized business record + preserved originals + provenance. */
export interface CanonicalRecord {
  kind: string // e.g. 'opportunity' | 'fair' | 'news' | 'statistic'
  title?: string
  url?: string
  publicationDate?: string
  deadline?: string
  identifiers: {
    sourceRecordId?: string
    officialId?: string
    canonicalUrl?: string
  }
  payload: Record<string, unknown>
}

export interface NormalizationWarning {
  field: string
  reason: string
  confidence: number // 0..1
}

export interface NormalizedRecord {
  canonical: CanonicalRecord
  original: Record<string, unknown>
  warnings: NormalizationWarning[]
  confidence: number // aggregate 0..1
}

export type QualitySeverity = 'critical' | 'warning'
export type QualityDimension =
  | 'authority'
  | 'completeness'
  | 'validity'
  | 'consistency'
  | 'freshness'
  | 'uniqueness'
  | 'traceability'
  | 'classification_confidence'
  | 'transformation_confidence'

export interface QualityIssue {
  code: string
  dimension: QualityDimension
  severity: QualitySeverity
  message: string
}

export interface ValidationOutcome {
  ok: boolean
  issues: QualityIssue[]
  requiresReview: boolean
}

export type DedupeDecision = 'new' | 'duplicate' | 'version_changed'
export interface DedupeOutcome {
  decision: DedupeDecision
  fingerprint: string
  matchedId?: string
}

export interface Checkpoint {
  stage: string
  cursor?: string
  data?: Record<string, unknown>
}

export interface HealthReport {
  ok: boolean
  state: string // maps to SourceHealthState
  message?: string
}

export interface ConnectionResult {
  ok: boolean
  status?: number | null
  contentType?: string | null
  sizeBytes?: number | null
  durationMs: number
  error?: string
}

/** Shared context handed to every adapter method + pipeline stage. */
export interface AdapterContext {
  sourceId: string
  sourceEndpointId?: string | null
  importRunId: string
  dryRun: boolean
  baseUrl?: string
  datasetId?: string | null
  // Injected clock/rng so tests are deterministic.
  now: () => Date
  logger?: (msg: string) => void
}

/**
 * The canonical adapter contract. Every adapter family implements these typed
 * operations. Not all methods do external I/O (manual_entry has no fetch).
 */
export interface IngestionAdapter {
  readonly name: string
  readonly version: string
  readonly family: AdapterFamily
  testConnection(ctx: AdapterContext): Promise<ConnectionResult>
  discover(ctx: AdapterContext): Promise<DiscoveredRef[]>
  fetch(ref: DiscoveredRef, ctx: AdapterContext): Promise<FetchResult>
  parse(fetched: FetchResult, ctx: AdapterContext): Promise<ParsedItem[]>
  normalize(item: ParsedItem, ctx: AdapterContext): Promise<NormalizedRecord>
  validate(record: NormalizedRecord, ctx: AdapterContext): Promise<ValidationOutcome>
  createCheckpoint(ctx: AdapterContext): Promise<Checkpoint>
  reportHealth(ctx: AdapterContext): Promise<HealthReport>
}

export interface PipelineOptions {
  dryRun: boolean
  trigger: TriggerType
  initiatedBy?: string | null
  maxItems?: number
}

export interface PipelineResult {
  importRunId: string
  status: 'SUCCEEDED' | 'FAILED' | 'PARTIAL'
  dryRun: boolean
  stages: StageResult[]
  counts: {
    discovered: number
    fetched: number
    parsed: number
    normalized: number
    deduplicated: number
    validated: number
    rejected: number
    sentToReview: number
    published: number
  }
  errorSummary?: string
  reviewHandoff: ReviewHandoffItem[]
}

/** What the pipeline hands to review (never auto-published in Phase 2). */
export interface ReviewHandoffItem {
  fingerprint: string
  canonical: CanonicalRecord
  validation: ValidationOutcome
  citation: {
    sourceId: string
    importRunId: string
    rawSnapshotId?: string
    canonicalUrl?: string
    retrievedAt: string
  }
}
