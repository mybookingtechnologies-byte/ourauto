BEGIN;

ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'DEALER',
ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "loginCount" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Listing"
ADD COLUMN IF NOT EXISTS "deletedByAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "ActivityLog" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Listing_deletedByAdmin_idx" ON "Listing"("deletedByAdmin");
CREATE INDEX IF NOT EXISTS "Listing_deletedAt_idx" ON "Listing"("deletedAt");
CREATE INDEX IF NOT EXISTS "ActivityLog_userId_createdAt_idx" ON "ActivityLog"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "ActivityLog_action_createdAt_idx" ON "ActivityLog"("action", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ActivityLog_userId_fkey'
  ) THEN
    ALTER TABLE "ActivityLog"
      ADD CONSTRAINT "ActivityLog_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

COMMIT;
