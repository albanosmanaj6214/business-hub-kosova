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
  handoffStatistical(runId: string, input: HandoffInput): Promise<HandoffOutcome>
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
export interface StatDatasetRow {
  id: string; sourceId: string; datasetIdentifier: string; datasetPath?: string; title: string
  frequency?: string; defaultUnit?: string; defaultCurrency?: string; geoCoverage?: string; lastPeriod?: string
  status: 'DRAFT' | 'ACTIVE' | 'DEPRECATED'; firstImportedAt: string; lastImportedAt: string
}
export interface StatObservationRow {
  id: string; datasetId: string; ingestionRecordId: string; ingestionVersion: number
  sourceCitationId?: string | null; importRunId?: string | null; rawSnapshotId?: string | null
  referencePeriod: string; referenceYear?: number; frequency?: string; measureCode: string; measureLabel: string
  dimensions: Record<string, { code: string; label: string }>; dimensionHash: string
  valueOriginal: number | null; unitOriginal?: string; currencyOriginal?: string
  revisionStatus: string; qualityStatus: string; retrievedAt: string; sourcePublishedAt?: string
  firstSeenAt: string; lastSeenAt: string
}

export class InMemoryPipelineStore implements PipelineStore {
  runs: Array<CreateImportRunInput & { id: string; patches: UpdateImportRunPatch[] }> = []
  stages: Array<{ runId: string } & StageResult> = []
  snapshots: Array<Readonly<SnapshotRecord & { id: string }>> = []
  citations: Array<CitationInput & { id: string }> = []
  ingestionRecords: IngestionRecordRow[] = []
  versions: Array<Readonly<IngestionVersionRow>> = []
  reviewItems: ReviewItemRow[] = []
  statisticalDatasets: StatDatasetRow[] = []
  statisticalObservations: StatObservationRow[] = []
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

