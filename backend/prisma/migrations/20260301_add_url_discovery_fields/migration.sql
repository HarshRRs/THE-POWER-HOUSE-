-- Add URL Discovery fields to Prefecture table
ALTER TABLE "Prefecture" ADD COLUMN IF NOT EXISTS "originalBookingUrl" TEXT;
ALTER TABLE "Prefecture" ADD COLUMN IF NOT EXISTS "urlLastValidatedAt" TIMESTAMP(3);
ALTER TABLE "Prefecture" ADD COLUMN IF NOT EXISTS "urlConsecutiveFailures" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Prefecture" ADD COLUMN IF NOT EXISTS "urlDiscoveryEnabled" BOOLEAN NOT NULL DEFAULT true;

-- Create UrlHistory table if not exists
CREATE TABLE IF NOT EXISTS "UrlHistory" (
    "id" TEXT NOT NULL,
    "prefectureId" TEXT NOT NULL,
    "oldUrl" TEXT NOT NULL,
    "newUrl" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UrlHistory_pkey" PRIMARY KEY ("id")
);

-- Add foreign key if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UrlHistory_prefectureId_fkey') THEN
        ALTER TABLE "UrlHistory" ADD CONSTRAINT "UrlHistory_prefectureId_fkey" 
        FOREIGN KEY ("prefectureId") REFERENCES "Prefecture"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Create index if not exists
CREATE INDEX IF NOT EXISTS "UrlHistory_prefectureId_discoveredAt_idx" ON "UrlHistory"("prefectureId", "discoveredAt");
