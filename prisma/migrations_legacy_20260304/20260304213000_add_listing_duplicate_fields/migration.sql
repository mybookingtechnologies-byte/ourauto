ALTER TABLE "Listing"
ADD COLUMN "plateNumber" TEXT,
ADD COLUMN "imageHash" TEXT;

CREATE INDEX "Listing_plateNumber_idx" ON "Listing"("plateNumber");
CREATE INDEX "Listing_imageHash_idx" ON "Listing"("imageHash");
CREATE INDEX "Listing_title_price_city_idx" ON "Listing"("title", "price", "city");
