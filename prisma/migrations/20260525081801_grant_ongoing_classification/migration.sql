ALTER TABLE "Grant" ADD COLUMN "isOngoing" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Grant" ADD COLUMN "classifiedAt" TIMESTAMP(3);
ALTER TABLE "Grant" ADD COLUMN "classificationSource" TEXT;
CREATE INDEX "Grant_isOngoing_idx" ON "Grant"("isOngoing");
