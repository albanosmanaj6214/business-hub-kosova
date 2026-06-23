-- CreateTable
CREATE TABLE "NewsItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleSq" TEXT,
    "summary" TEXT,
    "body" TEXT NOT NULL,
    "sourceName" TEXT,
    "sourceUrl" TEXT,
    "publishedAt" TIMESTAMP(3),
    "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isGeneral" BOOLEAN NOT NULL DEFAULT true,
    "targetActivityTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "targetSectors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "forFemaleOwned" BOOLEAN NOT NULL DEFAULT false,
    "dispatchStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "dispatchedAt" TIMESTAMP(3),
    "dispatchedById" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NewsItem_isActive_publishedAt_idx" ON "NewsItem"("isActive", "publishedAt");

-- CreateIndex
CREATE INDEX "NewsItem_dispatchStatus_idx" ON "NewsItem"("dispatchStatus");
