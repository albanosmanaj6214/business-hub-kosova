-- Data Phase 2 completion patch: persistent idempotency + record versioning +
-- snapshot identity (ADDITIVE ONLY). Runs AFTER the Phase 2 core migration.

CREATE TYPE "IngestionChangeType" AS ENUM ('NEW', 'CHANGED', 'UNCHANGED');
CREATE TYPE "IngestionRecordState" AS ENUM ('ACTIVE', 'SUPERSEDED', 'ARCHIVED');

-- RawSnapshot provenance-safe key (table is empty at patch time).
ALTER TABLE "RawSnapshot" ADD COLUMN "snapshotKey" TEXT NOT NULL DEFAULT '';
ALTER TABLE "RawSnapshot" ALTER COLUMN "snapshotKey" DROP DEFAULT;
CREATE UNIQUE INDEX "RawSnapshot_snapshotKey_key" ON "RawSnapshot"("snapshotKey");

-- ImportRun new counters.
ALTER TABLE "ImportRun"
  ADD COLUMN "recordsNew" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "recordsUnchanged" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "recordsChanged" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "recordsDuplicateCandidate" INTEGER NOT NULL DEFAULT 0;

-- Opportunity additive traceability (existing rows keep NULL).
ALTER TABLE "Opportunity"
  ADD COLUMN "ingestionRecordId" TEXT,
  ADD COLUMN "ingestionVersion" INTEGER,
  ADD COLUMN "ingestionChangeType" TEXT,
  ADD COLUMN "previousOpportunityId" TEXT;

CREATE TABLE "IngestionRecord" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceEndpointId" TEXT,
    "externalRecordId" TEXT,
    "canonicalUrl" TEXT,
    "identityKind" TEXT NOT NULL,
    "identityHash" TEXT NOT NULL,
    "currentContentHash" TEXT NOT NULL,
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latestImportRunId" TEXT,
    "latestRawSnapshotId" TEXT,
    "latestCitationId" TEXT,
    "reviewEntityType" TEXT,
    "reviewEntityId" TEXT,
    "duplicateCandidate" BOOLEAN NOT NULL DEFAULT false,
    "state" "IngestionRecordState" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IngestionRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IngestionRecordVersion" (
    "id" TEXT NOT NULL,
    "ingestionRecordId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "contentHash" TEXT NOT NULL,
    "changeType" "IngestionChangeType" NOT NULL,
    "importRunId" TEXT,
    "rawSnapshotId" TEXT,
    "sourceCitationId" TEXT,
    "reviewEntityType" TEXT,
    "reviewEntityId" TEXT,
    "previousVersionId" TEXT,
    "structuredDiff" JSONB,
    "normalizedSummary" JSONB,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IngestionRecordVersion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IngestionRecord_sourceId_identityHash_key" ON "IngestionRecord"("sourceId", "identityHash");
CREATE INDEX "IngestionRecord_sourceId_idx" ON "IngestionRecord"("sourceId");
CREATE INDEX "IngestionRecord_currentContentHash_idx" ON "IngestionRecord"("currentContentHash");
CREATE UNIQUE INDEX "IngestionRecordVersion_ingestionRecordId_version_key" ON "IngestionRecordVersion"("ingestionRecordId", "version");
CREATE INDEX "IngestionRecordVersion_ingestionRecordId_idx" ON "IngestionRecordVersion"("ingestionRecordId");

ALTER TABLE "IngestionRecord" ADD CONSTRAINT "IngestionRecord_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IngestionRecord" ADD CONSTRAINT "IngestionRecord_sourceEndpointId_fkey" FOREIGN KEY ("sourceEndpointId") REFERENCES "SourceEndpoint"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IngestionRecordVersion" ADD CONSTRAINT "IngestionRecordVersion_ingestionRecordId_fkey" FOREIGN KEY ("ingestionRecordId") REFERENCES "IngestionRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
