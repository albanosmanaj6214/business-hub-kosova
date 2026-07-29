-- Phase 1: Source Registry & Governance (additive, non-destructive).
-- Adds Tier D, SourceLifecycle + SourceHealthState enums, Source governance
-- columns (all nullable/defaulted), and the SourceEndpoint table.
-- Pre-existing schema/DB drift (unrelated FK referential-action changes and
-- updatedAt defaults, observed in prod) is intentionally EXCLUDED; it is not
-- part of Phase 1 and must be handled by a separate, approved drift-repair.

-- CreateEnum
CREATE TYPE "SourceLifecycle" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'ACTIVE', 'PAUSED', 'DISABLED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SourceHealthState" AS ENUM ('UNKNOWN', 'HEALTHY', 'DEGRADED', 'FAILING', 'STALE', 'PAUSED', 'DISABLED', 'AUTH_REQUIRED', 'SCHEMA_CHANGED');

-- AlterEnum
ALTER TYPE "SourceTier" ADD VALUE 'D';

-- AlterTable
ALTER TABLE "Source" ADD COLUMN     "accessMethod" TEXT,
ADD COLUMN     "attributionRequirements" TEXT,
ADD COLUMN     "authenticationType" TEXT DEFAULT 'none',
ADD COLUMN     "autoPublishAllowed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "concurrencyLimit" INTEGER,
ADD COLUMN     "contentTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "country" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "freshnessSlaHours" INTEGER,
ADD COLUMN     "healthStatus" "SourceHealthState" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN     "institutionName" TEXT,
ADD COLUMN     "license" TEXT,
ADD COLUMN     "lifecycle" "SourceLifecycle",
ADD COLUMN     "nextScheduledRunAt" TIMESTAMP(3),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "officialDomain" TEXT,
ADD COLUMN     "owner" TEXT,
ADD COLUMN     "rateLimitPerMin" INTEGER,
ADD COLUMN     "relevantCountries" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "relevantHsChapters" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "relevantRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "requestTimeoutMs" INTEGER,
ADD COLUMN     "retryPolicy" JSONB,
ADD COLUMN     "reviewer" TEXT,
ADD COLUMN     "robotsReviewedAt" TIMESTAMP(3),
ADD COLUMN     "robotsStatus" TEXT,
ADD COLUMN     "secretReference" TEXT,
ADD COLUMN     "sourceType" TEXT,
ADD COLUMN     "termsOfUseStatus" TEXT DEFAULT 'not_reviewed',
ADD COLUMN     "termsReviewedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "SourceEndpoint" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "endpointType" TEXT,
    "contentType" TEXT,
    "accessMethod" TEXT,
    "authReference" TEXT,
    "datasetId" TEXT,
    "language" TEXT,
    "country" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "rateLimitPerMin" INTEGER,
    "requestTimeoutMs" INTEGER,
    "scheduleOverride" TEXT,
    "lastCheckedAt" TIMESTAMP(3),
    "lastSuccessAt" TIMESTAMP(3),
    "healthStatus" "SourceHealthState" NOT NULL DEFAULT 'UNKNOWN',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SourceEndpoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SourceEndpoint_sourceId_idx" ON "SourceEndpoint"("sourceId");

-- CreateIndex
CREATE INDEX "Source_lifecycle_idx" ON "Source"("lifecycle");

-- AddForeignKey
ALTER TABLE "SourceEndpoint" ADD CONSTRAINT "SourceEndpoint_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;
