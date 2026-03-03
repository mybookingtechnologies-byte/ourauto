DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PromotionType') THEN
    CREATE TYPE "PromotionType" AS ENUM ('HOT_DEAL', 'FUTURE_AD');
  END IF;
END$$;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "referralCode" TEXT,
  ADD COLUMN IF NOT EXISTS "referredBy" TEXT,
  ADD COLUMN IF NOT EXISTS "futureAdCredits" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "hotDealCredits" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "totalListings" INTEGER NOT NULL DEFAULT 0;

UPDATE "User"
SET "referralCode" = CONCAT('REF', REPLACE("id", '-', ''))
WHERE "referralCode" IS NULL OR LENGTH(TRIM("referralCode")) = 0;

ALTER TABLE "User"
  ALTER COLUMN "referralCode" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "User_referralCode_key" ON "User"("referralCode");

ALTER TABLE "Car"
  ADD COLUMN IF NOT EXISTS "isHotDeal" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "hotDealUntil" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "isFutureAd" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "futureAdUntil" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Car_isHotDeal_hotDealUntil_idx" ON "Car"("isHotDeal", "hotDealUntil");
CREATE INDEX IF NOT EXISTS "Car_isFutureAd_futureAdUntil_idx" ON "Car"("isFutureAd", "futureAdUntil");

CREATE TABLE IF NOT EXISTS "PromotionPackage" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "type" "PromotionType" NOT NULL,
  "credits" INTEGER NOT NULL,
  "price" INTEGER NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "PlatformConfig" (
  "id" TEXT PRIMARY KEY,
  "hotDealMilestone" INTEGER NOT NULL DEFAULT 10,
  "referralReward" INTEGER NOT NULL DEFAULT 5,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "PlatformConfig" ("id", "hotDealMilestone", "referralReward")
VALUES ('main', 10, 5)
ON CONFLICT ("id") DO NOTHING;
