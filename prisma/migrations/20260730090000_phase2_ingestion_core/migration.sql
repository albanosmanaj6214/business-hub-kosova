-- Data Phase 2: canonical ingestion core (ADDITIVE ONLY).
-- New enums + 3 new tables + indexes + FKs. No existing table/column changed.

CREATE TYPE "ImportRunStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'PARTIAL', 'DRY_RUN', 'CANCELLED');
CREATE TYPE "ImportTrigger" AS ENUM ('MANUAL', 'SCHEDULED', 'FIXTURE', 'DRY_RUN');
CREATE TYPE "SnapshotStorageKind" AS ENUM ('INLINE', 'FILE', 'OBJECT');
CREATE TYPE "SnapshotRetention" AS ENUM ('EPHEMERAL', 'STANDARD', 'LONG_TERM');
CREATE TYPE "CitationReviewStatus" AS ENUM ('UNREVIEWED', 'IN_REVIEW', 'APPROVED', 'REJECTED');

CREATE TABLE "ImportRun" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceEndpointId" TEXT,
    "trigger" "ImportTrigger" NOT NULL,
    "dryRun" BOOLEAN NOT NULL DEFAULT false,
    "status" "ImportRunStatus" NOT NULL DEFAULT 'PENDING',
    "currentStage" TEXT,
    "adapterName" TEXT NOT NULL,
    "adapterVersion" TEXT NOT NULL,
    "parserVersion" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "checkpoint" JSONB,
    "recordsDiscovered" INTEGER NOT NULL DEFAULT 0,
    "recordsFetched" INTEGER NOT NULL DEFAULT 0,
    "recordsParsed" INTEGER NOT NULL DEFAULT 0,
    "recordsNormalized" INTEGER NOT NULL DEFAULT 0,
    "recordsDeduplicated" INTEGER NOT NULL DEFAULT 0,
    "recordsValidated" INTEGER NOT NULL DEFAULT 0,
    "recordsRejected" INTEGER NOT NULL DEFAULT 0,
    "recordsSentToReview" INTEGER NOT NULL DEFAULT 0,
    "recordsPublished" INTEGER NOT NULL DEFAULT 0,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "bytesTransferred" INTEGER NOT NULL DEFAULT 0,
    "errorCode" TEXT,
    "errorSummary" TEXT,
    "stageResults" JSONB,
    "initiatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ImportRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RawSnapshot" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceEndpointId" TEXT,
    "importRunId" TEXT NOT NULL,
    "requestedUrl" TEXT,
    "datasetId" TEXT,
    "retrievedAt" TIMESTAMP(3) NOT NULL,
    "httpStatus" INTEGER,
    "contentType" TEXT,
    "contentLength" INTEGER NOT NULL DEFAULT 0,
    "checksum" TEXT NOT NULL,
    "etag" TEXT,
    "lastModified" TEXT,
    "publicationDate" TIMESTAMP(3),
    "adapterVersion" TEXT,
    "parserVersion" TEXT,
    "storageKind" "SnapshotStorageKind" NOT NULL DEFAULT 'INLINE',
    "storageRef" TEXT,
    "inlineBody" TEXT,
    "retention" "SnapshotRetention" NOT NULL DEFAULT 'STANDARD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RawSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SourceCitation" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceEndpointId" TEXT,
    "importRunId" TEXT,
    "rawSnapshotId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "canonicalUrl" TEXT,
    "datasetId" TEXT,
    "officialId" TEXT,
    "documentTitle" TEXT,
    "pageReference" TEXT,
    "sourcePublicationDate" TIMESTAMP(3),
    "retrievedAt" TIMESTAMP(3) NOT NULL,
    "sourceVersion" TEXT,
    "reviewStatus" "CitationReviewStatus" NOT NULL DEFAULT 'UNREVIEWED',
    "reviewer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SourceCitation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ImportRun_sourceId_startedAt_idx" ON "ImportRun"("sourceId", "startedAt");
CREATE INDEX "ImportRun_status_idx" ON "ImportRun"("status");
CREATE INDEX "ImportRun_dryRun_idx" ON "ImportRun"("dryRun");
CREATE INDEX "RawSnapshot_sourceId_retrievedAt_idx" ON "RawSnapshot"("sourceId", "retrievedAt");
CREATE INDEX "RawSnapshot_importRunId_idx" ON "RawSnapshot"("importRunId");
CREATE INDEX "RawSnapshot_checksum_idx" ON "RawSnapshot"("checksum");
CREATE INDEX "SourceCitation_entityType_entityId_idx" ON "SourceCitation"("entityType", "entityId");
CREATE INDEX "SourceCitation_sourceId_idx" ON "SourceCitation"("sourceId");
CREATE INDEX "SourceCitation_importRunId_idx" ON "SourceCitation"("importRunId");

ALTER TABLE "ImportRun" ADD CONSTRAINT "ImportRun_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ImportRun" ADD CONSTRAINT "ImportRun_sourceEndpointId_fkey" FOREIGN KEY ("sourceEndpointId") REFERENCES "SourceEndpoint"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RawSnapshot" ADD CONSTRAINT "RawSnapshot_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RawSnapshot" ADD CONSTRAINT "RawSnapshot_sourceEndpointId_fkey" FOREIGN KEY ("sourceEndpointId") REFERENCES "SourceEndpoint"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RawSnapshot" ADD CONSTRAINT "RawSnapshot_importRunId_fkey" FOREIGN KEY ("importRunId") REFERENCES "ImportRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SourceCitation" ADD CONSTRAINT "SourceCitation_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SourceCitation" ADD CONSTRAINT "SourceCitation_sourceEndpointId_fkey" FOREIGN KEY ("sourceEndpointId") REFERENCES "SourceEndpoint"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SourceCitation" ADD CONSTRAINT "SourceCitation_importRunId_fkey" FOREIGN KEY ("importRunId") REFERENCES "ImportRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SourceCitation" ADD CONSTRAINT "SourceCitation_rawSnapshotId_fkey" FOREIGN KEY ("rawSnapshotId") REFERENCES "RawSnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
