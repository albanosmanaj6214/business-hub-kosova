-- CreateTable
CREATE TABLE "HsQuery" (
    "id" TEXT NOT NULL,
    "queryKey" TEXT NOT NULL,
    "queryRaw" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usageCount" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "HsQuery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HsQuery_queryKey_key" ON "HsQuery"("queryKey");

-- CreateIndex
CREATE INDEX "HsQuery_lastUsedAt_idx" ON "HsQuery"("lastUsedAt");
