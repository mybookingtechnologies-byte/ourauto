-- Migration A: expand (safe, additive)
-- Purpose:
-- 1) Add nullable updatedAt columns
-- 2) Add new read-performance indexes

BEGIN;

-- 1) Add nullable updatedAt columns
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);

ALTER TABLE "Listing"
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);

ALTER TABLE "ReferralActivity"
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);

ALTER TABLE "DeleteRequest"
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);

-- 2) Add new indexes
CREATE INDEX IF NOT EXISTS "User_createdAt_idx"
  ON "User" ("createdAt");

CREATE INDEX IF NOT EXISTS "Listing_dealerId_isLive_createdAt_idx"
  ON "Listing" ("dealerId", "isLive", "createdAt");

CREATE INDEX IF NOT EXISTS "ReferralActivity_referredUserId_createdAt_idx"
  ON "ReferralActivity" ("referredUserId", "createdAt");

CREATE INDEX IF NOT EXISTS "DeleteRequest_status_createdAt_idx"
  ON "DeleteRequest" ("status", "createdAt");

COMMIT;
