-- CreateEnum
CREATE TYPE "SourceTier" AS ENUM ('A', 'B', 'C');

-- CreateEnum
CREATE TYPE "SourceCategory" AS ENUM ('GRANT', 'FAIR', 'REGULATION', 'MIXED');

-- CreateEnum
CREATE TYPE "OpportunityType" AS ENUM ('GRANT', 'FAIR', 'REGULATION');

-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('NEW', 'REVIEWED', 'PUBLISHED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ScrapeStatus" AS ENUM ('SUCCESS', 'PARTIAL', 'FAILED');

-- CreateEnum
CREATE TYPE "ScrapeTrigger" AS ENUM ('CRON', 'N8N', 'MANUAL', 'API');

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tier" "SourceTier" NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "category" "SourceCategory" NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'sq',
    "strategies" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "schedule" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Opportunity" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "type" "OpportunityType" NOT NULL,
    "title" TEXT NOT NULL,
    "titleEn" TEXT,
    "description" TEXT,
    "deadline" TIMESTAMP(3),
    "amount" TEXT,
    "currency" TEXT DEFAULT 'EUR',
    "eligibility" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "rawHtml" TEXT,
    "status" "OpportunityStatus" NOT NULL DEFAULT 'NEW',
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attemptId" TEXT,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScrapeAttempt" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "strategyUsed" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "status" "ScrapeStatus" NOT NULL,
    "itemsFound" INTEGER NOT NULL DEFAULT 0,
    "itemsNew" INTEGER NOT NULL DEFAULT 0,
    "itemsUpdated" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "durationMs" INTEGER,
    "triggeredBy" "ScrapeTrigger" NOT NULL,

    CONSTRAINT "ScrapeAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceHealth" (
    "sourceId" TEXT NOT NULL,
    "lastSuccessAt" TIMESTAMP(3),
    "lastFailureAt" TIMESTAMP(3),
    "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
    "currentStrategy" INTEGER NOT NULL DEFAULT 1,
    "avgDurationMs" INTEGER,
    "totalItemsLifetime" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SourceHealth_pkey" PRIMARY KEY ("sourceId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Source_code_key" ON "Source"("code");

-- CreateIndex
CREATE INDEX "Source_tier_isActive_idx" ON "Source"("tier", "isActive");

-- CreateIndex
CREATE INDEX "Source_category_idx" ON "Source"("category");

-- CreateIndex
CREATE INDEX "Opportunity_type_status_idx" ON "Opportunity"("type", "status");

-- CreateIndex
CREATE INDEX "Opportunity_deadline_idx" ON "Opportunity"("deadline");

-- CreateIndex
CREATE INDEX "Opportunity_lastSeenAt_idx" ON "Opportunity"("lastSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "Opportunity_sourceId_externalId_key" ON "Opportunity"("sourceId", "externalId");

-- CreateIndex
CREATE INDEX "ScrapeAttempt_sourceId_startedAt_idx" ON "ScrapeAttempt"("sourceId", "startedAt");

-- CreateIndex
CREATE INDEX "ScrapeAttempt_status_idx" ON "ScrapeAttempt"("status");

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "ScrapeAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScrapeAttempt" ADD CONSTRAINT "ScrapeAttempt_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceHealth" ADD CONSTRAINT "SourceHealth_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;
