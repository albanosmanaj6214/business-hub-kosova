-- AlterTable
ALTER TABLE "Grant" ADD COLUMN     "forFemaleOwned" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "TradeFair" ADD COLUMN     "forFemaleOwned" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "femaleOwnership" BOOLEAN;
