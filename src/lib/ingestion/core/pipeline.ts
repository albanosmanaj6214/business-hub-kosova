// Canonical ingestion orchestrator. Runs the canonical lifecycle stages in order,
// records a StageResult for each, STOPS downstream execution on a failed stage,
// and hands validated records to review WITHOUT publishing or notifying. Dry-run
// performs every safe stage but persists no citations/review items.
import { DEFERRED_STAGES, type ImportStage, type StageResult } from './stages'
import type {
  AdapterContext, IngestionAdapter, FetchResult, ParsedItem, NormalizedRecord,
  ValidationOutcome, PipelineOptions, PipelineResult, ReviewHandoffItem,
} from './contracts'
import type { PipelineStore } from './store'
import { buildSnapshot } from './snapshot'
import { buildCitation } from './citation'
import { computeRecordFingerprint, contentHash, dedupeDecision, dedupeWithinRun } from './dedupe'
import { emptyCounts, deriveRunStatus, sanitizeRunError } from './import-run'

export interface RunPipelineArgs {
  adapter: IngestionAdapter
  store: PipelineStore
  sourceId: string
  sourceEndpointId?: string | null
  options: PipelineOptions
  baseUrl?: string
  datasetId?: string | null
  kind?: string
  now?: () => Date
}

interface WorkItem {
  rec: NormalizedRecord
  snapshotId?: string | null
  fingerprint: string
  contentHash: string
  validation?: ValidationOutcome
}

class StageAbort extends Error {}

