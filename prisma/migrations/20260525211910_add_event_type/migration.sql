-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('FAIR', 'TRAINING', 'WEBINAR', 'MATCHMAKING', 'WORKSHOP', 'CONFERENCE');

-- DropIndex
DROP INDEX "ExportGuide_deletedAt_idx";

-- DropIndex
DROP INDEX "Grant_audience_idx";

-- DropIndex
DROP INDEX "Grant_deletedAt_idx";

-- DropIndex
DROP INDEX "Grant_isOngoing_idx";

-- DropIndex
DROP INDEX "TradeFair_deletedAt_idx";

-- AlterTable
ALTER TABLE "TradeFair" ADD COLUMN     "eventType" "EventType" NOT NULL DEFAULT 'FAIR',
ADD COLUMN     "organizer" TEXT,
ADD COLUMN     "registrationUrl" TEXT;
