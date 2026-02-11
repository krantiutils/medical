import { PrismaClient } from "@prisma/client";

// Explicit re-exports for Next.js 16 Turbopack compatibility
// (export * from CJS modules fails at runtime)
export { Prisma, PrismaClient } from "@prisma/client";

// Enums used across the app
export {
  ProfessionalType,
  UserRole,
  VerificationStatus,
  ClinicType,
  ClinicStaffRole,
  AppointmentStatus,
  AppointmentType,
  AppointmentSource,
  PaymentMode,
  PaymentStatus,
  DrugSchedule,
  ProductCategory,
  CreditTransactionType,
  ClinicalNoteStatus,
  PrescriptionStatus,
  LabOrderStatus,
  LabOrderPriority,
  LabResultFlag,
  WardType,
  BedStatus,
  AdmissionStatus,
  VideoConsultationStatus,
  VideoConsultationType,
  OtpPurpose,
  MedicalRecordType,
  FamilyRelation,
} from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
