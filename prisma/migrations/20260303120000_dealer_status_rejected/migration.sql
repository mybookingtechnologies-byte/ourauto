DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'UserStatus'
      AND e.enumlabel = 'SUSPENDED'
  ) THEN
    ALTER TYPE "UserStatus" RENAME VALUE 'SUSPENDED' TO 'REJECTED';
  END IF;
END
$$;
