-- Add session version for secure token invalidation
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "sessionVersion" INTEGER NOT NULL DEFAULT 0;

-- Convert role to enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
    CREATE TYPE "UserRole" AS ENUM ('DEALER', 'ADMIN');
  END IF;
END $$;

ALTER TABLE "User"
ALTER COLUMN "role" TYPE "UserRole"
USING CASE
  WHEN UPPER("role") = 'ADMIN' THEN 'ADMIN'::"UserRole"
  ELSE 'DEALER'::"UserRole"
END;

ALTER TABLE "User"
ALTER COLUMN "role" SET DEFAULT 'DEALER';

-- Add password reset indexes
CREATE INDEX IF NOT EXISTS "User_resetToken_idx" ON "User"("resetToken");
CREATE INDEX IF NOT EXISTS "User_resetTokenExpiry_idx" ON "User"("resetTokenExpiry");

-- Convert insuranceTill to timestamp (best effort)
ALTER TABLE "Listing"
ALTER COLUMN "insuranceTill" TYPE TIMESTAMP(3)
USING CASE
  WHEN "insuranceTill" IS NULL OR trim("insuranceTill") = '' THEN NULL
  WHEN "insuranceTill" ~ '^\\d{4}-\\d{2}-\\d{2}$' THEN to_timestamp("insuranceTill", 'YYYY-MM-DD')
  ELSE NULL
END;

-- Add listing indexes for scale
CREATE INDEX IF NOT EXISTS "Listing_createdAt_idx" ON "Listing"("createdAt");
CREATE INDEX IF NOT EXISTS "Listing_price_idx" ON "Listing"("price");
CREATE INDEX IF NOT EXISTS "Listing_city_idx" ON "Listing"("city");
