ALTER TABLE "Grant" ADD COLUMN "audience" TEXT;
CREATE INDEX "Grant_audience_idx" ON "Grant"("audience");
