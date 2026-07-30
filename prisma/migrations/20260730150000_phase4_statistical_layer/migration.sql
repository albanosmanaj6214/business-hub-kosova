-- Data Phase 4: statistical data layer (ADDITIVE ONLY). Runs AFTER the Phase 2
-- idempotency patch. Numeric values stored exact (NUMERIC), not formatted text.

CREATE TYPE "StatisticalDatasetStatus" AS ENUM ('DRAFT', 'ACTIVE', 'DEPRECATED');

ALTER TABLE "SourceCitation"
  ADD COLUMN "datasetIdentifier" TEXT,
  ADD COLUMN "datasetTitle" TEXT,
  ADD COLUMN "referencePeriod" TEXT,
  ADD COLUMN "unit" TEXT,
  ADD COLUMN "currency" TEXT,
  ADD COLUMN "measureCode" TEXT,
  ADD COLUMN "measureLabel" TEXT;

CREATE TABLE "StatisticalDataset" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceEndpointId" TEXT,
    "datasetIdentifier" TEXT NOT NULL,
    "datasetPath" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "methodology" TEXT,
    "language" TEXT,
    "frequency" TEXT,
    "classificationSystem" TEXT,
    "classificationVersion" TEXT,
    "defaultUnit" TEXT,
    "defaultCurrency" TEXT,
    "geoCoverage" TEXT,
    "temporalCoverage" TEXT,
    "releaseSchedule" TEXT,
    "revisionPolicy" TEXT,
    "lastPeriod" TEXT,
    "status" "StatisticalDatasetStatus" NOT NULL DEFAULT 'DRAFT',
    "firstImportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastImportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StatisticalDataset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StatisticalObservation" (
    "id" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "ingestionRecordId" TEXT,
    "ingestionVersion" INTEGER,
    "sourceCitationId" TEXT,
    "importRunId" TEXT,
    "rawSnapshotId" TEXT,
    "referencePeriod" TEXT NOT NULL,
    "referenceYear" INTEGER,
    "frequency" TEXT,
    "measureCode" TEXT NOT NULL,
    "measureLabel" TEXT NOT NULL,
    "dimensions" JSONB NOT NULL,
    "dimensionHash" TEXT NOT NULL,
    "valueOriginal" DECIMAL(30,6),
    "unitOriginal" TEXT,
    "currencyOriginal" TEXT,
    "valueNormalized" DECIMAL(30,6),
    "unitNormalized" TEXT,
    "currencyNormalized" TEXT,
    "estimateStatus" TEXT,
    "revisionStatus" TEXT NOT NULL DEFAULT 'original',
    "confidentiality" TEXT,
    "qualityStatus" TEXT NOT NULL DEFAULT 'ok',
    "retrievedAt" TIMESTAMP(3) NOT NULL,
    "sourcePublishedAt" TIMESTAMP(3),
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StatisticalObservation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StatisticalDataset_sourceId_datasetIdentifier_key" ON "StatisticalDataset"("sourceId", "datasetIdentifier");
CREATE INDEX "StatisticalDataset_sourceId_idx" ON "StatisticalDataset"("sourceId");
CREATE UNIQUE INDEX "StatisticalObservation_datasetId_dimensionHash_key" ON "StatisticalObservation"("datasetId", "dimensionHash");
CREATE INDEX "StatisticalObservation_datasetId_referenceYear_idx" ON "StatisticalObservation"("datasetId", "referenceYear");
CREATE INDEX "StatisticalObservation_ingestionRecordId_idx" ON "StatisticalObservation"("ingestionRecordId");

ALTER TABLE "StatisticalDataset" ADD CONSTRAINT "StatisticalDataset_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StatisticalDataset" ADD CONSTRAINT "StatisticalDataset_sourceEndpointId_fkey" FOREIGN KEY ("sourceEndpointId") REFERENCES "SourceEndpoint"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StatisticalObservation" ADD CONSTRAINT "StatisticalObservation_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "StatisticalDataset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
