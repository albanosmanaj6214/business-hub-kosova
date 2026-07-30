// Production PipelineStore backed by Prisma. Persistent, version-aware, idempotent
// review handoff routed to the EXISTING Opportunity review queue
// (verificationStatus='needs_review'; never auto-published). Concurrency-safe via
// unique constraints + upsert + P2002 conflict recovery. Not run live in Phase 2.
import { Prisma } from '@prisma/client'
import type {
  ImportTrigger, ImportRunStatus, SnapshotStorageKind, SnapshotRetention,
  CitationReviewStatus, OpportunityType, IngestionChangeType, IngestionRecordState,
} from '@prisma/client'
import { prisma } from '@/lib/prisma'
import type { PipelineStore, CreateImportRunInput, UpdateImportRunPatch, HandoffInput, HandoffOutcome } from './store'
import type { SnapshotRecord } from './snapshot'
import type { CitationInput } from './citation'
import { decideChangeType, structuredDiff, canonicalSummary } from './versioning'

function isP2002(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002'
}

export class PrismaPipelineStore implements PipelineStore {
  async createImportRun(input: CreateImportRunInput) {
    const run = await prisma.importRun.create({
      data: {
        sourceId: input.sourceId, sourceEndpointId: input.sourceEndpointId ?? null,
        trigger: input.trigger as ImportTrigger, dryRun: input.dryRun,
        status: (input.dryRun ? 'DRY_RUN' : 'PENDING') as ImportRunStatus,
        adapterName: input.adapterName, adapterVersion: input.adapterVersion, initiatedBy: input.initiatedBy ?? null,
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
      if (c.newRecords != null) data.recordsNew = c.newRecords
      if (c.unchanged != null) data.recordsUnchanged = c.unchanged
      if (c.changedVersions != null) data.recordsChanged = c.changedVersions
      if (c.duplicateCandidates != null) data.recordsDuplicateCandidate = c.duplicateCandidates
    }
    await prisma.importRun.update({ where: { id }, data })
  }

  async recordStage(): Promise<void> {
    // No-op: full stageResults written on finalize; currentStage set via updateImportRun.
  }

  async createSnapshot(rec: SnapshotRecord) {
    // Immutable + idempotent by provenance-safe snapshotKey (NOT bare checksum):
    // the same bytes from a different endpoint/URL keep separate provenance.
    const existing = await prisma.rawSnapshot.findUnique({ where: { snapshotKey: rec.snapshotKey }, select: { id: true } })
    if (existing) return { id: existing.id }
    try {
      const snap = await prisma.rawSnapshot.create({
        data: {
          sourceId: rec.sourceId, sourceEndpointId: rec.sourceEndpointId ?? null, importRunId: rec.importRunId,
          requestedUrl: rec.requestedUrl ?? null, datasetId: rec.datasetId ?? null, retrievedAt: new Date(rec.retrievedAt),
          httpStatus: rec.httpStatus ?? null, contentType: rec.contentType ?? null, contentLength: rec.contentLength,
          checksum: rec.checksum, snapshotKey: rec.snapshotKey, etag: rec.etag ?? null, lastModified: rec.lastModified ?? null,
          publicationDate: rec.publicationDate ? new Date(rec.publicationDate) : null,
          adapterVersion: rec.adapterVersion ?? null, parserVersion: rec.parserVersion ?? null,
          storageKind: rec.storageKind as SnapshotStorageKind, storageRef: rec.storageRef ?? null,
          inlineBody: rec.inlineBody ?? null, retention: rec.retention.toUpperCase() as SnapshotRetention,
        },
        select: { id: true },
      })
      return { id: snap.id }
    } catch (e) {
      if (isP2002(e)) {
        const again = await prisma.rawSnapshot.findUnique({ where: { snapshotKey: rec.snapshotKey }, select: { id: true } })
        if (again) return { id: again.id }
      }
      throw e
    }
  }

  private async createCitation(c: CitationInput): Promise<{ id: string }> {
    const row = await prisma.sourceCitation.create({
      data: {
        sourceId: c.sourceId, sourceEndpointId: c.sourceEndpointId ?? null, importRunId: c.importRunId ?? null,
        rawSnapshotId: c.rawSnapshotId ?? null, entityType: c.entityType, entityId: c.entityId ?? null,
        canonicalUrl: c.canonicalUrl ?? null, datasetId: c.datasetId ?? null, officialId: c.officialId ?? null,
        documentTitle: c.documentTitle ?? null, pageReference: c.pageReference ?? null,
        sourcePublicationDate: c.sourcePublicationDate ? new Date(c.sourcePublicationDate) : null,
        retrievedAt: new Date(c.retrievedAt), sourceVersion: c.sourceVersion ?? null,
        reviewStatus: (c.reviewStatus ?? 'unreviewed').toUpperCase() as CitationReviewStatus, reviewer: c.reviewer ?? null,
      },
      select: { id: true },
    })
    return { id: row.id }
  }

  private async upsertOpportunity(sourceId: string, input: HandoffInput, recordId: string, version: number, changeType: string, prevOppId: string | null): Promise<{ id: string }> {
    const kind = input.canonical.kind
    const type = (kind === 'fair' ? 'FAIR' : kind === 'regulation' ? 'REGULATION' : 'GRANT') as OpportunityType
    // One review Opportunity per version (externalId namespaced by version).
    const externalId = `${input.identity.hash}:v${version}`
    const opp = await prisma.opportunity.upsert({
      where: { sourceId_externalId: { sourceId, externalId } },
      create: {
        sourceId, externalId, type,
        title: input.canonical.title ?? '(pa titull)',
        sourceUrl: input.canonical.url ?? input.canonical.identifiers.canonicalUrl ?? '',
        status: 'NEW', verificationStatus: 'needs_review', fingerprint: input.identity.hash, scrapedAt: new Date(),
        ingestionRecordId: recordId, ingestionVersion: version, ingestionChangeType: changeType, previousOpportunityId: prevOppId,
      },
      update: { lastSeenAt: new Date(), ingestionVersion: version, ingestionChangeType: changeType, ...(prevOppId ? { previousOpportunityId: prevOppId } : {}) },
      select: { id: true },
    })
    return opp
  }

  async handoffRecord(runId: string, input: HandoffInput): Promise<HandoffOutcome> {
    const run = await prisma.importRun.findUnique({ where: { id: runId }, select: { sourceId: true } })
    if (!run) throw new Error('ImportRun nuk u gjet')
    const sourceId = run.sourceId
    const now = input.now()
    const identityHash = input.identity.hash

    let rec = await prisma.ingestionRecord.findUnique({ where: { sourceId_identityHash: { sourceId, identityHash } } })
    const changeType = decideChangeType(rec ? { contentHash: rec.currentContentHash } : null, input.contentHash)

    if (changeType === 'unchanged' && rec) {
      await prisma.ingestionRecord.update({ where: { id: rec.id }, data: { lastSeenAt: now, latestImportRunId: runId, ...(input.snapshotId ? { latestRawSnapshotId: input.snapshotId } : {}) } })
      return { recordId: rec.id, version: rec.currentVersion, changeType, duplicateCandidate: false, reviewItemCreated: false }
    }

    const citation = await this.createCitation(input.citation)

    if (changeType === 'new') {
      const dupOther = await prisma.ingestionRecord.findFirst({ where: { sourceId, currentContentHash: input.contentHash, NOT: { identityHash } }, select: { id: true } })
      const duplicateCandidate = !!dupOther
      try {
        rec = await prisma.ingestionRecord.create({
          data: {
            sourceId, sourceEndpointId: input.sourceEndpointId ?? null,
            externalRecordId: input.identity.kind === 'official_id' ? input.identity.value : null,
            canonicalUrl: input.canonical.identifiers.canonicalUrl ?? input.canonical.url ?? null,
            identityKind: input.identity.kind, identityHash,
            currentContentHash: input.contentHash, currentVersion: 1,
            firstSeenAt: now, lastSeenAt: now, lastChangedAt: now,
            latestImportRunId: runId, latestRawSnapshotId: input.snapshotId ?? null, latestCitationId: citation.id,
            reviewEntityType: 'Opportunity', duplicateCandidate, state: 'ACTIVE' as IngestionRecordState,
          },
        })
      } catch (e) {
        if (isP2002(e)) {
          // Lost the create race: another concurrent run owns this record.
          rec = await prisma.ingestionRecord.findUnique({ where: { sourceId_identityHash: { sourceId, identityHash } } })
          if (rec) return { recordId: rec.id, version: rec.currentVersion, changeType: 'unchanged', duplicateCandidate: false, reviewItemCreated: false }
        }
        throw e
      }
      const review = await this.upsertOpportunity(sourceId, input, rec!.id, 1, 'new', null)
      try {
        await prisma.ingestionRecordVersion.create({
          data: {
            ingestionRecordId: rec!.id, version: 1, contentHash: input.contentHash, changeType: 'NEW' as IngestionChangeType,
            importRunId: runId, rawSnapshotId: input.snapshotId ?? null, sourceCitationId: citation.id,
            reviewEntityType: 'Opportunity', reviewEntityId: review.id, previousVersionId: null,
            normalizedSummary: canonicalSummary(input.canonical) as Prisma.InputJsonValue, detectedAt: now,
          },
        })
      } catch (e) { if (!isP2002(e)) throw e } // version 1 already created by the race winner
      await prisma.ingestionRecord.update({ where: { id: rec!.id }, data: { reviewEntityId: review.id } })
      return { recordId: rec!.id, version: 1, changeType: 'new', duplicateCandidate, reviewEntityId: review.id, reviewItemCreated: true }
    }

    // changed
    const r = rec!
    const prevVersion = await prisma.ingestionRecordVersion.findFirst({ where: { ingestionRecordId: r.id }, orderBy: { version: 'desc' } })
    const newVersionNum = r.currentVersion + 1
    const prevOppId = r.reviewEntityId ?? null
    const review = await this.upsertOpportunity(sourceId, input, r.id, newVersionNum, 'changed', prevOppId)
    const prevSummary = (prevVersion?.normalizedSummary ?? {}) as Record<string, unknown>
    try {
      await prisma.ingestionRecordVersion.create({
        data: {
          ingestionRecordId: r.id, version: newVersionNum, contentHash: input.contentHash, changeType: 'CHANGED' as IngestionChangeType,
          importRunId: runId, rawSnapshotId: input.snapshotId ?? null, sourceCitationId: citation.id,
          reviewEntityType: 'Opportunity', reviewEntityId: review.id, previousVersionId: prevVersion?.id ?? null,
          structuredDiff: structuredDiff(prevSummary, canonicalSummary(input.canonical)) as unknown as Prisma.InputJsonValue,
          normalizedSummary: canonicalSummary(input.canonical) as Prisma.InputJsonValue, detectedAt: now,
        },
      })
    } catch (e) {
      if (isP2002(e)) {
        // Concurrent identical change: winner already created this version.
        return { recordId: r.id, version: newVersionNum, changeType: 'changed', duplicateCandidate: false, reviewEntityId: review.id, reviewItemCreated: false }
      }
      throw e
    }
    // Optimistic lock: only advance if currentVersion is still the value we read.
    await prisma.ingestionRecord.updateMany({
      where: { id: r.id, currentVersion: r.currentVersion },
      data: {
        currentContentHash: input.contentHash, currentVersion: newVersionNum, lastSeenAt: now, lastChangedAt: now,
        latestImportRunId: runId, latestCitationId: citation.id, reviewEntityId: review.id,
        ...(input.snapshotId ? { latestRawSnapshotId: input.snapshotId } : {}),
      },
    })
    return { recordId: r.id, version: newVersionNum, changeType: 'changed', duplicateCandidate: false, reviewEntityId: review.id, reviewItemCreated: true }
  }
}
