BEGIN;

ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "resetToken" TEXT,
ADD COLUMN IF NOT EXISTS "resetTokenExpiry" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "User_resetToken_idx" ON "User"("resetToken");
CREATE INDEX IF NOT EXISTS "User_resetTokenExpiry_idx" ON "User"("resetTokenExpiry");

COMMIT;
