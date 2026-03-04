BEGIN;

ALTER TABLE "User"
ALTER COLUMN "reputationScore" SET DEFAULT 100,
ADD COLUMN IF NOT EXISTS "totalListings" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "duplicateListings" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "spamReports" INTEGER NOT NULL DEFAULT 0;

UPDATE "User" u
SET "totalListings" = COALESCE(listing_counts.total, 0)
FROM (
  SELECT "dealerId", COUNT(*)::INTEGER AS total
  FROM "Listing"
  GROUP BY "dealerId"
) listing_counts
WHERE u."id" = listing_counts."dealerId";

UPDATE "User"
SET "duplicateListings" = COALESCE("duplicateCount", 0)
WHERE "duplicateListings" = 0;

UPDATE "User"
SET "spamReports" = COALESCE("spamCount", 0)
WHERE "spamReports" = 0;

COMMIT;
