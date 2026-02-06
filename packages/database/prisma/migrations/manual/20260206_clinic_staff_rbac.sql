-- Migration: Add ClinicStaff model for Role-Based Access Control
-- Date: 2026-02-06
-- Description: Adds ClinicStaffRole enum and ClinicStaff table for managing
--              clinic staff permissions. Also creates OWNER records for existing
--              clinic owners (claimed_by_id).

-- Create the ClinicStaffRole enum
CREATE TYPE "ClinicStaffRole" AS ENUM (
  'OWNER',
  'ADMIN',
  'DOCTOR',
  'RECEPTIONIST',
  'BILLING',
  'LAB',
  'PHARMACY',
  'NURSE'
);

-- Create the ClinicStaff table
CREATE TABLE "ClinicStaff" (
  "id" TEXT NOT NULL,
  "role" "ClinicStaffRole" NOT NULL,
  "invited_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "clinic_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,

  CONSTRAINT "ClinicStaff_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on clinic_id + user_id
CREATE UNIQUE INDEX "ClinicStaff_clinic_id_user_id_key" ON "ClinicStaff"("clinic_id", "user_id");

-- Create indexes for efficient lookups
CREATE INDEX "ClinicStaff_clinic_id_idx" ON "ClinicStaff"("clinic_id");
CREATE INDEX "ClinicStaff_user_id_idx" ON "ClinicStaff"("user_id");

-- Add foreign key constraints
ALTER TABLE "ClinicStaff" ADD CONSTRAINT "ClinicStaff_clinic_id_fkey"
  FOREIGN KEY ("clinic_id") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClinicStaff" ADD CONSTRAINT "ClinicStaff_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing clinic owners to ClinicStaff with OWNER role
-- This ensures backwards compatibility for existing clinics
INSERT INTO "ClinicStaff" ("id", "role", "invited_by", "created_at", "updated_at", "clinic_id", "user_id")
SELECT
  -- Generate a cuid-like ID (26 chars, alphanumeric)
  LOWER(
    SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 8) ||
    SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 4) ||
    SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 4) ||
    SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 4) ||
    SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 5)
  ),
  'OWNER'::"ClinicStaffRole",
  NULL,
  NOW(),
  NOW(),
  c.id,
  c.claimed_by_id
FROM "Clinic" c
WHERE c.claimed_by_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "ClinicStaff" cs
    WHERE cs.clinic_id = c.id AND cs.user_id = c.claimed_by_id
  );
