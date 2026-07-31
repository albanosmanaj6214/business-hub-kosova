-- Certifications feature: STRICTLY ADDITIVE. Two enums, one Company column, two new
-- tables. Pre-existing schema drift (FK on-delete variants, updatedAt defaults) is
-- intentionally NOT touched here — it predates this feature and needs its own
-- reconciliation.

-- CreateEnum
CREATE TYPE "TurnoverBand" AS ENUM ('UNDER_2M', 'FROM_2M_TO_10M', 'OVER_10M');

-- CreateEnum
CREATE TYPE "CertificationKind" AS ENUM ('BASE', 'KS_MANDATORY', 'EU_MANDATORY', 'FOOD_SAFETY', 'ENVIRONMENT', 'QUALITY', 'SOCIAL', 'SECTORAL');

-- AlterTable
ALTER TABLE "Company" ADD COLUMN "turnoverBand" "TurnoverBand";

-- CreateTable
CREATE TABLE "Certification" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "CertificationKind" NOT NULL,
    "whySq" TEXT,
    "sectors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isCore" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Certification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyCertification" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "certificationId" TEXT NOT NULL,
    "obtainedYear" INTEGER,
    "validUntil" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyCertification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Certification_code_key" ON "Certification"("code");

-- CreateIndex
CREATE INDEX "Certification_isActive_idx" ON "Certification"("isActive");

-- CreateIndex
CREATE INDEX "CompanyCertification_validUntil_idx" ON "CompanyCertification"("validUntil");

-- CreateIndex
CREATE INDEX "CompanyCertification_certificationId_idx" ON "CompanyCertification"("certificationId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyCertification_companyId_certificationId_key" ON "CompanyCertification"("companyId", "certificationId");

-- AddForeignKey
ALTER TABLE "CompanyCertification" ADD CONSTRAINT "CompanyCertification_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyCertification" ADD CONSTRAINT "CompanyCertification_certificationId_fkey" FOREIGN KEY ("certificationId") REFERENCES "Certification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
