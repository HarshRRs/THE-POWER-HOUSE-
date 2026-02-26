-- Add VFS support to RDVPriority
-- Migration: 20260225_add_vfs_support

-- 1. Add new Procedure enum values for VFS visas
-- Italy
ALTER TYPE "Procedure" ADD VALUE IF NOT EXISTS 'SCHENGEN_TOURIST_ITALY';
ALTER TYPE "Procedure" ADD VALUE IF NOT EXISTS 'SCHENGEN_BUSINESS_ITALY';
ALTER TYPE "Procedure" ADD VALUE IF NOT EXISTS 'STUDENT_VISA_ITALY';
ALTER TYPE "Procedure" ADD VALUE IF NOT EXISTS 'WORK_VISA_ITALY';
-- Germany
ALTER TYPE "Procedure" ADD VALUE IF NOT EXISTS 'SCHENGEN_TOURIST_GERMANY';
ALTER TYPE "Procedure" ADD VALUE IF NOT EXISTS 'SCHENGEN_BUSINESS_GERMANY';
ALTER TYPE "Procedure" ADD VALUE IF NOT EXISTS 'STUDENT_VISA_GERMANY';
ALTER TYPE "Procedure" ADD VALUE IF NOT EXISTS 'WORK_VISA_GERMANY';
-- France
ALTER TYPE "Procedure" ADD VALUE IF NOT EXISTS 'SCHENGEN_TOURIST_FRANCE';
ALTER TYPE "Procedure" ADD VALUE IF NOT EXISTS 'SCHENGEN_BUSINESS_FRANCE';
ALTER TYPE "Procedure" ADD VALUE IF NOT EXISTS 'STUDENT_VISA_FRANCE';
ALTER TYPE "Procedure" ADD VALUE IF NOT EXISTS 'WORK_VISA_FRANCE';
-- Switzerland
ALTER TYPE "Procedure" ADD VALUE IF NOT EXISTS 'SCHENGEN_TOURIST_SWITZERLAND';
ALTER TYPE "Procedure" ADD VALUE IF NOT EXISTS 'SCHENGEN_BUSINESS_SWITZERLAND';
ALTER TYPE "Procedure" ADD VALUE IF NOT EXISTS 'STUDENT_VISA_SWITZERLAND';
ALTER TYPE "Procedure" ADD VALUE IF NOT EXISTS 'WORK_VISA_SWITZERLAND';
-- Austria
ALTER TYPE "Procedure" ADD VALUE IF NOT EXISTS 'SCHENGEN_TOURIST_AUSTRIA';
ALTER TYPE "Procedure" ADD VALUE IF NOT EXISTS 'SCHENGEN_BUSINESS_AUSTRIA';
ALTER TYPE "Procedure" ADD VALUE IF NOT EXISTS 'STUDENT_VISA_AUSTRIA';
ALTER TYPE "Procedure" ADD VALUE IF NOT EXISTS 'WORK_VISA_AUSTRIA';
-- Belgium
ALTER TYPE "Procedure" ADD VALUE IF NOT EXISTS 'SCHENGEN_TOURIST_BELGIUM';
ALTER TYPE "Procedure" ADD VALUE IF NOT EXISTS 'SCHENGEN_BUSINESS_BELGIUM';
ALTER TYPE "Procedure" ADD VALUE IF NOT EXISTS 'STUDENT_VISA_BELGIUM';
ALTER TYPE "Procedure" ADD VALUE IF NOT EXISTS 'WORK_VISA_BELGIUM';
-- Netherlands
ALTER TYPE "Procedure" ADD VALUE IF NOT EXISTS 'SCHENGEN_TOURIST_NETHERLANDS';
ALTER TYPE "Procedure" ADD VALUE IF NOT EXISTS 'SCHENGEN_BUSINESS_NETHERLANDS';
ALTER TYPE "Procedure" ADD VALUE IF NOT EXISTS 'STUDENT_VISA_NETHERLANDS';
ALTER TYPE "Procedure" ADD VALUE IF NOT EXISTS 'WORK_VISA_NETHERLANDS';
-- Portugal
ALTER TYPE "Procedure" ADD VALUE IF NOT EXISTS 'SCHENGEN_TOURIST_PORTUGAL';
ALTER TYPE "Procedure" ADD VALUE IF NOT EXISTS 'SCHENGEN_BUSINESS_PORTUGAL';
ALTER TYPE "Procedure" ADD VALUE IF NOT EXISTS 'STUDENT_VISA_PORTUGAL';
ALTER TYPE "Procedure" ADD VALUE IF NOT EXISTS 'WORK_VISA_PORTUGAL';
ALTER TYPE "Procedure" ADD VALUE IF NOT EXISTS 'JOB_SEEKER_VISA_PORTUGAL';

