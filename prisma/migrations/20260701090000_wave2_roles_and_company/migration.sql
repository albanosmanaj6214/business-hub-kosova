-- CreateEnum
CREATE TYPE "VisibilityLevel" AS ENUM ('PRIVATE', 'MEMBERS', 'PUBLIC', 'VERIFIED', 'FEATURED');

-- CreateEnum
CREATE TYPE "ProfileStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "StartupStage" AS ENUM ('IDEA', 'IN_REGISTRATION', 'REGISTERED_NO_REVENUE', 'EARLY_REVENUE', 'GROWING');

-- CreateEnum
CREATE TYPE "LegalForm" AS ENUM ('BIZNES_INDIVIDUAL', 'SHPK', 'SHA', 'ORTAKERI_E_PERGJITHSHME', 'ORTAKERI_E_KUFIZUAR', 'DEGE_E_HUAJ');

-- CreateEnum
CREATE TYPE "DiasporaSubRole" AS ENUM ('BUYER', 'INVESTOR', 'DISTRIBUTOR', 'IMPORTER', 'PARTNER', 'SERVICE_PROVIDER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'NEWS';
ALTER TYPE "NotificationType" ADD VALUE 'SUBVENTION';
ALTER TYPE "NotificationType" ADD VALUE 'OFFER_REQUEST';
ALTER TYPE "NotificationType" ADD VALUE 'MATCH';
ALTER TYPE "NotificationType" ADD VALUE 'PROFILE';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'KOSOVO_BUSINESS';
ALTER TYPE "Role" ADD VALUE 'STARTUP';
ALTER TYPE "Role" ADD VALUE 'DIASPORA';
ALTER TYPE "Role" ADD VALUE 'INDIVIDUAL';
ALTER TYPE "Role" ADD VALUE 'SUPER_ADMIN';

-- AlterTable
ALTER TABLE "Grant" DROP COLUMN "targetCountries",
DROP COLUMN "targetSegments";

-- AlterTable
ALTER TABLE "NewsItem" DROP COLUMN "targetCountries",
DROP COLUMN "targetSegments";

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "reason" TEXT;

-- AlterTable
ALTER TABLE "TradeFair" DROP COLUMN "targetCountries",
DROP COLUMN "targetSegments";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "businessSegment",
DROP COLUMN "diasporaCountry",
DROP COLUMN "diasporaRole",
DROP COLUMN "lookingFor",
DROP COLUMN "startupStage";

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "roleType" "Role" NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "activityType" TEXT,
    "sectors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "employeeCount" TEXT,
    "femaleOwnership" BOOLEAN,
    "municipality" TEXT,
    "country" TEXT DEFAULT 'Kosovë',
    "address" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "contactPerson" TEXT,
    "logoUrl" TEXT,
    "coverImageUrl" TEXT,
    "shortDescription" TEXT,
    "longDescription" TEXT,
    "visibilityLevel" "VisibilityLevel" NOT NULL DEFAULT 'PRIVATE',
    "profileStatus" "ProfileStatus" NOT NULL DEFAULT 'DRAFT',
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "rejectedReason" TEXT,
    "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StartupProfile" (
    "companyId" TEXT NOT NULL,
    "stage" "StartupStage" NOT NULL DEFAULT 'IDEA',
    "intendedLegalForm" "LegalForm",
    "needs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hasProduct" BOOLEAN NOT NULL DEFAULT false,
    "prototypeUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StartupProfile_pkey" PRIMARY KEY ("companyId")
);

-- CreateTable
CREATE TABLE "DiasporaProfile" (
    "companyId" TEXT NOT NULL,
    "countryOfOperation" TEXT NOT NULL,
    "city" TEXT,
    "countriesActive" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "subRoles" "DiasporaSubRole"[] DEFAULT ARRAY[]::"DiasporaSubRole"[],
    "sectorsOfInterest" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "productsSought" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "productsOffered" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "purposeSummary" TEXT,
    "investmentBudget" TEXT,
    "marketShare" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiasporaProfile_pkey" PRIMARY KEY ("companyId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_ownerUserId_key" ON "Company"("ownerUserId");

-- CreateIndex
CREATE INDEX "Company_roleType_profileStatus_idx" ON "Company"("roleType", "profileStatus");

-- CreateIndex
CREATE INDEX "Company_visibilityLevel_idx" ON "Company"("visibilityLevel");

-- CreateIndex
CREATE INDEX "Company_country_idx" ON "Company"("country");

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StartupProfile" ADD CONSTRAINT "StartupProfile_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiasporaProfile" ADD CONSTRAINT "DiasporaProfile_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

