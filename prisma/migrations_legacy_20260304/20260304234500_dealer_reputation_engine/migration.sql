BEGIN;

ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "reputationScore" INTEGER NOT NULL DEFAULT 70,
ADD COLUMN IF NOT EXISTS "spamCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "duplicateCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "adminDeletes" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "ReputationLog" (
  "id" TEXT NOT NULL,
  "dealerId" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "scoreChange" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReputationLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ReputationLog_dealerId_createdAt_idx" ON "ReputationLog"("dealerId", "createdAt");
CREATE INDEX IF NOT EXISTS "ReputationLog_reason_createdAt_idx" ON "ReputationLog"("reason", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ReputationLog_dealerId_fkey'
  ) THEN
    ALTER TABLE "ReputationLog"
      ADD CONSTRAINT "ReputationLog_dealerId_fkey"
      FOREIGN KEY ("dealerId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

COMMIT;