-- Additional National Visa (D) categories
ALTER TYPE "Procedure" ADD VALUE IF NOT EXISTS 'OPPORTUNITY_CARD_GERMANY';
ALTER TYPE "Procedure" ADD VALUE IF NOT EXISTS 'SEASONAL_WORK_VISA_ITALY';

-- 2. Add VFS_CENTER to TargetType enum
ALTER TYPE "TargetType" ADD VALUE IF NOT EXISTS 'VFS_CENTER';

-- 3. Create VfsCenterStatus enum
DO $$ BEGIN
    CREATE TYPE "VfsCenterStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ERROR', 'CAPTCHA_BLOCKED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. Create VfsCenter table
CREATE TABLE IF NOT EXISTS "VfsCenter" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "destinationCountry" TEXT NOT NULL,
    "sourceCountry" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "centerCode" TEXT NOT NULL,
    "bookingUrl" TEXT NOT NULL,
    "checkInterval" INTEGER NOT NULL DEFAULT 300,
    "status" "VfsCenterStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastScrapedAt" TIMESTAMP(3),
    "lastSlotFoundAt" TIMESTAMP(3),
    "consecutiveErrors" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VfsCenter_pkey" PRIMARY KEY ("id")
);

-- 5. Add indexes for VfsCenter
CREATE INDEX IF NOT EXISTS "VfsCenter_configId_status_idx" ON "VfsCenter"("configId", "status");
CREATE INDEX IF NOT EXISTS "VfsCenter_destinationCountry_status_idx" ON "VfsCenter"("destinationCountry", "status");
CREATE INDEX IF NOT EXISTS "VfsCenter_status_idx" ON "VfsCenter"("status");

-- 6. Add vfsCenterId column to Alert table
ALTER TABLE "Alert" ADD COLUMN IF NOT EXISTS "vfsCenterId" TEXT;

-- 7. Add foreign key constraint for Alert.vfsCenterId
DO $$ BEGIN
    ALTER TABLE "Alert" ADD CONSTRAINT "Alert_vfsCenterId_fkey" 
        FOREIGN KEY ("vfsCenterId") REFERENCES "VfsCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 8. Add unique constraint for Alert (userId, vfsCenterId, procedure)
DO $$ BEGIN
    ALTER TABLE "Alert" ADD CONSTRAINT "Alert_userId_vfsCenterId_procedure_key" 
        UNIQUE ("userId", "vfsCenterId", "procedure");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 9. Add index for Alert.vfsCenterId
CREATE INDEX IF NOT EXISTS "Alert_vfsCenterId_isActive_idx" ON "Alert"("vfsCenterId", "isActive");

-- 10. Add vfsCenterId column to Detection table
ALTER TABLE "Detection" ADD COLUMN IF NOT EXISTS "vfsCenterId" TEXT;

-- 11. Add foreign key constraint for Detection.vfsCenterId
DO $$ BEGIN
    ALTER TABLE "Detection" ADD CONSTRAINT "Detection_vfsCenterId_fkey" 
        FOREIGN KEY ("vfsCenterId") REFERENCES "VfsCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 12. Add index for Detection.vfsCenterId
CREATE INDEX IF NOT EXISTS "Detection_vfsCenterId_detectedAt_idx" ON "Detection"("vfsCenterId", "detectedAt");

-- 13. Create updatedAt trigger for VfsCenter
CREATE OR REPLACE FUNCTION update_vfscenter_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS vfscenter_updated_at ON "VfsCenter";
CREATE TRIGGER vfscenter_updated_at
    BEFORE UPDATE ON "VfsCenter"
    FOR EACH ROW
    EXECUTE FUNCTION update_vfscenter_updated_at();
