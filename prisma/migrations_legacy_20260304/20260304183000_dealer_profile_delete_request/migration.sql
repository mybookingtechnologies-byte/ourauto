-- AlterTable
ALTER TABLE "User"
ADD COLUMN "city" TEXT,
ADD COLUMN "businessAddress" TEXT,
ADD COLUMN "aboutDealer" TEXT;

-- CreateEnum
CREATE TYPE "DeleteRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "DeleteRequest" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "DeleteRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeleteRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeleteRequest_dealerId_createdAt_idx" ON "DeleteRequest"("dealerId", "createdAt");

-- CreateIndex
CREATE INDEX "DeleteRequest_status_idx" ON "DeleteRequest"("status");

-- AddForeignKey
ALTER TABLE "DeleteRequest" ADD CONSTRAINT "DeleteRequest_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
