-- Export Atlas: STRICTLY ADDITIVE. One enum + two tables (MarketProfile, MarketStat).
-- Pre-existing schema drift is intentionally not touched.

-- CreateEnum
CREATE TYPE "MarketDataStatus" AS ENUM ('PENDING_VERIFICATION', 'VERIFIED');

-- CreateTable
CREATE TABLE "MarketProfile" (
    "id" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "status" "MarketDataStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "tradeAgreement" TEXT,
    "agreementSource" TEXT,
    "currency" TEXT,
    "notes" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketStat" (
    "id" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "sectorSlug" TEXT NOT NULL DEFAULT '',
    "value" DECIMAL(20,4) NOT NULL,
    "unit" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "sourceName" TEXT NOT NULL,
    "sourceDataset" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "retrievedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MarketProfile_countryCode_key" ON "MarketProfile"("countryCode");

-- CreateIndex
CREATE UNIQUE INDEX "MarketStat_countryCode_kind_sectorSlug_year_sourceDataset_key" ON "MarketStat"("countryCode", "kind", "sectorSlug", "year", "sourceDataset");

-- CreateIndex
CREATE INDEX "MarketStat_countryCode_kind_idx" ON "MarketStat"("countryCode", "kind");
