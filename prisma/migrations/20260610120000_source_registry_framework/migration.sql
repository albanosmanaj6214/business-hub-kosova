-- Source Registry + Scraper Framework (additive only; no existing column changed)

ALTER TABLE "Source"
  ADD COLUMN IF NOT EXISTS "kind" TEXT,
  ADD COLUMN IF NOT EXISTS "orgCategory" TEXT,
  ADD COLUMN IF NOT EXISTS "reliability" TEXT DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS "publishMode" TEXT NOT NULL DEFAULT 'review',
  ADD COLUMN IF NOT EXISTS "frequency" TEXT NOT NULL DEFAULT 'daily',
  ADD COLUMN IF NOT EXISTS "sectorsHint" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "selectors" JSONB,
  ADD COLUMN IF NOT EXISTS "lastCheckedAt" TIMESTAMP(3);

ALTER TABLE "Opportunity"
  ADD COLUMN IF NOT EXISTS "verificationStatus" TEXT,
  ADD COLUMN IF NOT EXISTS "fingerprint" TEXT,
  ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "amountMin" INTEGER,
  ADD COLUMN IF NOT EXISTS "amountMax" INTEGER,
  ADD COLUMN IF NOT EXISTS "supportTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "documents" JSONB,
  ADD COLUMN IF NOT EXISTS "attachments" JSONB,
  ADD COLUMN IF NOT EXISTS "originalTextSnippet" TEXT,
  ADD COLUMN IF NOT EXISTS "extractedFrom" TEXT,
  ADD COLUMN IF NOT EXISTS "scrapedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Opportunity_fingerprint_idx" ON "Opportunity"("fingerprint");
CREATE INDEX IF NOT EXISTS "Opportunity_verificationStatus_idx" ON "Opportunity"("verificationStatus");
