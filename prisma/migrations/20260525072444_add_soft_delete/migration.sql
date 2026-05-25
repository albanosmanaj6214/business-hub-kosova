-- Add soft-delete column to Grant, TradeFair, ExportGuide
ALTER TABLE "Grant" ADD COLUMN "deletedAt" TIMESTAMP(3);
CREATE INDEX "Grant_deletedAt_idx" ON "Grant"("deletedAt");

ALTER TABLE "TradeFair" ADD COLUMN "deletedAt" TIMESTAMP(3);
CREATE INDEX "TradeFair_deletedAt_idx" ON "TradeFair"("deletedAt");

ALTER TABLE "ExportGuide" ADD COLUMN "deletedAt" TIMESTAMP(3);
CREATE INDEX "ExportGuide_deletedAt_idx" ON "ExportGuide"("deletedAt");
