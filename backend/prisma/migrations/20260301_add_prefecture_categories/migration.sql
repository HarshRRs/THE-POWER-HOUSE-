-- CreateEnum
CREATE TYPE "CategoryStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ERROR', 'CAPTCHA');

-- CreateTable
CREATE TABLE "PrefectureCategory" (
    "id" TEXT NOT NULL,
    "prefectureId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "procedure" "Procedure" NOT NULL,
    "categoryUrl" TEXT NOT NULL,
    "lastScrapedAt" TIMESTAMP(3),
    "lastSlotFoundAt" TIMESTAMP(3),
    "status" "CategoryStatus" NOT NULL DEFAULT 'ACTIVE',
    "consecutiveErrors" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrefectureCategory_pkey" PRIMARY KEY ("id")
);

-- Add categoryCode and categoryId columns to Detection table
ALTER TABLE "Detection" ADD COLUMN "categoryCode" TEXT;
ALTER TABLE "Detection" ADD COLUMN "categoryId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "PrefectureCategory_prefectureId_code_key" ON "PrefectureCategory"("prefectureId", "code");

-- CreateIndex
CREATE INDEX "PrefectureCategory_prefectureId_status_idx" ON "PrefectureCategory"("prefectureId", "status");

-- CreateIndex
CREATE INDEX "PrefectureCategory_status_idx" ON "PrefectureCategory"("status");

-- CreateIndex for Detection category tracking
CREATE INDEX "Detection_prefectureId_categoryCode_detectedAt_idx" ON "Detection"("prefectureId", "categoryCode", "detectedAt");

-- AddForeignKey
ALTER TABLE "PrefectureCategory" ADD CONSTRAINT "PrefectureCategory_prefectureId_fkey" FOREIGN KEY ("prefectureId") REFERENCES "Prefecture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Detection" ADD CONSTRAINT "Detection_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "PrefectureCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
