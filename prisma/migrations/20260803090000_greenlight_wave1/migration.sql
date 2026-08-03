-- Faza 1b-B: STRICTLY ADDITIVE. Company.productGroups + tabela MarketRequirement.
-- Drift-i ekzistues i prod-it nuk preket.

-- AlterTable
ALTER TABLE "Company" ADD COLUMN "productGroups" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "MarketRequirement" (
    "id" TEXT NOT NULL,
    "marketGroup" TEXT NOT NULL,
    "productGroup" TEXT NOT NULL,
    "requirementType" TEXT NOT NULL,
    "certificationCode" TEXT,
    "titleSq" TEXT NOT NULL,
    "detailSq" TEXT,
    "legalActName" TEXT,
    "legalActUrl" TEXT,
    "unlockPathSq" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "verifiedAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MarketRequirement_marketGroup_productGroup_requirementType__key" ON "MarketRequirement"("marketGroup", "productGroup", "requirementType", "titleSq");

-- CreateIndex
CREATE INDEX "MarketRequirement_marketGroup_status_idx" ON "MarketRequirement"("marketGroup", "status");

-- CreateIndex
CREATE INDEX "MarketRequirement_productGroup_idx" ON "MarketRequirement"("productGroup");
