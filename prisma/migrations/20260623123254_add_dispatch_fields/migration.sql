-- AlterTable
ALTER TABLE "Grant" ADD COLUMN     "dispatchStatus" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "dispatchedAt" TIMESTAMP(3),
ADD COLUMN     "dispatchedById" TEXT;

-- AlterTable
ALTER TABLE "TradeFair" ADD COLUMN     "dispatchStatus" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "dispatchedAt" TIMESTAMP(3),
ADD COLUMN     "dispatchedById" TEXT;
