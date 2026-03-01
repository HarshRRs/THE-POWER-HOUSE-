-- Add missing User fields
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "whatsappNumber" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "notifyWhatsapp" BOOLEAN NOT NULL DEFAULT false;
