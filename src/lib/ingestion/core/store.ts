// Persistence boundary for the pipeline. Depends ONLY on this interface so it is
// testable with an in-memory store (no DB) and runs against Prisma in production.
// Version-aware handoff lives here: stable identity → new/unchanged/changed, with
// version history, idempotent review handoff, and provenance-safe snapshots.
import type { StageResult } from './stages'
import type { CanonicalRecord, ValidationOutcome } from './contracts'
import type { SnapshotRecord } from './snapshot'
import type { CitationInput } from './citation'
import type { RecordIdentity, IdentityKind } from './identity'
import type { RunCounts } from './import-run'
import { decideChangeType, structuredDiff, canonicalSummary, type ChangeType, type FieldChange } from './versioning'
import { freezeRecord, rejectMutation } from './immutability'

export interface CreateImportRunInput {
  sourceId: string
  sourceEndpointId?: string | null
  trigger: string
  dryRun: boolean
  adapterName: string
  adapterVersion: string
  initiatedBy?: string | null
}

export interface UpdateImportRunPatch {
  status?: string
  currentStage?: string | null
  counts?: Partial<RunCounts>
  checkpoint?: Record<string, unknown> | null
  errorCode?: string | null
  errorSummary?: string | null
  completedAt?: string | null
  durationMs?: number | null
  retryCount?: number
  bytesTransferred?: number
  stages?: StageResult[]
}

export interface HandoffInput {
  canonical: CanonicalRecord
  identity: RecordIdentity
  sourceEndpointId?: string | null
  contentHash: string
  snapshotId?: string | null
  citation: CitationInput
  validation: ValidationOutcome
  now: () => Date
}

export interface HandoffOutcome {
  recordId: string
  version: number
  changeType: ChangeType
  duplicateCandidate: boolean
  reviewEntityId?: string | null
  reviewItemCreated: boolean
}

export interface PipelineStore {
  createImportRun(input: CreateImportRunInput): Promise<{ id: string }>
  updateImportRun(id: string, patch: UpdateImportRunPatch): Promise<void>
  recordStage(runId: string, stage: StageResult): Promise<void>
  createSnapshot(rec: SnapshotRecord): Promise<{ id: string }>
  // Version-aware, idempotent review handoff (never publishes/notifies).
  handoffRecord(runId: string, input: HandoffInput): Promise<HandoffOutcome>
}

// --- In-memory rows (mirror the Prisma tables) ---
export interface IngestionRecordRow {
  id: string
  sourceId: string
  sourceEndpointId?: string | null
  externalRecordId?: string | null
  canonicalUrl?: string | null
  identityKind: IdentityKind
  identityHash: string
  currentContentHash: string
  currentVersion: number
  firstSeenAt: string
  lastSeenAt: string
  lastChangedAt: string
  latestImportRunId?: string | null
  latestRawSnapshotId?: string | null
  latestCitationId?: string | null
  reviewEntityType?: string | null
  reviewEntityId?: string | null
  duplicateCandidate: boolean
  state: 'ACTIVE' | 'SUPERSEDED' | 'ARCHIVED'
}
export interface IngestionVersionRow {
  id: string
  ingestionRecordId: string
  version: number
  contentHash: string
  changeType: ChangeType
  importRunId?: string | null
  rawSnapshotId?: string | null
  sourceCitationId?: string | null
  reviewEntityType?: string | null
  reviewEntityId?: string | null
  previousVersionId?: string | null
  structuredDiff?: FieldChange[]
  normalizedSummary?: Record<string, unknown>
  detectedAt: string
}
export interface ReviewItemRow {
  id: string
  runId: string
  ingestionRecordId: string
  version: number
  changeType: ChangeType
  fingerprint: string
  canonical: CanonicalRecord
  previousReviewId?: string | null
}

export class InMemoryPipelineStore implements PipelineStore {
  runs: Array<CreateImportRunInput & { id: string; patches: UpdateImportRunPatch[] }> = []
  stages: Array<{ runId: string } & StageResult> = []
  snapshots: Array<Readonly<SnapshotRecord & { id: string }>> = []
  citations: Array<CitationInput & { id: string }> = []
  ingestionRecords: IngestionRecordRow[] = []
  versions: Array<Readonly<IngestionVersionRow>> = []
  reviewItems: ReviewItemRow[] = []
  private seq = 0
  private id(prefix: string): string { this.seq += 1; return `${prefix}_${this.seq}` }

  async createImportRun(input: CreateImportRunInput) {
    const id = this.id('run')
    this.runs.push({ ...input, id, patches: [] })
    return { id }
  }
  async updateImportRun(id: string, patch: UpdateImportRunPatch) {
    this.runs.find((r) => r.id === id)?.patches.push(patch)
  }
  async recordStage(runId: string, stage: StageResult) {
    this.stages.push({ runId, ...stage })
  }
  async createSnapshot(rec: SnapshotRecord) {
    // Immutable + idempotent by provenance-safe key (NOT bare checksum).
    const existing = this.snapshots.find((s) => s.snapshotKey === rec.snapshotKey)
    if (existing) return { id: existing.id }
    const id = this.id('snap')
    this.snapshots.push(freezeRecord({ ...rec, id }))
    return { id }
  }

