-- AlterTable
ALTER TABLE "User"
ADD COLUMN "hotDealCredits" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "futureAdCredits" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "referralCounter" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "hasUnlockedHotDealReward" BOOLEAN NOT NULL DEFAULT false;

-- CreateEnum
CREATE TYPE "BoostType" AS ENUM ('NORMAL', 'HOT_DEAL', 'FUTURE_AD');

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "city" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "boostType" "BoostType" NOT NULL DEFAULT 'NORMAL',
    "isLive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Listing_dealerId_idx" ON "Listing"("dealerId");

-- CreateIndex
CREATE INDEX "Listing_boostType_createdAt_idx" ON "Listing"("boostType", "createdAt");

-- CreateIndex
CREATE INDEX "Listing_isLive_idx" ON "Listing"("isLive");

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
