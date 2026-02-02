-- CreateEnum
CREATE TYPE "ClinicalNoteStatus" AS ENUM ('DRAFT', 'FINAL', 'AMENDED');

-- CreateEnum
CREATE TYPE "PrescriptionStatus" AS ENUM ('DRAFT', 'ISSUED', 'DISPENSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LabOrderStatus" AS ENUM ('ORDERED', 'SAMPLE_COLLECTED', 'PROCESSING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LabOrderPriority" AS ENUM ('ROUTINE', 'URGENT', 'STAT');

-- CreateEnum
CREATE TYPE "LabResultFlag" AS ENUM ('NORMAL', 'LOW', 'HIGH', 'CRITICAL_LOW', 'CRITICAL_HIGH', 'ABNORMAL');

-- CreateEnum
CREATE TYPE "WardType" AS ENUM ('GENERAL', 'SEMI_PRIVATE', 'PRIVATE', 'ICU', 'NICU', 'PICU', 'CCU', 'EMERGENCY', 'MATERNITY', 'PEDIATRIC', 'PSYCHIATRIC');

-- CreateEnum
CREATE TYPE "BedStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE', 'OUT_OF_SERVICE');

-- CreateEnum
CREATE TYPE "AdmissionStatus" AS ENUM ('ADMITTED', 'DISCHARGED', 'TRANSFERRED', 'DECEASED', 'LEFT_AMA');

-- CreateTable
CREATE TABLE "ClinicalNote" (
    "id" TEXT NOT NULL,
    "height_cm" DECIMAL(5,2),
    "weight_kg" DECIMAL(5,2),
    "bmi" DECIMAL(4,2),
    "blood_pressure" TEXT,
    "pulse_rate" INTEGER,
    "temperature" DECIMAL(4,1),
    "spo2" INTEGER,
    "respiratory_rate" INTEGER,
    "chief_complaint" TEXT,
    "history_of_illness" TEXT,
    "past_history" TEXT,
    "examination" TEXT,
    "diagnoses" JSONB,
    "plan" TEXT,
    "follow_up" TIMESTAMP(3),
    "status" "ClinicalNoteStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "appointment_id" TEXT,

    CONSTRAINT "ClinicalNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prescription" (
    "id" TEXT NOT NULL,
    "prescription_no" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "instructions" TEXT,
    "status" "PrescriptionStatus" NOT NULL DEFAULT 'DRAFT',
    "issued_at" TIMESTAMP(3),
    "valid_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "clinical_note_id" TEXT,
    "appointment_id" TEXT,

    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabTest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "short_name" TEXT,
    "code" TEXT,
    "category" TEXT,
    "description" TEXT,
    "sample_type" TEXT,
    "instructions" TEXT,
    "normal_range" TEXT,
    "unit" TEXT,
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "turnaround_hrs" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "clinic_id" TEXT NOT NULL,

    CONSTRAINT "LabTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabOrder" (
    "id" TEXT NOT NULL,
    "order_number" TEXT NOT NULL,
    "priority" "LabOrderPriority" NOT NULL DEFAULT 'ROUTINE',
    "status" "LabOrderStatus" NOT NULL DEFAULT 'ORDERED',
    "clinical_notes" TEXT,
    "sample_collected" TIMESTAMP(3),
    "sample_id" TEXT,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "ordered_by_id" TEXT NOT NULL,
    "clinical_note_id" TEXT,
    "appointment_id" TEXT,

    CONSTRAINT "LabOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabResult" (
    "id" TEXT NOT NULL,
    "result_value" TEXT,
    "unit" TEXT,
    "normal_range" TEXT,
    "flag" "LabResultFlag",
    "remarks" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_by" TEXT,
    "verified_at" TIMESTAMP(3),
    "entered_at" TIMESTAMP(3),
    "entered_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "lab_order_id" TEXT NOT NULL,
    "lab_test_id" TEXT NOT NULL,

    CONSTRAINT "LabResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ward" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "WardType" NOT NULL,
    "floor" TEXT,
    "building" TEXT,
    "capacity" INTEGER NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "clinic_id" TEXT NOT NULL,

    CONSTRAINT "Ward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bed" (
    "id" TEXT NOT NULL,
    "bed_number" TEXT NOT NULL,
    "status" "BedStatus" NOT NULL DEFAULT 'AVAILABLE',
    "type" "WardType",
    "daily_rate" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "features" TEXT[],
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "ward_id" TEXT NOT NULL,

    CONSTRAINT "Bed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admission" (
    "id" TEXT NOT NULL,
    "admission_number" TEXT NOT NULL,
    "status" "AdmissionStatus" NOT NULL DEFAULT 'ADMITTED',
    "admission_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "admission_diagnosis" TEXT,
    "chief_complaint" TEXT,
    "discharge_date" TIMESTAMP(3),
    "discharge_diagnosis" TEXT,
    "discharge_summary" TEXT,
    "discharge_type" TEXT,
    "discharge_advice" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "bed_id" TEXT NOT NULL,
    "admitting_doctor_id" TEXT NOT NULL,
    "attending_doctor_id" TEXT,

    CONSTRAINT "Admission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClinicalNote_appointment_id_key" ON "ClinicalNote"("appointment_id");

-- CreateIndex
CREATE INDEX "ClinicalNote_clinic_id_patient_id_idx" ON "ClinicalNote"("clinic_id", "patient_id");

-- CreateIndex
CREATE INDEX "ClinicalNote_clinic_id_doctor_id_idx" ON "ClinicalNote"("clinic_id", "doctor_id");

-- CreateIndex
CREATE INDEX "ClinicalNote_clinic_id_idx" ON "ClinicalNote"("clinic_id");

-- CreateIndex
CREATE INDEX "ClinicalNote_patient_id_idx" ON "ClinicalNote"("patient_id");

-- CreateIndex
CREATE INDEX "ClinicalNote_doctor_id_idx" ON "ClinicalNote"("doctor_id");

-- CreateIndex
CREATE INDEX "ClinicalNote_created_at_idx" ON "ClinicalNote"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "Prescription_appointment_id_key" ON "Prescription"("appointment_id");

-- CreateIndex
CREATE INDEX "Prescription_clinic_id_patient_id_idx" ON "Prescription"("clinic_id", "patient_id");

-- CreateIndex
CREATE INDEX "Prescription_clinic_id_doctor_id_idx" ON "Prescription"("clinic_id", "doctor_id");

-- CreateIndex
CREATE INDEX "Prescription_clinic_id_idx" ON "Prescription"("clinic_id");

-- CreateIndex
CREATE INDEX "Prescription_patient_id_idx" ON "Prescription"("patient_id");

-- CreateIndex
CREATE INDEX "Prescription_doctor_id_idx" ON "Prescription"("doctor_id");

-- CreateIndex
CREATE INDEX "Prescription_status_idx" ON "Prescription"("status");

-- CreateIndex
CREATE INDEX "Prescription_created_at_idx" ON "Prescription"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "Prescription_clinic_id_prescription_no_key" ON "Prescription"("clinic_id", "prescription_no");

-- CreateIndex
CREATE INDEX "LabTest_clinic_id_is_active_idx" ON "LabTest"("clinic_id", "is_active");

-- CreateIndex
CREATE INDEX "LabTest_clinic_id_category_idx" ON "LabTest"("clinic_id", "category");

-- CreateIndex
CREATE INDEX "LabTest_clinic_id_idx" ON "LabTest"("clinic_id");

-- CreateIndex
CREATE UNIQUE INDEX "LabTest_clinic_id_code_key" ON "LabTest"("clinic_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "LabOrder_appointment_id_key" ON "LabOrder"("appointment_id");

-- CreateIndex
CREATE INDEX "LabOrder_clinic_id_patient_id_idx" ON "LabOrder"("clinic_id", "patient_id");

-- CreateIndex
CREATE INDEX "LabOrder_clinic_id_status_idx" ON "LabOrder"("clinic_id", "status");

-- CreateIndex
CREATE INDEX "LabOrder_clinic_id_idx" ON "LabOrder"("clinic_id");

-- CreateIndex
CREATE INDEX "LabOrder_patient_id_idx" ON "LabOrder"("patient_id");

-- CreateIndex
CREATE INDEX "LabOrder_ordered_by_id_idx" ON "LabOrder"("ordered_by_id");

-- CreateIndex
CREATE INDEX "LabOrder_status_idx" ON "LabOrder"("status");

-- CreateIndex
CREATE INDEX "LabOrder_created_at_idx" ON "LabOrder"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "LabOrder_clinic_id_order_number_key" ON "LabOrder"("clinic_id", "order_number");

-- CreateIndex
CREATE INDEX "LabResult_lab_order_id_idx" ON "LabResult"("lab_order_id");

-- CreateIndex
CREATE INDEX "LabResult_lab_test_id_idx" ON "LabResult"("lab_test_id");

-- CreateIndex
CREATE INDEX "LabResult_flag_idx" ON "LabResult"("flag");

-- CreateIndex
CREATE UNIQUE INDEX "LabResult_lab_order_id_lab_test_id_key" ON "LabResult"("lab_order_id", "lab_test_id");

-- CreateIndex
CREATE INDEX "Ward_clinic_id_type_idx" ON "Ward"("clinic_id", "type");

-- CreateIndex
CREATE INDEX "Ward_clinic_id_is_active_idx" ON "Ward"("clinic_id", "is_active");

-- CreateIndex
CREATE INDEX "Ward_clinic_id_idx" ON "Ward"("clinic_id");

-- CreateIndex
CREATE UNIQUE INDEX "Ward_clinic_id_name_key" ON "Ward"("clinic_id", "name");

-- CreateIndex
CREATE INDEX "Bed_ward_id_status_idx" ON "Bed"("ward_id", "status");

-- CreateIndex
CREATE INDEX "Bed_ward_id_idx" ON "Bed"("ward_id");

-- CreateIndex
CREATE INDEX "Bed_status_idx" ON "Bed"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Bed_ward_id_bed_number_key" ON "Bed"("ward_id", "bed_number");

-- CreateIndex
CREATE INDEX "Admission_clinic_id_patient_id_idx" ON "Admission"("clinic_id", "patient_id");

-- CreateIndex
CREATE INDEX "Admission_clinic_id_status_idx" ON "Admission"("clinic_id", "status");

-- CreateIndex
CREATE INDEX "Admission_clinic_id_idx" ON "Admission"("clinic_id");

-- CreateIndex
CREATE INDEX "Admission_patient_id_idx" ON "Admission"("patient_id");

-- CreateIndex
CREATE INDEX "Admission_bed_id_idx" ON "Admission"("bed_id");

-- CreateIndex
CREATE INDEX "Admission_admitting_doctor_id_idx" ON "Admission"("admitting_doctor_id");

-- CreateIndex
CREATE INDEX "Admission_attending_doctor_id_idx" ON "Admission"("attending_doctor_id");

-- CreateIndex
CREATE INDEX "Admission_admission_date_idx" ON "Admission"("admission_date");

-- CreateIndex
CREATE INDEX "Admission_status_idx" ON "Admission"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Admission_clinic_id_admission_number_key" ON "Admission"("clinic_id", "admission_number");

-- AddForeignKey
ALTER TABLE "ClinicalNote" ADD CONSTRAINT "ClinicalNote_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalNote" ADD CONSTRAINT "ClinicalNote_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalNote" ADD CONSTRAINT "ClinicalNote_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalNote" ADD CONSTRAINT "ClinicalNote_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_clinical_note_id_fkey" FOREIGN KEY ("clinical_note_id") REFERENCES "ClinicalNote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabTest" ADD CONSTRAINT "LabTest_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabOrder" ADD CONSTRAINT "LabOrder_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabOrder" ADD CONSTRAINT "LabOrder_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabOrder" ADD CONSTRAINT "LabOrder_ordered_by_id_fkey" FOREIGN KEY ("ordered_by_id") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabOrder" ADD CONSTRAINT "LabOrder_clinical_note_id_fkey" FOREIGN KEY ("clinical_note_id") REFERENCES "ClinicalNote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabOrder" ADD CONSTRAINT "LabOrder_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabResult" ADD CONSTRAINT "LabResult_lab_order_id_fkey" FOREIGN KEY ("lab_order_id") REFERENCES "LabOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabResult" ADD CONSTRAINT "LabResult_lab_test_id_fkey" FOREIGN KEY ("lab_test_id") REFERENCES "LabTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ward" ADD CONSTRAINT "Ward_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bed" ADD CONSTRAINT "Bed_ward_id_fkey" FOREIGN KEY ("ward_id") REFERENCES "Ward"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Admission" ADD CONSTRAINT "Admission_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Admission" ADD CONSTRAINT "Admission_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Admission" ADD CONSTRAINT "Admission_bed_id_fkey" FOREIGN KEY ("bed_id") REFERENCES "Bed"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Admission" ADD CONSTRAINT "Admission_admitting_doctor_id_fkey" FOREIGN KEY ("admitting_doctor_id") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Admission" ADD CONSTRAINT "Admission_attending_doctor_id_fkey" FOREIGN KEY ("attending_doctor_id") REFERENCES "Professional"("id") ON DELETE SET NULL ON UPDATE CASCADE;
