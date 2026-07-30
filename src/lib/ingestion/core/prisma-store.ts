// Production PipelineStore backed by Prisma. Maps canonical results to the new
// ImportRun / RawSnapshot / SourceCitation tables and routes review handoff to
// the EXISTING Opportunity review queue (verificationStatus='needs_review';
// never auto-published). Not exercised in Phase 2 (no live imports run).
import { Prisma } from '@prisma/client'
import type {
  ImportTrigger, ImportRunStatus, SnapshotStorageKind, SnapshotRetention,
  CitationReviewStatus, OpportunityType,
} from '@prisma/client'
import { prisma } from '@/lib/prisma'
import type { PipelineStore, CreateImportRunInput, UpdateImportRunPatch, ReviewItemInput } from './store'
import type { SnapshotRecord } from './snapshot'
import type { CitationInput } from './citation'
import type { ExistingRecord } from './dedupe'

export class PrismaPipelineStore implements PipelineStore {
  async createImportRun(input: CreateImportRunInput) {
    const run = await prisma.importRun.create({
      data: {
        sourceId: input.sourceId,
        sourceEndpointId: input.sourceEndpointId ?? null,
        trigger: input.trigger as ImportTrigger,
        dryRun: input.dryRun,
        status: (input.dryRun ? 'DRY_RUN' : 'PENDING') as ImportRunStatus,
        adapterName: input.adapterName,
        adapterVersion: input.adapterVersion,
        initiatedBy: input.initiatedBy ?? null,
      },
      select: { id: true },
    })
    return { id: run.id }
  }

  async updateImportRun(id: string, patch: UpdateImportRunPatch) {
    const data: Prisma.ImportRunUncheckedUpdateInput = {}
    if (patch.status) data.status = patch.status as ImportRunStatus
    if (patch.currentStage !== undefined) data.currentStage = patch.currentStage
    if (patch.completedAt) data.completedAt = new Date(patch.completedAt)
    if (patch.durationMs != null) data.durationMs = patch.durationMs
    if (patch.retryCount != null) data.retryCount = patch.retryCount
    if (patch.bytesTransferred != null) data.bytesTransferred = patch.bytesTransferred
    if (patch.errorSummary !== undefined) data.errorSummary = patch.errorSummary
    if (patch.errorCode !== undefined) data.errorCode = patch.errorCode
    if (patch.checkpoint !== undefined) data.checkpoint = (patch.checkpoint ?? Prisma.JsonNull) as Prisma.InputJsonValue
    if (patch.stages) data.stageResults = patch.stages as unknown as Prisma.InputJsonValue
    if (patch.counts) {
      const c = patch.counts
      if (c.discovered != null) data.recordsDiscovered = c.discovered
      if (c.fetched != null) data.recordsFetched = c.fetched
      if (c.parsed != null) data.recordsParsed = c.parsed
      if (c.normalized != null) data.recordsNormalized = c.normalized
      if (c.deduplicated != null) data.recordsDeduplicated = c.deduplicated
      if (c.validated != null) data.recordsValidated = c.validated
      if (c.rejected != null) data.recordsRejected = c.rejected
      if (c.sentToReview != null) data.recordsSentToReview = c.sentToReview
      if (c.published != null) data.recordsPublished = c.published
    }
    await prisma.importRun.update({ where: { id }, data })
  }

  async recordStage(): Promise<void> {
    // No-op: the full stage array is written by updateImportRun on finalize, and
    // currentStage is set per-stage via updateImportRun. Avoids write amplification.
  }

  async createSnapshot(rec: SnapshotRecord) {
    // Immutable + idempotent: reuse an existing (sourceId, checksum) snapshot.
    const existing = await prisma.rawSnapshot.findFirst({ where: { sourceId: rec.sourceId, checksum: rec.checksum }, select: { id: true } })
    if (existing) return { id: existing.id }
    const snap = await prisma.rawSnapshot.create({
      data: {
        sourceId: rec.sourceId,
        sourceEndpointId: rec.sourceEndpointId ?? null,
        importRunId: rec.importRunId,
        requestedUrl: rec.requestedUrl ?? null,
        datasetId: rec.datasetId ?? null,
        retrievedAt: new Date(rec.retrievedAt),
        httpStatus: rec.httpStatus ?? null,
        contentType: rec.contentType ?? null,
        contentLength: rec.contentLength,
        checksum: rec.checksum,
        etag: rec.etag ?? null,
        lastModified: rec.lastModified ?? null,
        publicationDate: rec.publicationDate ? new Date(rec.publicationDate) : null,
        adapterVersion: rec.adapterVersion ?? null,
        parserVersion: rec.parserVersion ?? null,
        storageKind: rec.storageKind as SnapshotStorageKind,
        storageRef: rec.storageRef ?? null,
        inlineBody: rec.inlineBody ?? null,
        retention: rec.retention.toUpperCase() as SnapshotRetention,
      },
      select: { id: true },
    })
    return { id: snap.id }
  }

  async findExistingByFingerprint(_kind: string, fingerprints: string[]): Promise<ExistingRecord[]> {
    if (fingerprints.length === 0) return []
    const rows = await prisma.opportunity.findMany({ where: { fingerprint: { in: fingerprints } }, select: { id: true, fingerprint: true } })
    return rows.filter((r) => r.fingerprint).map((r) => ({ id: r.id, fingerprint: r.fingerprint as string, contentHash: null }))
  }

  async createCitation(c: CitationInput) {
    const row = await prisma.sourceCitation.create({
      data: {
        sourceId: c.sourceId,
        sourceEndpointId: c.sourceEndpointId ?? null,
        importRunId: c.importRunId ?? null,
        rawSnapshotId: c.rawSnapshotId ?? null,
        entityType: c.entityType,
        entityId: c.entityId ?? null,
        canonicalUrl: c.canonicalUrl ?? null,
        datasetId: c.datasetId ?? null,
        officialId: c.officialId ?? null,
        documentTitle: c.documentTitle ?? null,
        pageReference: c.pageReference ?? null,
        sourcePublicationDate: c.sourcePublicationDate ? new Date(c.sourcePublicationDate) : null,
        retrievedAt: new Date(c.retrievedAt),
        sourceVersion: c.sourceVersion ?? null,
        reviewStatus: (c.reviewStatus ?? 'unreviewed').toUpperCase() as CitationReviewStatus,
        reviewer: c.reviewer ?? null,
      },
      select: { id: true },
    })
    return { id: row.id }
  }

  async createReviewItem(runId: string, item: ReviewItemInput) {
    const run = await prisma.importRun.findUnique({ where: { id: runId }, select: { sourceId: true } })
    if (!run) throw new Error('ImportRun nuk u gjet')
    const kind = item.canonical.kind
    const type = (kind === 'fair' ? 'FAIR' : kind === 'regulation' ? 'REGULATION' : 'GRANT') as OpportunityType
    const externalId = item.fingerprint
    const opp = await prisma.opportunity.upsert({
      where: { sourceId_externalId: { sourceId: run.sourceId, externalId } },
      create: {
        sourceId: run.sourceId,
        externalId,
        type,
        title: item.canonical.title ?? '(pa titull)',
        sourceUrl: item.canonical.url ?? item.canonical.identifiers.canonicalUrl ?? '',
        status: 'NEW',
        verificationStatus: 'needs_review', // never auto-published by Phase 2
        fingerprint: item.fingerprint,
        scrapedAt: new Date(),
      },
      update: { lastSeenAt: new Date() },
      select: { id: true },
    })
    return { id: opp.id }
  }
}
