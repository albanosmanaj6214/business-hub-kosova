-- personalization_sectors_v1: introduce sectors[] on User + targetSectors[] on Grant/TradeFair/ExportGuide
-- Strategy: keep the legacy User.sector column for one release as a fallback bridge;
-- copy values into User.sectors[] (mapped to canonical slugs) via a data step in the script.
-- We do NOT drop User.sector in this migration to keep the deploy reversible. A follow-up
-- migration will drop it once code stops reading it.

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "sectors" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "Grant"
  ADD COLUMN IF NOT EXISTS "targetSectors" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "TradeFair"
  ADD COLUMN IF NOT EXISTS "targetSectors" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "ExportGuide"
  ADD COLUMN IF NOT EXISTS "targetSectors" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
