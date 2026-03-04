-- CreateEnum
CREATE TYPE "BoostType" AS ENUM ('NORMAL', 'HOT_DEAL', 'FUTURE_AD');

-- CreateEnum
CREATE TYPE "DeleteRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('DEALER', 'ADMIN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dealerName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'DEALER',
    "sessionVersion" INTEGER NOT NULL DEFAULT 0,
    "phone" TEXT NOT NULL,
    "city" TEXT,
    "businessAddress" TEXT,
    "aboutDealer" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "loginCount" INTEGER NOT NULL DEFAULT 0,
    "reputationScore" INTEGER NOT NULL DEFAULT 100,
    "totalListings" INTEGER NOT NULL DEFAULT 0,
    "duplicateListings" INTEGER NOT NULL DEFAULT 0,
    "spamReports" INTEGER NOT NULL DEFAULT 0,
    "spamCount" INTEGER NOT NULL DEFAULT 0,
    "duplicateCount" INTEGER NOT NULL DEFAULT 0,
    "adminDeletes" INTEGER NOT NULL DEFAULT 0,
    "password" TEXT NOT NULL,
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),
    "referralCode" TEXT,
    "hotDealCredits" INTEGER NOT NULL DEFAULT 0,
    "futureAdCredits" INTEGER NOT NULL DEFAULT 0,
    "referralCounter" INTEGER NOT NULL DEFAULT 0,
    "hasUnlockedHotDealReward" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "city" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "plateNumber" TEXT,
    "imageHash" TEXT,
    "fuel" TEXT,
    "km" INTEGER,
    "owner" TEXT,
    "colour" TEXT,
    "transmission" TEXT NOT NULL DEFAULT 'Manual',
    "insuranceType" TEXT,
    "insuranceTill" TIMESTAMP(3),
    "remarks" TEXT,
    "images" TEXT[],
    "boostType" "BoostType" NOT NULL DEFAULT 'NORMAL',
    "isLive" BOOLEAN NOT NULL DEFAULT true,
    "deletedByAdmin" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReputationLog" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "scoreChange" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReputationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralActivity" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "referredUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeleteRequest" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "DeleteRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeleteRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "User_resetToken_idx" ON "User"("resetToken");

-- CreateIndex
CREATE INDEX "User_resetTokenExpiry_idx" ON "User"("resetTokenExpiry");

-- CreateIndex
CREATE INDEX "Listing_dealerId_idx" ON "Listing"("dealerId");

-- CreateIndex
CREATE INDEX "Listing_createdAt_idx" ON "Listing"("createdAt");

-- CreateIndex
CREATE INDEX "Listing_price_idx" ON "Listing"("price");

-- CreateIndex
CREATE INDEX "Listing_city_idx" ON "Listing"("city");

-- CreateIndex
CREATE INDEX "Listing_plateNumber_idx" ON "Listing"("plateNumber");

-- CreateIndex
CREATE INDEX "Listing_imageHash_idx" ON "Listing"("imageHash");

-- CreateIndex
CREATE INDEX "Listing_title_price_city_idx" ON "Listing"("title", "price", "city");

-- CreateIndex
CREATE INDEX "Listing_boostType_createdAt_idx" ON "Listing"("boostType", "createdAt");

-- CreateIndex
CREATE INDEX "Listing_isLive_idx" ON "Listing"("isLive");

-- CreateIndex
CREATE INDEX "Listing_deletedByAdmin_idx" ON "Listing"("deletedByAdmin");

-- CreateIndex
CREATE INDEX "Listing_deletedAt_idx" ON "Listing"("deletedAt");

-- CreateIndex
CREATE INDEX "Listing_isLive_boostType_createdAt_idx" ON "Listing"("isLive", "boostType", "createdAt");

-- CreateIndex
CREATE INDEX "Listing_dealerId_isLive_createdAt_idx" ON "Listing"("dealerId", "isLive", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_createdAt_idx" ON "ActivityLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_action_createdAt_idx" ON "ActivityLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "ReputationLog_dealerId_createdAt_idx" ON "ReputationLog"("dealerId", "createdAt");

-- CreateIndex
CREATE INDEX "ReputationLog_reason_createdAt_idx" ON "ReputationLog"("reason", "createdAt");

-- CreateIndex
CREATE INDEX "ReferralActivity_dealerId_createdAt_idx" ON "ReferralActivity"("dealerId", "createdAt");

-- CreateIndex
CREATE INDEX "ReferralActivity_referredUserId_createdAt_idx" ON "ReferralActivity"("referredUserId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralActivity_dealerId_referredUserId_key" ON "ReferralActivity"("dealerId", "referredUserId");

-- CreateIndex
CREATE INDEX "DeleteRequest_dealerId_createdAt_idx" ON "DeleteRequest"("dealerId", "createdAt");

-- CreateIndex
CREATE INDEX "DeleteRequest_status_idx" ON "DeleteRequest"("status");

-- CreateIndex
CREATE INDEX "DeleteRequest_status_createdAt_idx" ON "DeleteRequest"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReputationLog" ADD CONSTRAINT "ReputationLog_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralActivity" ADD CONSTRAINT "ReferralActivity_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralActivity" ADD CONSTRAINT "ReferralActivity_referredUserId_fkey" FOREIGN KEY ("referredUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeleteRequest" ADD CONSTRAINT "DeleteRequest_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

