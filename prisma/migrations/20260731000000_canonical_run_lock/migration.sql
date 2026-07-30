-- Canonical ingestion lease lock (additive; no existing table touched)
CREATE TABLE "CanonicalRunLock" (
    "key" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "endpointId" TEXT,
    "holder" TEXT NOT NULL,
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CanonicalRunLock_pkey" PRIMARY KEY ("key")
);
CREATE INDEX "CanonicalRunLock_sourceId_idx" ON "CanonicalRunLock"("sourceId");
CREATE INDEX "CanonicalRunLock_expiresAt_idx" ON "CanonicalRunLock"("expiresAt");
