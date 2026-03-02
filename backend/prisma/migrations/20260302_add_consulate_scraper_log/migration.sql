-- CreateTable
CREATE TABLE "ConsulateScraperLog" (
    "id" TEXT NOT NULL,
    "consulateId" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "categoryName" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "slotsFound" INTEGER NOT NULL DEFAULT 0,
    "slotDates" TEXT,
    "responseTimeMs" INTEGER NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsulateScraperLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConsulateScraperLog_consulateId_categoryId_createdAt_idx" ON "ConsulateScraperLog"("consulateId", "categoryId", "createdAt");

-- AddForeignKey
ALTER TABLE "ConsulateScraperLog" ADD CONSTRAINT "ConsulateScraperLog_consulateId_fkey" FOREIGN KEY ("consulateId") REFERENCES "Consulate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
