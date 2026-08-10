-- Migrim barazimi: sjell nje baze te re ne gjendjen e prodhimit.
--
-- Keto objekte u aplikuan ne prodhim me `prisma db push`, i cili nuk krijon
-- file migrimi. Rrjedhimisht `prisma migrate deploy` mbi nje baze te re jepte
-- nje skeme QE I MUNGONIN 10 tabela, 5 kolona, 15 indekse dhe 6 kufizime
-- te huaja — aplikacioni do te binte. Gjeneruar me `prisma migrate diff`
-- nga rikrijimi drejt prodhimit me 2026-08-10 dhe i verifikuar ne te dy drejtimet.
--
-- Ne prodhim ky migrim regjistrohet si i aplikuar pa u ekzekutuar
-- (`prisma migrate resolve --applied`), sepse objektet ekzistojne tashme.

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "productsSought" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "ExportGuide" ADD COLUMN     "marketStats" JSONB;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "lastLoginIp" TEXT;

-- CreateTable
CREATE TABLE "ArbkTemplate" (
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedById" TEXT,

    CONSTRAINT "ArbkTemplate_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorEmail" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "summary" TEXT NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactRequest" (
    "id" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toCompanyId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "ContactRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnergyNotice" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'NEWS',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "url" TEXT,
    "forProducers" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dispatchedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnergyNotice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnergyPrice" (
    "id" TEXT NOT NULL,
    "market" TEXT NOT NULL,
    "supplier" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'EUR/MWh',
    "refDate" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "url" TEXT,
    "dispatchedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnergyPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "refId" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferRequest" (
    "id" TEXT NOT NULL,
    "requesterUserId" TEXT NOT NULL,
    "requesterCompanyId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "categoryId" TEXT,
    "sectorSlug" TEXT,
    "quantity" TEXT,
    "destinationCountry" TEXT,
    "deadline" TIMESTAMP(3),
    "specifications" TEXT,
    "budget" TEXT,
    "verifiedOnly" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "notifiedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfferRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferResponse" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "priceInfo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfferResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offering" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "categoryId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Offering_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductCategory" (
    "id" TEXT NOT NULL,
    "sectorSlug" TEXT NOT NULL,
    "nameSq" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "proposedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_actorEmail_idx" ON "AuditLog"("actorEmail" ASC);

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType" ASC, "entityId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ContactRequest_fromUserId_toCompanyId_key" ON "ContactRequest"("fromUserId" ASC, "toCompanyId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_kind_refId_key" ON "MediaAsset"("kind" ASC, "refId" ASC);

-- CreateIndex
CREATE INDEX "MediaAsset_refId_idx" ON "MediaAsset"("refId" ASC);

-- CreateIndex
CREATE INDEX "OfferRequest_categoryId_idx" ON "OfferRequest"("categoryId" ASC);

-- CreateIndex
CREATE INDEX "OfferRequest_requesterUserId_idx" ON "OfferRequest"("requesterUserId" ASC);

-- CreateIndex
CREATE INDEX "OfferRequest_status_createdAt_idx" ON "OfferRequest"("status" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "OfferResponse_companyId_idx" ON "OfferResponse"("companyId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "OfferResponse_requestId_companyId_key" ON "OfferResponse"("requestId" ASC, "companyId" ASC);

-- CreateIndex
CREATE INDEX "Offering_categoryId_status_idx" ON "Offering"("categoryId" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "Offering_companyId_idx" ON "Offering"("companyId" ASC);

-- CreateIndex
CREATE INDEX "ProductCategory_sectorSlug_status_idx" ON "ProductCategory"("sectorSlug" ASC, "status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategory_slug_key" ON "ProductCategory"("slug" ASC);

-- AddForeignKey
ALTER TABLE "ContactRequest" ADD CONSTRAINT "ContactRequest_toCompanyId_fkey" FOREIGN KEY ("toCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OfferRequest" ADD CONSTRAINT "OfferRequest_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OfferResponse" ADD CONSTRAINT "OfferResponse_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OfferResponse" ADD CONSTRAINT "OfferResponse_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "OfferRequest"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Offering" ADD CONSTRAINT "Offering_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Offering" ADD CONSTRAINT "Offering_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