export async function runPipeline(args: RunPipelineArgs): Promise<PipelineResult> {
  const now = args.now ?? (() => new Date())
  const { adapter, store, options } = args
  const sourceId = args.sourceId
  const sourceEndpointId = args.sourceEndpointId ?? null
  const kind = args.kind ?? 'opportunity'

  const { id: importRunId } = await store.createImportRun({
    sourceId, sourceEndpointId, trigger: options.trigger, dryRun: options.dryRun,
    adapterName: adapter.name, adapterVersion: adapter.version, initiatedBy: options.initiatedBy ?? null,
  })

  const ctx: AdapterContext = { sourceId, sourceEndpointId, importRunId, dryRun: options.dryRun, baseUrl: args.baseUrl, datasetId: args.datasetId ?? null, now }
  const counts = emptyCounts()
  const stages: StageResult[] = []
  const reviewHandoff: ReviewHandoffItem[] = []
  let bytes = 0
  const runStart = now().getTime()

  const stage = async <T>(name: ImportStage, inputCount: number, fn: () => Promise<{ output?: T; outputCount: number; rejectedCount?: number; adapterVersion?: string; parserVersion?: string }>): Promise<T | undefined> => {
    const startedAt = now().toISOString()
    const t0 = now().getTime()
    await store.updateImportRun(importRunId, { status: options.dryRun ? 'DRY_RUN' : 'RUNNING', currentStage: name })
    try {
      const r = await fn()
      const sr: StageResult = { stage: name, status: 'SUCCEEDED', startedAt, endedAt: now().toISOString(), durationMs: Math.max(0, now().getTime() - t0), inputCount, outputCount: r.outputCount, rejectedCount: r.rejectedCount ?? 0, adapterVersion: r.adapterVersion, parserVersion: r.parserVersion }
      stages.push(sr)
      await store.recordStage(importRunId, sr)
      return r.output
    } catch (err) {
      const sr: StageResult = { stage: name, status: 'FAILED', startedAt, endedAt: now().toISOString(), durationMs: Math.max(0, now().getTime() - t0), inputCount, outputCount: 0, rejectedCount: 0, errorSummary: sanitizeRunError(err) }
      stages.push(sr)
      await store.recordStage(importRunId, sr)
      throw new StageAbort()
    }
  }

  try {
    // 1. DISCOVER
    const refs = (await stage('DISCOVER', 1, async () => {
      const r = await adapter.discover(ctx)
      return { output: r, outputCount: r.length }
    }))!
    counts.discovered = refs.length

    // 2. FETCH
    const fetched: FetchResult[] = []
    await stage('FETCH', refs.length, async () => {
      const capped = typeof options.maxItems === 'number' ? refs.slice(0, options.maxItems) : refs
      for (const ref of capped) { const fr = await adapter.fetch(ref, ctx); fetched.push(fr); bytes += fr.sizeBytes }
      return { outputCount: fetched.length, adapterVersion: adapter.version }
    })
    counts.fetched = fetched.length

    // 3. SNAPSHOT (immutable; skip 304 cache hits)
    const snapByIndex = new Map<number, string>()
    await stage('SNAPSHOT', fetched.length, async () => {
      let made = 0
      for (let i = 0; i < fetched.length; i++) {
        const fr = fetched[i]
        if (fr.fromCache) continue
        const snap = buildSnapshot({ sourceId, sourceEndpointId, importRunId, requestedUrl: fr.ref.url, datasetId: fr.ref.datasetId, retrievedAt: fr.retrievedAt, httpStatus: fr.status, contentType: fr.contentType, bodyText: fr.bodyText, etag: fr.etag, lastModified: fr.lastModified, adapterVersion: adapter.version })
        const { id } = await store.createSnapshot(snap)
        snapByIndex.set(i, id)
        made++
      }
      return { outputCount: made }
    })

    // 4. PARSE
    const parsed: { item: ParsedItem; snapshotId?: string | null }[] = []
    let parserVersion: string | undefined
    await stage('PARSE', fetched.length, async () => {
      for (let i = 0; i < fetched.length; i++) {
        const items = await adapter.parse(fetched[i], ctx)
        for (const it of items) { parsed.push({ item: it, snapshotId: snapByIndex.get(i) ?? null }); parserVersion = it.parserVersion }
      }
      return { outputCount: parsed.length, parserVersion }
    })
    counts.parsed = parsed.length

    // 5. NORMALIZE
    const normalized: { rec: NormalizedRecord; snapshotId?: string | null }[] = []
    await stage('NORMALIZE', parsed.length, async () => {
      for (const p of parsed) normalized.push({ rec: await adapter.normalize(p.item, ctx), snapshotId: p.snapshotId })
      return { outputCount: normalized.length }
    })
    counts.normalized = normalized.length

    // 6. CLASSIFY (deferred business logic hook: pass-through, kind preserved)
    await stage('CLASSIFY', normalized.length, async () => ({ outputCount: normalized.length }))
    // 7. MAP (hook: canonical already mapped by the adapter)
    await stage('MAP', normalized.length, async () => ({ outputCount: normalized.length }))

    // 8. DEDUPLICATE (deterministic; idempotent; version-aware)
    const work: WorkItem[] = normalized.map((n) => ({ rec: n.rec, snapshotId: n.snapshotId, fingerprint: computeRecordFingerprint(n.rec.canonical), contentHash: contentHash(n.rec.canonical) }))
    const deduped: WorkItem[] = []
    await stage('DEDUPLICATE', work.length, async () => {
      const { unique } = dedupeWithinRun(work)
      const existing = await store.findExistingByFingerprint(kind, unique.map((u) => u.fingerprint))
      for (const u of unique) {
        const decision = dedupeDecision(u.fingerprint, u.contentHash, existing)
        if (decision.decision === 'duplicate') continue // idempotent skip
        deduped.push(u)
      }
      return { outputCount: deduped.length, rejectedCount: work.length - deduped.length }
    })
    counts.deduplicated = deduped.length

    // 9. VALIDATE
    await stage('VALIDATE', deduped.length, async () => {
      for (const d of deduped) d.validation = await adapter.validate(d.rec, ctx)
      return { outputCount: deduped.length }
    })

    // 10. QUALITY_CHECK (critical failures are rejected + blocked from handoff)
    await stage('QUALITY_CHECK', deduped.length, async () => {
      const passed = deduped.filter((d) => d.validation?.ok)
      counts.validated = passed.length
      counts.rejected = deduped.length - passed.length
      return { outputCount: passed.length, rejectedCount: counts.rejected }
    })

    // 11. REVIEW_HANDOFF (citation required; never publishes/notifies; dry-run persists nothing)
    await stage('REVIEW_HANDOFF', counts.validated, async () => {
      let sent = 0
      for (const d of deduped) {
        if (!d.validation?.ok) continue
        const citation = buildCitation({
          sourceId, sourceEndpointId, importRunId, rawSnapshotId: d.snapshotId ?? null,
          entityType: d.rec.canonical.kind, canonicalUrl: d.rec.canonical.identifiers.canonicalUrl ?? d.rec.canonical.url ?? null,
          officialId: d.rec.canonical.identifiers.officialId ?? null, documentTitle: d.rec.canonical.title ?? null,
          sourcePublicationDate: d.rec.canonical.publicationDate ?? null, retrievedAt: now().toISOString(),
        })
        reviewHandoff.push({
          fingerprint: d.fingerprint, canonical: d.rec.canonical, validation: d.validation,
          citation: { sourceId, importRunId, rawSnapshotId: d.snapshotId ?? undefined, canonicalUrl: citation.canonicalUrl ?? undefined, retrievedAt: citation.retrievedAt },
        })
        if (!options.dryRun) {
          await store.createCitation(citation)
          await store.createReviewItem(importRunId, { fingerprint: d.fingerprint, canonical: d.rec.canonical, validation: d.validation, snapshotId: d.snapshotId ?? null, contentHash: d.contentHash })
        }
        sent++
      }
      return { outputCount: sent }
    })
    counts.sentToReview = reviewHandoff.length
  } catch (err) {
    if (!(err instanceof StageAbort)) {
      // Unexpected fatal error outside a stage.
      const sr: StageResult = { stage: 'DISCOVER', status: 'FAILED', startedAt: new Date(runStart).toISOString(), endedAt: now().toISOString(), durationMs: 0, inputCount: 0, outputCount: 0, rejectedCount: 0, errorSummary: sanitizeRunError(err) }
      stages.push(sr)
    }
  }

  // Deferred business stages are recorded as SKIPPED — never executed in Phase 2.
  const failed = stages.some((s) => s.status === 'FAILED')
  if (!failed) {
    for (const s of DEFERRED_STAGES) {
      const ts = now().toISOString()
      stages.push({ stage: s, status: 'SKIPPED', startedAt: ts, endedAt: ts, durationMs: 0, inputCount: 0, outputCount: 0, rejectedCount: 0 })
    }
  }

  const status = deriveRunStatus(stages)
  const finalStatus = options.dryRun ? 'DRY_RUN' : status
  await store.updateImportRun(importRunId, {
    status: finalStatus, currentStage: null, counts, completedAt: now().toISOString(),
    durationMs: Math.max(0, now().getTime() - runStart), bytesTransferred: bytes, stages,
    errorSummary: stages.find((s) => s.status === 'FAILED')?.errorSummary ?? null,
  })

  return { importRunId, status, dryRun: options.dryRun, stages, counts, reviewHandoff, errorSummary: stages.find((s) => s.status === 'FAILED')?.errorSummary }
}
