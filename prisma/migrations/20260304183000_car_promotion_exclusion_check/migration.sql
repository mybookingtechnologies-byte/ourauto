DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'car_hot_future_mutual_exclusion_check'
  ) THEN
    ALTER TABLE "Car"
    ADD CONSTRAINT "car_hot_future_mutual_exclusion_check"
    CHECK (NOT ("isHotDeal" AND "isFutureAd"));
  END IF;
END $$;
