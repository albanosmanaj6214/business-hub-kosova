-- AlterTable
ALTER TABLE "Grant" ADD COLUMN     "isGeneral" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "targetActivityTypes" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "TradeFair" ADD COLUMN     "isGeneral" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "targetActivityTypes" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "activityType" TEXT,
ADD COLUMN     "entitledSectors" TEXT[] DEFAULT ARRAY[]::TEXT[];
