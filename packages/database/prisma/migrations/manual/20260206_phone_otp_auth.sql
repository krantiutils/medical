-- Phone OTP Authentication Migration
-- Adds phone verification, OTP storage, and makes email optional

-- 1. Make email optional (allow NULL) and add unique index on phone
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;

-- Add phoneVerified column
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phoneVerified" TIMESTAMP(3);

-- Add unique index on phone (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS "User_phone_key" ON "User"("phone") WHERE "phone" IS NOT NULL;

-- 2. Create OtpPurpose enum
DO $$ BEGIN
  CREATE TYPE "OtpPurpose" AS ENUM ('REGISTER', 'LOGIN', 'FORGOT_PASSWORD', 'VERIFY_PHONE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Create Otp table
CREATE TABLE IF NOT EXISTS "Otp" (
  "id" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "purpose" "OtpPurpose" NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "verified" BOOLEAN NOT NULL DEFAULT false,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Otp_pkey" PRIMARY KEY ("id")
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS "Otp_phone_purpose_idx" ON "Otp"("phone", "purpose");
