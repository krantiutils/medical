-- CreateEnum
CREATE TYPE "ProfessionalType" AS ENUM ('DOCTOR', 'DENTIST', 'PHARMACIST');

-- CreateTable
CREATE TABLE "Professional" (
    "id" TEXT NOT NULL,
    "type" "ProfessionalType" NOT NULL,
    "registration_number" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "full_name_ne" TEXT,
    "photo_url" TEXT,
    "gender" TEXT,
    "address" TEXT,
    "degree" TEXT,
    "specialties" TEXT[],
    "registration_date" TIMESTAMP(3),
    "remarks" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_synced_at" TIMESTAMP(3),
    "meta" JSONB,

    CONSTRAINT "Professional_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Professional_registration_number_key" ON "Professional"("registration_number");

-- CreateIndex
CREATE INDEX "Professional_slug_idx" ON "Professional"("slug");

-- CreateIndex
CREATE INDEX "Professional_type_idx" ON "Professional"("type");