  async handoffStatistical(runId: string, input: HandoffInput): Promise<HandoffOutcome> {
    const run = this.runs.find((r) => r.id === runId)
    if (!run) throw new Error('ImportRun nuk u gjet')
    const sourceId = run.sourceId
    const nowIso = input.now().toISOString()
    const stat = input.canonical.statistical!
    const key = input.identity.hash
    // Dataset upsert (dataset identifier + title are first-class metadata).
    let ds = this.statisticalDatasets.find((d) => d.sourceId === sourceId && d.datasetIdentifier === stat.dataset.identifier)
    if (!ds) {
      ds = { id: this.id('ds'), sourceId, datasetIdentifier: stat.dataset.identifier, datasetPath: stat.dataset.path, title: stat.dataset.title, frequency: stat.dataset.frequency, defaultUnit: stat.dataset.defaultUnit, defaultCurrency: stat.dataset.defaultCurrency, geoCoverage: stat.dataset.geoCoverage, lastPeriod: stat.dataset.lastPeriod, status: 'DRAFT', firstImportedAt: nowIso, lastImportedAt: nowIso }
      this.statisticalDatasets.push(ds)
    } else { ds.lastImportedAt = nowIso; if (stat.dataset.lastPeriod) ds.lastPeriod = stat.dataset.lastPeriod }
    const o = stat.observation
    const rec = this.ingestionRecords.find((r) => r.sourceId === sourceId && r.identityHash === key)
    const changeType = decideChangeType(rec ? { contentHash: rec.currentContentHash } : null, input.contentHash)
    if (changeType === 'unchanged' && rec) {
      rec.lastSeenAt = nowIso; rec.latestImportRunId = runId; if (input.snapshotId) rec.latestRawSnapshotId = input.snapshotId
      const ob = this.statisticalObservations.find((x) => x.datasetId === ds!.id && x.dimensionHash === o.dimensionHash)
      if (ob) ob.lastSeenAt = nowIso
      return { recordId: rec.id, version: rec.currentVersion, changeType, duplicateCandidate: false, reviewItemCreated: false }
    }
    const cit = { ...input.citation, id: this.id('cit') }; this.citations.push(cit)
    if (changeType === 'new') {
      const dup = this.ingestionRecords.some((r) => r.sourceId === sourceId && r.identityHash !== key && r.currentContentHash === input.contentHash)
      const id = this.id('ing')
      const ob: StatObservationRow = { id: this.id('obs'), datasetId: ds.id, ingestionRecordId: id, ingestionVersion: 1, sourceCitationId: cit.id, importRunId: runId, rawSnapshotId: input.snapshotId ?? null, referencePeriod: o.referencePeriod, referenceYear: o.referenceYear, frequency: o.frequency, measureCode: o.measureCode, measureLabel: o.measureLabel, dimensions: o.dimensions, dimensionHash: o.dimensionHash, valueOriginal: o.valueOriginal, unitOriginal: o.unitOriginal, currencyOriginal: o.currencyOriginal, revisionStatus: 'original', qualityStatus: 'ok', retrievedAt: input.citation.retrievedAt, sourcePublishedAt: o.sourcePublishedAt, firstSeenAt: nowIso, lastSeenAt: nowIso }
      this.statisticalObservations.push(ob)
      const version: IngestionVersionRow = { id: this.id('ver'), ingestionRecordId: id, version: 1, contentHash: input.contentHash, changeType, importRunId: runId, rawSnapshotId: input.snapshotId ?? null, sourceCitationId: cit.id, reviewEntityType: 'StatisticalObservation', reviewEntityId: ob.id, previousVersionId: null, normalizedSummary: canonicalSummary(input.canonical), detectedAt: nowIso }
      this.versions.push(freezeRecord(version))
      this.ingestionRecords.push({ id, sourceId, sourceEndpointId: input.sourceEndpointId ?? null, externalRecordId: input.identity.kind === 'official_id' ? input.identity.value : null, canonicalUrl: input.canonical.identifiers.canonicalUrl ?? null, identityKind: input.identity.kind, identityHash: key, currentContentHash: input.contentHash, currentVersion: 1, firstSeenAt: nowIso, lastSeenAt: nowIso, lastChangedAt: nowIso, latestImportRunId: runId, latestRawSnapshotId: input.snapshotId ?? null, latestCitationId: cit.id, reviewEntityType: 'StatisticalObservation', reviewEntityId: ob.id, duplicateCandidate: dup, state: 'ACTIVE' })
      return { recordId: id, version: 1, changeType, duplicateCandidate: dup, reviewEntityId: ob.id, reviewItemCreated: true }
    }
    // changed: new version + revise the current observation (previous value kept in version trail)
    const r = rec!
    const prevVersion = this.versions.filter((v) => v.ingestionRecordId === r.id).sort((a, b) => b.version - a.version)[0]
    const nv = r.currentVersion + 1
    const ob = this.statisticalObservations.find((x) => x.datasetId === ds.id && x.dimensionHash === o.dimensionHash)
    if (ob) { ob.valueOriginal = o.valueOriginal; ob.revisionStatus = 'revised'; ob.lastSeenAt = nowIso; ob.ingestionVersion = nv; ob.importRunId = runId; ob.sourceCitationId = cit.id; if (input.snapshotId) ob.rawSnapshotId = input.snapshotId }
    const version: IngestionVersionRow = { id: this.id('ver'), ingestionRecordId: r.id, version: nv, contentHash: input.contentHash, changeType, importRunId: runId, rawSnapshotId: input.snapshotId ?? null, sourceCitationId: cit.id, reviewEntityType: 'StatisticalObservation', reviewEntityId: ob?.id ?? null, previousVersionId: prevVersion?.id ?? null, structuredDiff: structuredDiff(prevVersion?.normalizedSummary, canonicalSummary(input.canonical)), normalizedSummary: canonicalSummary(input.canonical), detectedAt: nowIso }
    this.versions.push(freezeRecord(version))
    r.currentContentHash = input.contentHash; r.currentVersion = nv; r.lastSeenAt = nowIso; r.lastChangedAt = nowIso; r.latestImportRunId = runId; r.latestCitationId = cit.id; if (input.snapshotId) r.latestRawSnapshotId = input.snapshotId
    return { recordId: r.id, version: nv, changeType, duplicateCandidate: false, reviewEntityId: ob?.id ?? null, reviewItemCreated: true }
  }

  // Explicit immutability guards (no real update path exists).
  updateSnapshotForbidden(field: string): never { return rejectMutation('RawSnapshot', field) }
  updateVersionForbidden(field: string): never { return rejectMutation('IngestionRecordVersion', field) }
}
