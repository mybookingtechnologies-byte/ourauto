-- Migration B: backfill and contract
-- Purpose:
-- 1) Backfill updatedAt for existing rows
-- 2) Enforce NOT NULL on updatedAt

BEGIN;

-- 1) Backfill existing NULLs
UPDATE "User"
SET "updatedAt" = COALESCE("updatedAt", "createdAt", CURRENT_TIMESTAMP)
WHERE "updatedAt" IS NULL;

UPDATE "Listing"
SET "updatedAt" = COALESCE("updatedAt", "createdAt", CURRENT_TIMESTAMP)
WHERE "updatedAt" IS NULL;

UPDATE "ReferralActivity"
SET "updatedAt" = COALESCE("updatedAt", "createdAt", CURRENT_TIMESTAMP)
WHERE "updatedAt" IS NULL;

UPDATE "DeleteRequest"
SET "updatedAt" = COALESCE("updatedAt", "createdAt", CURRENT_TIMESTAMP)
WHERE "updatedAt" IS NULL;

-- Optional safety default for legacy inserts (non-breaking)
ALTER TABLE "User"
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Listing"
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "ReferralActivity"
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "DeleteRequest"
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- 2) Enforce NOT NULL
ALTER TABLE "User"
  ALTER COLUMN "updatedAt" SET NOT NULL;

ALTER TABLE "Listing"
  ALTER COLUMN "updatedAt" SET NOT NULL;

ALTER TABLE "ReferralActivity"
  ALTER COLUMN "updatedAt" SET NOT NULL;

ALTER TABLE "DeleteRequest"
  ALTER COLUMN "updatedAt" SET NOT NULL;

COMMIT;