  async handoffRecord(runId: string, input: HandoffInput): Promise<HandoffOutcome> {
    const run = this.runs.find((r) => r.id === runId)
    if (!run) throw new Error('ImportRun nuk u gjet')
    const sourceId = run.sourceId
    const nowIso = input.now().toISOString()
    const key = input.identity.hash
    const rec = this.ingestionRecords.find((r) => r.sourceId === sourceId && r.identityHash === key)
    const changeType = decideChangeType(rec ? { contentHash: rec.currentContentHash } : null, input.contentHash)

    if (changeType === 'unchanged' && rec) {
      rec.lastSeenAt = nowIso
      rec.latestImportRunId = runId
      if (input.snapshotId) rec.latestRawSnapshotId = input.snapshotId
      return { recordId: rec.id, version: rec.currentVersion, changeType, duplicateCandidate: false, reviewItemCreated: false }
    }

    // new or changed → create citation, version, and one review item.
    const cit = { ...input.citation, id: this.id('cit') }
    this.citations.push(cit)

    if (changeType === 'new') {
      const duplicateCandidate = this.ingestionRecords.some((r) => r.sourceId === sourceId && r.identityHash !== key && r.currentContentHash === input.contentHash)
      const id = this.id('ing')
      const review: ReviewItemRow = { id: this.id('rev'), runId, ingestionRecordId: id, version: 1, changeType, fingerprint: key, canonical: input.canonical }
      this.reviewItems.push(review)
      const version: IngestionVersionRow = { id: this.id('ver'), ingestionRecordId: id, version: 1, contentHash: input.contentHash, changeType, importRunId: runId, rawSnapshotId: input.snapshotId ?? null, sourceCitationId: cit.id, reviewEntityType: 'Opportunity', reviewEntityId: review.id, previousVersionId: null, normalizedSummary: canonicalSummary(input.canonical), detectedAt: nowIso }
      this.versions.push(freezeRecord(version))
      this.ingestionRecords.push({
        id, sourceId, sourceEndpointId: input.sourceEndpointId ?? null,
        externalRecordId: input.identity.kind === 'official_id' ? input.identity.value : null,
        canonicalUrl: input.canonical.identifiers.canonicalUrl ?? input.canonical.url ?? null,
        identityKind: input.identity.kind, identityHash: key,
        currentContentHash: input.contentHash, currentVersion: 1,
        firstSeenAt: nowIso, lastSeenAt: nowIso, lastChangedAt: nowIso,
        latestImportRunId: runId, latestRawSnapshotId: input.snapshotId ?? null, latestCitationId: cit.id,
        reviewEntityType: 'Opportunity', reviewEntityId: review.id, duplicateCandidate, state: 'ACTIVE',
      })
      return { recordId: id, version: 1, changeType, duplicateCandidate, reviewEntityId: review.id, reviewItemCreated: true }
    }

    // changed
    const r = rec!
    const prevVersion = this.versions.filter((v) => v.ingestionRecordId === r.id).sort((a, b) => b.version - a.version)[0]
    const newVersionNum = r.currentVersion + 1
    const prevReview = this.reviewItems.filter((rv) => rv.ingestionRecordId === r.id).sort((a, b) => b.version - a.version)[0]
    const review: ReviewItemRow = { id: this.id('rev'), runId, ingestionRecordId: r.id, version: newVersionNum, changeType, fingerprint: key, canonical: input.canonical, previousReviewId: prevReview?.id ?? null }
    this.reviewItems.push(review)
    const diff = structuredDiff(prevVersion?.normalizedSummary, canonicalSummary(input.canonical))
    const version: IngestionVersionRow = { id: this.id('ver'), ingestionRecordId: r.id, version: newVersionNum, contentHash: input.contentHash, changeType, importRunId: runId, rawSnapshotId: input.snapshotId ?? null, sourceCitationId: cit.id, reviewEntityType: 'Opportunity', reviewEntityId: review.id, previousVersionId: prevVersion?.id ?? null, structuredDiff: diff, normalizedSummary: canonicalSummary(input.canonical), detectedAt: nowIso }
    this.versions.push(freezeRecord(version))
    r.currentContentHash = input.contentHash
    r.currentVersion = newVersionNum
    r.lastSeenAt = nowIso
    r.lastChangedAt = nowIso
    r.latestImportRunId = runId
    if (input.snapshotId) r.latestRawSnapshotId = input.snapshotId
    r.latestCitationId = cit.id
    r.reviewEntityId = review.id
    return { recordId: r.id, version: newVersionNum, changeType, duplicateCandidate: false, reviewEntityId: review.id, reviewItemCreated: true }
  }

  // Explicit immutability guards (no real update path exists).
  updateSnapshotForbidden(field: string): never { return rejectMutation('RawSnapshot', field) }
  updateVersionForbidden(field: string): never { return rejectMutation('IngestionRecordVersion', field) }
}
