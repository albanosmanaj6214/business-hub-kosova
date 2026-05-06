-- AlterTable
ALTER TABLE "ExportGuide" ADD COLUMN     "certifications" JSONB,
ADD COLUMN     "citations" JSONB,
ADD COLUMN     "contacts" JSONB,
ADD COLUMN     "countryCode" TEXT,
ADD COLUMN     "customs" JSONB,
ADD COLUMN     "flag" TEXT,
ADD COLUMN     "generatedBy" TEXT,
ADD COLUMN     "labeling" JSONB,
ADD COLUMN     "lastResearchedAt" TIMESTAMP(3),
ADD COLUMN     "marketOverview" JSONB,
ADD COLUMN     "requiredDocs" JSONB,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedBy" TEXT,
ADD COLUMN     "schemaVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "sectorRules" JSONB,
ADD COLUMN     "tradeAgreements" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "ExportGuide_countryCode_key" ON "ExportGuide"("countryCode");

