-- CreateEnum: ConsulateStatus
CREATE TYPE "ConsulateStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ERROR');

-- CreateEnum: TargetType
CREATE TYPE "TargetType" AS ENUM ('PREFECTURE', 'CONSULATE');

-- AlterEnum: Add new Procedure values
ALTER TYPE "Procedure" ADD VALUE 'PASSPORT_RENEWAL';
ALTER TYPE "Procedure" ADD VALUE 'PASSPORT_REISSUE';
ALTER TYPE "Procedure" ADD VALUE 'PASSPORT_NEW';
ALTER TYPE "Procedure" ADD VALUE 'PASSPORT_TATKAL';
ALTER TYPE "Procedure" ADD VALUE 'OCI_REGISTRATION';
ALTER TYPE "Procedure" ADD VALUE 'OCI_RENEWAL';
ALTER TYPE "Procedure" ADD VALUE 'OCI_MISC';
ALTER TYPE "Procedure" ADD VALUE 'VISA_CONSULAR';
ALTER TYPE "Procedure" ADD VALUE 'BIRTH_REGISTRATION';
ALTER TYPE "Procedure" ADD VALUE 'CONSULAR_OTHER';

-- CreateTable: Consulate
CREATE TABLE "Consulate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "checkInterval" INTEGER NOT NULL DEFAULT 120,
    "status" "ConsulateStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastScrapedAt" TIMESTAMP(3),
    "consecutiveErrors" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consulate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Consulate status
CREATE INDEX "Consulate_status_idx" ON "Consulate"("status");

-- AlterTable: Alert - add targetType and consulateId
ALTER TABLE "Alert" ADD COLUMN "targetType" "TargetType" NOT NULL DEFAULT 'PREFECTURE';
ALTER TABLE "Alert" ADD COLUMN "consulateId" TEXT;
ALTER TABLE "Alert" ALTER COLUMN "prefectureId" DROP NOT NULL;

-- AlterTable: Detection - add consulateId, make prefectureId optional
ALTER TABLE "Detection" ADD COLUMN "consulateId" TEXT;
ALTER TABLE "Detection" ALTER COLUMN "prefectureId" DROP NOT NULL;

-- CreateIndex: Alert consulateId + isActive
CREATE INDEX "Alert_consulateId_isActive_idx" ON "Alert"("consulateId", "isActive");

-- CreateIndex: Alert unique userId + consulateId + procedure
CREATE UNIQUE INDEX "Alert_userId_consulateId_procedure_key" ON "Alert"("userId", "consulateId", "procedure");

-- CreateIndex: Detection consulateId + detectedAt
CREATE INDEX "Detection_consulateId_detectedAt_idx" ON "Detection"("consulateId", "detectedAt");

-- AddForeignKey: Alert -> Consulate
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_consulateId_fkey" FOREIGN KEY ("consulateId") REFERENCES "Consulate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: Detection -> Consulate
ALTER TABLE "Detection" ADD CONSTRAINT "Detection_consulateId_fkey" FOREIGN KEY ("consulateId") REFERENCES "Consulate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
