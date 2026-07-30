// Persistence boundary for the pipeline. The orchestrator depends ONLY on this
// interface, so it is fully testable with an in-memory store (no DB) and runs
// against Prisma in production (see prisma-store.ts).
import type { StageResult } from './stages'
import type { CanonicalRecord, ValidationOutcome } from './contracts'
import type { SnapshotRecord } from './snapshot'
import type { CitationInput } from './citation'
import type { ExistingRecord } from './dedupe'
import type { RunCounts } from './import-run'

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

export interface ReviewItemInput {
  fingerprint: string
  canonical: CanonicalRecord
  validation: ValidationOutcome
  snapshotId?: string | null
  contentHash: string
}

export interface PipelineStore {
  createImportRun(input: CreateImportRunInput): Promise<{ id: string }>
  updateImportRun(id: string, patch: UpdateImportRunPatch): Promise<void>
  recordStage(runId: string, stage: StageResult): Promise<void>
  createSnapshot(rec: SnapshotRecord): Promise<{ id: string }>
  findExistingByFingerprint(kind: string, fingerprints: string[]): Promise<ExistingRecord[]>
  createCitation(c: CitationInput): Promise<{ id: string }>
  createReviewItem(runId: string, item: ReviewItemInput): Promise<{ id: string }>
}

// In-memory store: deterministic ids, enforces snapshot immutability, and makes
// reruns idempotent by remembering fingerprints of prior review items.
export class InMemoryPipelineStore implements PipelineStore {
  runs: Array<CreateImportRunInput & { id: string; patches: UpdateImportRunPatch[] }> = []
  stages: Array<{ runId: string } & StageResult> = []
  snapshots: Array<SnapshotRecord & { id: string }> = []
  citations: Array<CitationInput & { id: string }> = []
  reviewItems: Array<ReviewItemInput & { id: string; runId: string }> = []
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
    // Immutable: never overwrite. A repeated (source, checksum) keeps the first.
    const existing = this.snapshots.find((s) => s.sourceId === rec.sourceId && s.checksum === rec.checksum)
    if (existing) return { id: existing.id }
    const id = this.id('snap')
    this.snapshots.push({ ...rec, id })
    return { id }
  }
  async findExistingByFingerprint(_kind: string, fingerprints: string[]): Promise<ExistingRecord[]> {
    return this.reviewItems
      .filter((r) => fingerprints.includes(r.fingerprint))
      .map((r) => ({ id: r.id, fingerprint: r.fingerprint, contentHash: r.contentHash }))
  }
  async createCitation(c: CitationInput) {
    const id = this.id('cit')
    this.citations.push({ ...c, id })
    return { id }
  }
  async createReviewItem(runId: string, item: ReviewItemInput) {
    const id = this.id('rev')
    this.reviewItems.push({ ...item, id, runId })
    return { id }
  }
}
