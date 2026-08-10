-- AlterTable
ALTER TABLE "Grant" ADD COLUMN     "targetCountries" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "targetSegments" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "NewsItem" ADD COLUMN     "targetCountries" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "targetSegments" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "TradeFair" ADD COLUMN     "targetCountries" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "targetSegments" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "businessSegment" TEXT NOT NULL DEFAULT 'STANDARD',
ADD COLUMN     "diasporaCountry" TEXT,
ADD COLUMN     "diasporaRole" TEXT,
ADD COLUMN     "lookingFor" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "startupStage" TEXT;
