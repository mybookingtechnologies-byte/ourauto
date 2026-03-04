-- CreateTable
CREATE TABLE "ReferralActivity" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "referredUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReferralActivity_dealerId_referredUserId_key" ON "ReferralActivity"("dealerId", "referredUserId");

-- CreateIndex
CREATE INDEX "ReferralActivity_dealerId_createdAt_idx" ON "ReferralActivity"("dealerId", "createdAt");

-- CreateIndex
CREATE INDEX "Listing_isLive_boostType_createdAt_idx" ON "Listing"("isLive", "boostType", "createdAt");

-- AddForeignKey
ALTER TABLE "ReferralActivity" ADD CONSTRAINT "ReferralActivity_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralActivity" ADD CONSTRAINT "ReferralActivity_referredUserId_fkey" FOREIGN KEY ("referredUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
