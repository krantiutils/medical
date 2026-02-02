/**
 * E2E Test Data Seeding
 *
 * This module provides functions to seed and cleanup test data for E2E tests.
 * Data is seeded using Prisma directly to ensure consistent test fixtures.
 *
 * IMPORTANT: This must match TEST_DATA constants in test-utils.ts
 */

import {
  PrismaClient,
  ProfessionalType,
  UserRole,
  VerificationStatus,
  ClinicType,
  PaymentMode,
  PaymentStatus,
  Prisma,
  AppointmentStatus,
  AppointmentType,
  AppointmentSource,
  ProductCategory,
} from "@swasthya/database";
import { hash } from "bcryptjs";

// Create a dedicated Prisma client for test seeding
// Use same database as dev server (swasthya) for local E2E tests
// This ensures seeds are in the same DB the dev server reads from
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://swasthya:swasthya@localhost:5432/swasthya",
    },
  },
});

/**
 * Test data constants - MUST match TEST_DATA in test-utils.ts
 */
export const SEED_DATA = {
  // Test users
  USERS: {
    REGULAR: {
      email: "testuser@example.com",
      password: "TestPassword123!",
      name: "Test User",
      role: UserRole.USER,
    },
    PROFESSIONAL: {
      email: "professional@example.com",
      password: "Professional123!",
      name: "Dr. Test Professional",
      role: UserRole.PROFESSIONAL,
    },
    ADMIN: {
      email: "admin@example.com",
      password: "AdminPassword123!",
      name: "Admin User",
      role: UserRole.ADMIN,
    },
    CLINIC_OWNER: {
      email: "clinicowner@example.com",
      password: "ClinicOwner123!",
      name: "Clinic Owner",
      role: UserRole.USER,
    },
  },

  // Test doctors (5 total)
  DOCTORS: [
    {
      registration_number: "12345",
      full_name: "Dr. Ram Sharma",
      full_name_ne: "डा. राम शर्मा",
      slug: "dr-ram-sharma-12345",
      gender: "Male",
      address: "Kathmandu, Nepal",
      degree: "MBBS, MD",
      specialties: ["General Medicine", "Internal Medicine"],
      verified: true,
    },
    {
      registration_number: "12346",
      full_name: "Dr. Sita Thapa",
      full_name_ne: "डा. सीता थापा",
      slug: "dr-sita-thapa-12346",
      gender: "Female",
      address: "Lalitpur, Nepal",
      degree: "MBBS, MS",
      specialties: ["Surgery", "General Surgery"],
      verified: true,
    },
    {
      registration_number: "12347",
      full_name: "Dr. Hari Prasad",
      full_name_ne: "डा. हरि प्रसाद",
      slug: "dr-hari-prasad-12347",
      gender: "Male",
      address: "Bhaktapur, Nepal",
      degree: "MBBS",
      specialties: ["General Practice"],
      verified: false,
    },
    {
      registration_number: "99999",
      full_name: "Dr. Unclaimed Doctor",
      full_name_ne: "डा. अनक्लेम्ड डक्टर",
      slug: "dr-unclaimed-doctor-99999",
      gender: "Male",
      address: "Pokhara, Nepal",
      degree: "MBBS",
      specialties: ["General Practice"],
      verified: false,
      // This doctor is intentionally unclaimed for testing claim flow
    },
    {
      registration_number: "88888",
      full_name: "Dr. Verified Doctor",
      full_name_ne: "डा. भेरिफाइड डक्टर",
      slug: "dr-verified-doctor-88888",
      gender: "Female",
      address: "Chitwan, Nepal",
      degree: "MBBS, MD, DM",
      specialties: ["Cardiology"],
      verified: true,
    },
  ],

  // Test dentists (3 total)
  DENTISTS: [
    {
      registration_number: "D1001",
      full_name: "Dr. Dental One",
      full_name_ne: "डा. डेन्टल वन",
      slug: "dr-dental-one-D1001",
      gender: "Male",
      address: "Kathmandu, Nepal",
      degree: "BDS, MDS",
      specialties: ["Orthodontics"],
      verified: true,
    },
    {
      registration_number: "D1002",
      full_name: "Dr. Dental Two",
      full_name_ne: "डा. डेन्टल टू",
      slug: "dr-dental-two-D1002",
      gender: "Female",
      address: "Lalitpur, Nepal",
      degree: "BDS",
      specialties: ["General Dentistry"],
      verified: false,
    },
    {
      registration_number: "D1003",
      full_name: "Dr. Dental Three",
      full_name_ne: "डा. डेन्टल थ्री",
      slug: "dr-dental-three-D1003",
      gender: "Male",
      address: "Bhaktapur, Nepal",
      degree: "BDS, MDS",
      specialties: ["Periodontics", "Oral Surgery"],
      verified: true,
    },
  ],

  // Test pharmacists (2 total)
  PHARMACISTS: [
    {
      registration_number: "P1001",
      full_name: "Pharmacist One",
      full_name_ne: "फार्मासिस्ट वन",
      slug: "pharmacist-one-P1001",
      gender: "Male",
      address: "Kathmandu, Nepal",
      degree: "B.Pharm",
      specialties: [],
      verified: true,
    },
    {
      registration_number: "P1002",
      full_name: "Pharmacist Two",
      full_name_ne: "फार्मासिस्ट टू",
      slug: "pharmacist-two-P1002",
      gender: "Female",
      address: "Pokhara, Nepal",
      degree: "B.Pharm, M.Pharm",
      specialties: [],
      verified: false,
    },
  ],

  // Test clinics for admin verification tests
  CLINICS: [
    {
      name: "Test Clinic One",
      slug: "test-clinic-one",
      type: ClinicType.CLINIC,
      address: "Kathmandu, Nepal",
      phone: "9801234567",
      email: "testclinic1@example.com",
      website: "https://testclinic1.example.com",
      services: ["General Consultation", "Lab Tests"],
      verified: false, // Pending verification
    },
    {
      name: "Test Hospital",
      slug: "test-hospital",
      type: ClinicType.HOSPITAL,
      address: "Lalitpur, Nepal",
      phone: "9807654321",
      email: "testhospital@example.com",
      website: "https://testhospital.example.com",
      services: ["Emergency", "Surgery", "X-Ray"],
      verified: false, // Pending verification
    },
    {
      name: "Test Pharmacy",
      slug: "test-pharmacy",
      type: ClinicType.PHARMACY,
      address: "Bhaktapur, Nepal",
      phone: "9811111111",
      email: "testpharmacy@example.com",
      website: null,
      services: ["Pharmacy"],
      verified: true, // Already verified
    },
    {
      name: "Dashboard Test Clinic",
      slug: "dashboard-test-clinic",
      type: ClinicType.POLYCLINIC,
      address: "Kathmandu, Nepal",
      phone: "9812345678",
      email: "dashboardclinic@example.com",
      website: "https://dashboardclinic.example.com",
      services: ["general", "specialist", "lab"],
      verified: true, // Verified clinic for dashboard tests
      ownerType: "CLINIC_OWNER", // Special marker for clinic owner
      timings: {
        sunday: { isOpen: false, openTime: "", closeTime: "" },
        monday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
        tuesday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
        wednesday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
        thursday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
        friday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
        saturday: { isOpen: true, openTime: "10:00", closeTime: "14:00" },
      },
    },
  ],

  // Test services for billing tests
  SERVICES: [
    {
      name: "General Consultation",
      description: "Initial consultation with a general physician",
      price: 500,
      category: "Consultation",
      is_active: true,
    },
    {
      name: "Follow-up Visit",
      description: "Follow-up consultation",
      price: 300,
      category: "Consultation",
      is_active: true,
    },
    {
      name: "X-Ray",
      description: "Digital X-ray imaging",
      price: 1200,
      category: "Test",
      is_active: true,
    },
    {
      name: "Blood Test",
      description: "Complete blood count",
      price: 800,
      category: "Test",
      is_active: true,
    },
    {
      name: "ECG",
      description: "Electrocardiogram",
      price: 600,
      category: "Procedure",
      is_active: true,
    },
    {
      name: "Dressing",
      description: "Wound dressing service",
      price: 200,
      category: "Procedure",
      is_active: false, // Inactive service for testing
    },
  ],

  // Test patients for billing tests
  PATIENTS: [
    {
      patient_number: "PAT-2026-0001",
      full_name: "Test Patient One",
      phone: "9841000001",
      email: "patient1@example.com",
      gender: "Male",
      address: "Kathmandu, Nepal",
    },
    {
      patient_number: "PAT-2026-0002",
      full_name: "Test Patient Two",
      phone: "9841000002",
      email: "patient2@example.com",
      gender: "Female",
      address: "Lalitpur, Nepal",
    },
  ],

  // Test pharmacy products for POS tests
  PRODUCTS: [
    {
      name: "Paracetamol 500mg",
      generic_name: "Paracetamol",
      category: ProductCategory.MEDICINE,
      barcode: "PARA500",
      gst_rate: 5,
      unit: "strip",
      pack_size: 10,
      min_stock_level: 50,
    },
    {
      name: "Amoxicillin 250mg",
      generic_name: "Amoxicillin",
      category: ProductCategory.MEDICINE,
      barcode: "AMOX250",
      gst_rate: 5,
      unit: "strip",
      pack_size: 10,
      min_stock_level: 30,
    },
    {
      name: "Vitamin C 1000mg",
      generic_name: "Ascorbic Acid",
      category: ProductCategory.SUPPLEMENT,
      barcode: "VITC1000",
      gst_rate: 12,
      unit: "bottle",
      pack_size: 30,
      min_stock_level: 20,
    },
    {
      name: "Digital Thermometer",
      generic_name: null,
      category: ProductCategory.MEDICAL_DEVICE,
      barcode: "THERM001",
      gst_rate: 18,
      unit: "piece",
      pack_size: 1,
      min_stock_level: 10,
    },
    {
      name: "Expired Medicine Test",
      generic_name: "Test Drug",
      category: ProductCategory.MEDICINE,
      barcode: "EXPIRED001",
      gst_rate: 5,
      unit: "strip",
      pack_size: 10,
      min_stock_level: 10,
    },
  ],

  // Test inventory batches for POS tests (linked to products above)
  // Index maps to PRODUCTS index
  BATCHES: [
    // Paracetamol batches - multiple for FEFO testing
    {
      productIndex: 0,
      batch_number: "PARA-BATCH-001",
      expiry_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now (expires sooner - should be selected first)
      quantity: 100,
      original_qty: 100,
      purchase_price: 20,
      mrp: 35,
      selling_price: 30,
    },
    {
      productIndex: 0,
      batch_number: "PARA-BATCH-002",
      expiry_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 180 days from now (expires later)
      quantity: 200,
      original_qty: 200,
      purchase_price: 22,
      mrp: 38,
      selling_price: 32,
    },
    // Amoxicillin batch
    {
      productIndex: 1,
      batch_number: "AMOX-BATCH-001",
      expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      quantity: 50,
      original_qty: 50,
      purchase_price: 80,
      mrp: 120,
      selling_price: 100,
    },
    // Vitamin C batch
    {
      productIndex: 2,
      batch_number: "VITC-BATCH-001",
      expiry_date: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000), // 2 years from now
      quantity: 30,
      original_qty: 30,
      purchase_price: 150,
      mrp: 250,
      selling_price: 200,
    },
    // Digital Thermometer batch
    {
      productIndex: 3,
      batch_number: "THERM-BATCH-001",
      expiry_date: new Date(Date.now() + 1825 * 24 * 60 * 60 * 1000), // 5 years from now
      quantity: 15,
      original_qty: 15,
      purchase_price: 200,
      mrp: 450,
      selling_price: 350,
    },
    // Expired product batch (for testing expired items don't show)
    {
      productIndex: 4,
      batch_number: "EXP-BATCH-001",
      expiry_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Expired 30 days ago
      quantity: 10,
      original_qty: 10,
      purchase_price: 10,
      mrp: 20,
      selling_price: 15,
    },
  ],

  // Test credit accounts for pharmacy POS
  CREDIT_ACCOUNTS: [
    {
      customer_name: "Ram Bahadur",
      phone: "9801234567",
      address: "Kathmandu, Nepal",
      credit_limit: 10000,
      current_balance: 500, // Has existing balance
    },
    {
      customer_name: "Sita Kumari",
      phone: "9802345678",
      address: "Lalitpur, Nepal",
      credit_limit: 5000,
      current_balance: 0, // Fresh account
    },
  ],
};

/**
 * Exported test data constants for easy access
 */
export const TEST_DOCTOR_SLUG = SEED_DATA.DOCTORS[0].slug;
export const TEST_DENTIST_SLUG = SEED_DATA.DENTISTS[0].slug;
export const TEST_PHARMACIST_SLUG = SEED_DATA.PHARMACISTS[0].slug;
export const TEST_UNCLAIMED_DOCTOR_SLUG = SEED_DATA.DOCTORS[3].slug;
export const TEST_USER_EMAIL = SEED_DATA.USERS.REGULAR.email;
export const TEST_ADMIN_EMAIL = SEED_DATA.USERS.ADMIN.email;
export const TEST_PROFESSIONAL_EMAIL = SEED_DATA.USERS.PROFESSIONAL.email;

// Test clinic constants
export const TEST_CLINIC_NAME = SEED_DATA.CLINICS[0].name;
export const TEST_CLINIC_SLUG = SEED_DATA.CLINICS[0].slug;
export const TEST_HOSPITAL_NAME = SEED_DATA.CLINICS[1].name;
export const TEST_HOSPITAL_SLUG = SEED_DATA.CLINICS[1].slug;

// Clinic owner and dashboard clinic constants
export const TEST_CLINIC_OWNER_EMAIL = SEED_DATA.USERS.CLINIC_OWNER.email;
export const TEST_CLINIC_OWNER_PASSWORD = SEED_DATA.USERS.CLINIC_OWNER.password;
export const TEST_DASHBOARD_CLINIC_NAME = SEED_DATA.CLINICS[3].name;
export const TEST_DASHBOARD_CLINIC_SLUG = SEED_DATA.CLINICS[3].slug;

// Billing test data constants
export const TEST_SERVICE_CONSULTATION = SEED_DATA.SERVICES[0].name;
export const TEST_SERVICE_FOLLOWUP = SEED_DATA.SERVICES[1].name;
export const TEST_SERVICE_XRAY = SEED_DATA.SERVICES[2].name;
export const TEST_PATIENT_ONE_NAME = SEED_DATA.PATIENTS[0].full_name;
export const TEST_PATIENT_ONE_PHONE = SEED_DATA.PATIENTS[0].phone;
export const TEST_PATIENT_TWO_NAME = SEED_DATA.PATIENTS[1].full_name;

// Review test data constants
export const TEST_REVIEW_TEXT = "Excellent service and professional staff. Highly recommend!";
export const TEST_REVIEW_DOCTOR_RESPONSE = "Thank you for your kind feedback. We are glad to have helped.";

// Pharmacy POS test data constants
export const TEST_PRODUCT_PARACETAMOL = SEED_DATA.PRODUCTS[0].name;
export const TEST_PRODUCT_AMOXICILLIN = SEED_DATA.PRODUCTS[1].name;
export const TEST_PRODUCT_VITAMIN_C = SEED_DATA.PRODUCTS[2].name;
export const TEST_PRODUCT_THERMOMETER = SEED_DATA.PRODUCTS[3].name;
export const TEST_PRODUCT_BARCODE = SEED_DATA.PRODUCTS[0].barcode;
export const TEST_BATCH_PARACETAMOL_1 = SEED_DATA.BATCHES[0].batch_number;
export const TEST_BATCH_PARACETAMOL_2 = SEED_DATA.BATCHES[1].batch_number;
export const TEST_CREDIT_CUSTOMER = SEED_DATA.CREDIT_ACCOUNTS[0].customer_name;
export const TEST_PHARMACY_SLUG = SEED_DATA.CLINICS[2].slug; // Test Pharmacy

/**
 * Seed test users
 */
async function seedUsers(): Promise<Map<string, string>> {
  const userIds = new Map<string, string>();

  for (const [key, userData] of Object.entries(SEED_DATA.USERS)) {
    const passwordHash = await hash(userData.password, 12);

    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        name: userData.name,
        password_hash: passwordHash,
        role: userData.role,
      },
      create: {
        email: userData.email,
        name: userData.name,
        password_hash: passwordHash,
        role: userData.role,
        emailVerified: new Date(), // Mark as verified for tests
      },
    });

    userIds.set(key, user.id);
  }

  return userIds;
}

/**
 * Seed test professionals (doctors, dentists, pharmacists)
 */
async function seedProfessionals(
  claimedByUserId?: string
): Promise<Map<string, string>> {
  const professionalIds = new Map<string, string>();

  // Seed doctors
  for (const doctor of SEED_DATA.DOCTORS) {
    const prof = await prisma.professional.upsert({
      where: {
        type_registration_number: {
          type: ProfessionalType.DOCTOR,
          registration_number: doctor.registration_number,
        },
      },
      update: {
        full_name: doctor.full_name,
        full_name_ne: doctor.full_name_ne,
        slug: doctor.slug,
        gender: doctor.gender,
        address: doctor.address,
        degree: doctor.degree,
        specialties: doctor.specialties,
        verified: doctor.verified,
      },
      create: {
        type: ProfessionalType.DOCTOR,
        registration_number: doctor.registration_number,
        full_name: doctor.full_name,
        full_name_ne: doctor.full_name_ne,
        slug: doctor.slug,
        gender: doctor.gender,
        address: doctor.address,
        degree: doctor.degree,
        specialties: doctor.specialties,
        verified: doctor.verified,
        registration_date: new Date("2020-01-01"),
      },
    });

    professionalIds.set(`DOCTOR_${doctor.registration_number}`, prof.id);
  }

  // Seed dentists
  for (const dentist of SEED_DATA.DENTISTS) {
    const prof = await prisma.professional.upsert({
      where: {
        type_registration_number: {
          type: ProfessionalType.DENTIST,
          registration_number: dentist.registration_number,
        },
      },
      update: {
        full_name: dentist.full_name,
        full_name_ne: dentist.full_name_ne,
        slug: dentist.slug,
        gender: dentist.gender,
        address: dentist.address,
        degree: dentist.degree,
        specialties: dentist.specialties,
        verified: dentist.verified,
      },
      create: {
        type: ProfessionalType.DENTIST,
        registration_number: dentist.registration_number,
        full_name: dentist.full_name,
        full_name_ne: dentist.full_name_ne,
        slug: dentist.slug,
        gender: dentist.gender,
        address: dentist.address,
        degree: dentist.degree,
        specialties: dentist.specialties,
        verified: dentist.verified,
        registration_date: new Date("2020-01-01"),
      },
    });

    professionalIds.set(`DENTIST_${dentist.registration_number}`, prof.id);
  }

  // Seed pharmacists
  for (const pharmacist of SEED_DATA.PHARMACISTS) {
    const prof = await prisma.professional.upsert({
      where: {
        type_registration_number: {
          type: ProfessionalType.PHARMACIST,
          registration_number: pharmacist.registration_number,
        },
      },
      update: {
        full_name: pharmacist.full_name,
        full_name_ne: pharmacist.full_name_ne,
        slug: pharmacist.slug,
        gender: pharmacist.gender,
        address: pharmacist.address,
        degree: pharmacist.degree,
        specialties: pharmacist.specialties,
        verified: pharmacist.verified,
      },
      create: {
        type: ProfessionalType.PHARMACIST,
        registration_number: pharmacist.registration_number,
        full_name: pharmacist.full_name,
        full_name_ne: pharmacist.full_name_ne,
        slug: pharmacist.slug,
        gender: pharmacist.gender,
        address: pharmacist.address,
        degree: pharmacist.degree,
        specialties: pharmacist.specialties,
        verified: pharmacist.verified,
        registration_date: new Date("2020-01-01"),
      },
    });

    professionalIds.set(`PHARMACIST_${pharmacist.registration_number}`, prof.id);
  }

  // Link professional user to Dr. Ram Sharma (12345) - the doctor at dashboard clinic with reviews
  // This enables doctor response tests to work
  if (claimedByUserId) {
    await prisma.professional.update({
      where: {
        type_registration_number: {
          type: ProfessionalType.DOCTOR,
          registration_number: "12345", // Dr. Ram Sharma
        },
      },
      data: {
        claimed_by_id: claimedByUserId,
      },
    });
  }

  return professionalIds;
}

/**
 * Seed verification requests with different statuses for testing
 */
async function seedVerificationRequests(
  userId: string,
  professionalIds: Map<string, string>,
  adminUserId: string
): Promise<{ pendingId: string; approvedId: string; rejectedId: string }> {
  // Clean up any existing verification requests for this user
  await prisma.verificationRequest.deleteMany({
    where: { user_id: userId },
  });

  const unclaimedDoctorId = professionalIds.get("DOCTOR_99999");
  const dentistOneId = professionalIds.get("DENTIST_D1002");
  const pharmacistTwoId = professionalIds.get("PHARMACIST_P1002");

  if (!unclaimedDoctorId || !dentistOneId || !pharmacistTwoId) {
    throw new Error("Failed to get professional IDs for verification requests");
  }

  // Create PENDING verification request (unclaimed doctor)
  const pendingRequest = await prisma.verificationRequest.create({
    data: {
      user_id: userId,
      professional_id: unclaimedDoctorId,
      status: VerificationStatus.PENDING,
      government_id_url: "https://example.com/test-government-id.jpg",
      certificate_url: "https://example.com/test-certificate.jpg",
    },
  });

  // Create APPROVED verification request (dentist)
  const approvedRequest = await prisma.verificationRequest.create({
    data: {
      user_id: userId,
      professional_id: dentistOneId,
      status: VerificationStatus.APPROVED,
      government_id_url: "https://example.com/approved-government-id.jpg",
      certificate_url: "https://example.com/approved-certificate.jpg",
      reviewed_at: new Date(),
      reviewed_by_id: adminUserId,
    },
  });

  // Create REJECTED verification request (pharmacist)
  const rejectedRequest = await prisma.verificationRequest.create({
    data: {
      user_id: userId,
      professional_id: pharmacistTwoId,
      status: VerificationStatus.REJECTED,
      government_id_url: "https://example.com/rejected-government-id.jpg",
      certificate_url: "https://example.com/rejected-certificate.jpg",
      reviewed_at: new Date(),
      reviewed_by_id: adminUserId,
      admin_notes: "Documents were not clearly visible. Please resubmit with better quality images.",
    },
  });

  return {
    pendingId: pendingRequest.id,
    approvedId: approvedRequest.id,
    rejectedId: rejectedRequest.id,
  };
}

/**
 * Seed test clinics for admin verification tests
 */
async function seedClinics(
  ownerUserId: string,
  clinicOwnerUserId: string
): Promise<Map<string, string>> {
  const clinicIds = new Map<string, string>();

  for (const clinicData of SEED_DATA.CLINICS) {
    // Determine which user should own this clinic
    const ownerId = (clinicData as { ownerType?: string }).ownerType === "CLINIC_OWNER"
      ? clinicOwnerUserId
      : ownerUserId;

    // Check if clinic already exists
    const existing = await prisma.clinic.findUnique({
      where: { slug: clinicData.slug },
    });

    // Get timings from data if available
    const timingsData = (clinicData as { timings?: Record<string, unknown> }).timings || {};
    const timings = Object.keys(timingsData).length > 0 ? timingsData as Prisma.InputJsonValue : {};

    if (existing) {
      // Update existing clinic
      const clinic = await prisma.clinic.update({
        where: { slug: clinicData.slug },
        data: {
          name: clinicData.name,
          type: clinicData.type,
          address: clinicData.address,
          phone: clinicData.phone,
          email: clinicData.email,
          website: clinicData.website,
          services: clinicData.services,
          timings: timings,
          verified: clinicData.verified,
          claimed_by_id: ownerId,
        },
      });
      clinicIds.set(clinicData.slug, clinic.id);
    } else {
      // Create new clinic
      const clinic = await prisma.clinic.create({
        data: {
          name: clinicData.name,
          slug: clinicData.slug,
          type: clinicData.type,
          address: clinicData.address,
          phone: clinicData.phone,
          email: clinicData.email,
          website: clinicData.website,
          services: clinicData.services,
          timings: timings,
          photos: [],
          verified: clinicData.verified,
          claimed_by_id: ownerId,
        },
      });
      clinicIds.set(clinicData.slug, clinic.id);
    }
  }

  return clinicIds;
}

/**
 * Seed clinic doctors for the dashboard test clinic
 */
async function seedClinicDoctors(
  clinicIds: Map<string, string>,
  professionalIds: Map<string, string>
): Promise<void> {
  const dashboardClinicId = clinicIds.get("dashboard-test-clinic");
  if (!dashboardClinicId) {
    console.log("  ⚠ Dashboard test clinic not found, skipping clinic doctors seeding");
    return;
  }

  // Delete existing clinic doctors for this clinic
  await prisma.clinicDoctor.deleteMany({
    where: { clinic_id: dashboardClinicId },
  });

  // Add first two verified doctors to the dashboard clinic
  const doctor1Id = professionalIds.get("DOCTOR_12345"); // Dr. Ram Sharma
  const doctor2Id = professionalIds.get("DOCTOR_12346"); // Dr. Sita Thapa

  if (doctor1Id) {
    await prisma.clinicDoctor.create({
      data: {
        clinic_id: dashboardClinicId,
        doctor_id: doctor1Id,
        role: "permanent",
        joined_at: new Date("2024-01-01"),
      },
    });
  }

  if (doctor2Id) {
    await prisma.clinicDoctor.create({
      data: {
        clinic_id: dashboardClinicId,
        doctor_id: doctor2Id,
        role: "visiting",
        joined_at: new Date("2024-06-01"),
      },
    });
  }
}

/**
 * Seed doctor schedules for appointment booking tests
 */
async function seedDoctorSchedules(
  clinicIds: Map<string, string>,
  professionalIds: Map<string, string>
): Promise<void> {
  const dashboardClinicId = clinicIds.get("dashboard-test-clinic");
  if (!dashboardClinicId) {
    console.log("  ⚠ Dashboard test clinic not found, skipping doctor schedules seeding");
    return;
  }

  const doctor1Id = professionalIds.get("DOCTOR_12345"); // Dr. Ram Sharma
  const doctor2Id = professionalIds.get("DOCTOR_12346"); // Dr. Sita Thapa

  // Delete existing schedules for this clinic
  await prisma.doctorSchedule.deleteMany({
    where: { clinic_id: dashboardClinicId },
  });

  // Effective date range for schedules (from past to future)
  const effectiveFrom = new Date("2024-01-01");

  // Dr. Ram Sharma - works Monday to Friday, 09:00-17:00, 30 min slots
  if (doctor1Id) {
    const weekdays = [1, 2, 3, 4, 5]; // Monday to Friday
    for (const day of weekdays) {
      await prisma.doctorSchedule.create({
        data: {
          clinic_id: dashboardClinicId,
          doctor_id: doctor1Id,
          day_of_week: day,
          start_time: "09:00",
          end_time: "17:00",
          slot_duration_minutes: 30,
          max_patients_per_slot: 1,
          is_active: true,
          effective_from: effectiveFrom,
          effective_to: null, // No end date
        },
      });
    }
  }

  // Dr. Sita Thapa - works Monday, Wednesday, Friday, 10:00-14:00, 20 min slots
  if (doctor2Id) {
    const visitingDays = [1, 3, 5]; // Mon, Wed, Fri
    for (const day of visitingDays) {
      await prisma.doctorSchedule.create({
        data: {
          clinic_id: dashboardClinicId,
          doctor_id: doctor2Id,
          day_of_week: day,
          start_time: "10:00",
          end_time: "14:00",
          slot_duration_minutes: 20,
          max_patients_per_slot: 2, // Allows overbooking
          is_active: true,
          effective_from: effectiveFrom,
          effective_to: null,
        },
      });
    }
  }
}

/**
 * Seed clinic services for billing tests
 */
async function seedServices(clinicIds: Map<string, string>): Promise<Map<string, string>> {
  const serviceIds = new Map<string, string>();
  const dashboardClinicId = clinicIds.get("dashboard-test-clinic");

  if (!dashboardClinicId) {
    console.log("  ⚠ Dashboard test clinic not found, skipping services seeding");
    return serviceIds;
  }

  // Delete existing services for this clinic
  await prisma.service.deleteMany({
    where: { clinic_id: dashboardClinicId },
  });

  for (const serviceData of SEED_DATA.SERVICES) {
    const service = await prisma.service.create({
      data: {
        clinic_id: dashboardClinicId,
        name: serviceData.name,
        description: serviceData.description,
        price: serviceData.price,
        category: serviceData.category,
        is_active: serviceData.is_active,
      },
    });
    serviceIds.set(serviceData.name, service.id);
  }

  return serviceIds;
}

/**
 * Seed clinic patients for billing tests
 */
async function seedPatients(clinicIds: Map<string, string>): Promise<Map<string, string>> {
  const patientIds = new Map<string, string>();
  const dashboardClinicId = clinicIds.get("dashboard-test-clinic");

  if (!dashboardClinicId) {
    console.log("  ⚠ Dashboard test clinic not found, skipping patients seeding");
    return patientIds;
  }

  for (const patientData of SEED_DATA.PATIENTS) {
    // Upsert patient by phone (unique per clinic)
    const existing = await prisma.patient.findFirst({
      where: {
        clinic_id: dashboardClinicId,
        phone: patientData.phone,
      },
    });

    if (existing) {
      // Update existing patient
      const patient = await prisma.patient.update({
        where: { id: existing.id },
        data: {
          patient_number: patientData.patient_number,
          full_name: patientData.full_name,
          email: patientData.email,
          gender: patientData.gender,
          address: patientData.address,
        },
      });
      patientIds.set(patientData.phone, patient.id);
    } else {
      // Create new patient
      const patient = await prisma.patient.create({
        data: {
          clinic_id: dashboardClinicId,
          patient_number: patientData.patient_number,
          full_name: patientData.full_name,
          phone: patientData.phone,
          email: patientData.email,
          gender: patientData.gender,
          address: patientData.address,
          allergies: [],
        },
      });
      patientIds.set(patientData.phone, patient.id);
    }
  }

  return patientIds;
}

/**
 * Seed sample invoices for report tests
 */
async function seedInvoices(
  clinicIds: Map<string, string>,
  patientIds: Map<string, string>,
  serviceIds: Map<string, string>,
  createdById: string
): Promise<void> {
  const dashboardClinicId = clinicIds.get("dashboard-test-clinic");

  if (!dashboardClinicId) {
    console.log("  ⚠ Dashboard test clinic not found, skipping invoices seeding");
    return;
  }

  // Delete existing invoices for this clinic
  await prisma.invoice.deleteMany({
    where: { clinic_id: dashboardClinicId },
  });

  const patientOneId = patientIds.get(SEED_DATA.PATIENTS[0].phone);
  const patientTwoId = patientIds.get(SEED_DATA.PATIENTS[1].phone);
  const consultationId = serviceIds.get("General Consultation");
  const xrayId = serviceIds.get("X-Ray");

  if (!patientOneId || !patientTwoId || !consultationId || !xrayId) {
    console.log("  ⚠ Missing patient/service IDs, skipping invoices seeding");
    return;
  }

  // Create a few sample invoices for report testing
  const invoices = [
    {
      patient_id: patientOneId,
      invoice_number: "INV-2026-0001",
      items: [
        { service_id: consultationId, name: "General Consultation", quantity: 1, unit_price: 500, amount: 500 },
      ],
      subtotal: 500,
      discount: 0,
      tax: 0,
      total: 500,
      payment_mode: PaymentMode.CASH,
      payment_status: PaymentStatus.PAID,
    },
    {
      patient_id: patientTwoId,
      invoice_number: "INV-2026-0002",
      items: [
        { service_id: consultationId, name: "General Consultation", quantity: 1, unit_price: 500, amount: 500 },
        { service_id: xrayId, name: "X-Ray", quantity: 1, unit_price: 1200, amount: 1200 },
      ],
      subtotal: 1700,
      discount: 100,
      tax: 208, // 13% of (1700 - 100)
      total: 1808,
      payment_mode: PaymentMode.CARD,
      payment_status: PaymentStatus.PAID,
    },
    {
      patient_id: patientOneId,
      invoice_number: "INV-2026-0003",
      items: [
        { service_id: xrayId, name: "X-Ray", quantity: 2, unit_price: 1200, amount: 2400 },
      ],
      subtotal: 2400,
      discount: 0,
      tax: 0,
      total: 2400,
      payment_mode: PaymentMode.CREDIT,
      payment_status: PaymentStatus.PENDING,
    },
  ];

  for (const invoiceData of invoices) {
    await prisma.invoice.create({
      data: {
        clinic_id: dashboardClinicId,
        patient_id: invoiceData.patient_id,
        created_by_id: createdById,
        invoice_number: invoiceData.invoice_number,
        items: invoiceData.items,
        subtotal: invoiceData.subtotal,
        discount: invoiceData.discount,
        tax: invoiceData.tax,
        total: invoiceData.total,
        payment_mode: invoiceData.payment_mode,
        payment_status: invoiceData.payment_status,
      },
    });
  }
}

/**
 * Seed completed appointments for review tests
 */
async function seedAppointments(
  clinicIds: Map<string, string>,
  patientIds: Map<string, string>,
  professionalIds: Map<string, string>
): Promise<Map<string, string>> {
  const appointmentIds = new Map<string, string>();
  const dashboardClinicId = clinicIds.get("dashboard-test-clinic");

  if (!dashboardClinicId) {
    console.log("  ⚠ Dashboard test clinic not found, skipping appointments seeding");
    return appointmentIds;
  }

  const patientOneId = patientIds.get(SEED_DATA.PATIENTS[0].phone);
  const patientTwoId = patientIds.get(SEED_DATA.PATIENTS[1].phone);
  const doctor1Id = professionalIds.get("DOCTOR_12345"); // Dr. Ram Sharma

  if (!patientOneId || !patientTwoId || !doctor1Id) {
    console.log("  ⚠ Missing patient/doctor IDs, skipping appointments seeding");
    return appointmentIds;
  }

  // Delete existing test appointments
  await prisma.appointment.deleteMany({
    where: {
      clinic_id: dashboardClinicId,
    },
  });

  // Create a completed appointment for patient one (for review submission)
  const appointment1 = await prisma.appointment.create({
    data: {
      clinic_id: dashboardClinicId,
      patient_id: patientOneId,
      doctor_id: doctor1Id,
      appointment_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      time_slot_start: "10:00",
      time_slot_end: "10:30",
      status: AppointmentStatus.COMPLETED,
      type: AppointmentType.NEW,
      source: AppointmentSource.ONLINE,
      chief_complaint: "General checkup",
      token_number: 1,
    },
  });
  appointmentIds.set("COMPLETED_1", appointment1.id);

  // Create another completed appointment for patient two (for additional review)
  const appointment2 = await prisma.appointment.create({
    data: {
      clinic_id: dashboardClinicId,
      patient_id: patientTwoId,
      doctor_id: doctor1Id,
      appointment_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      time_slot_start: "11:00",
      time_slot_end: "11:30",
      status: AppointmentStatus.COMPLETED,
      type: AppointmentType.FOLLOW_UP,
      source: AppointmentSource.WALK_IN,
      chief_complaint: "Follow-up visit",
      token_number: 2,
    },
  });
  appointmentIds.set("COMPLETED_2", appointment2.id);

  return appointmentIds;
}

/**
 * Seed reviews for testing review display, moderation, and response
 */
async function seedReviews(
  clinicIds: Map<string, string>,
  patientIds: Map<string, string>,
  professionalIds: Map<string, string>,
  appointmentIds: Map<string, string>
): Promise<Map<string, string>> {
  const reviewIds = new Map<string, string>();
  const dashboardClinicId = clinicIds.get("dashboard-test-clinic");

  if (!dashboardClinicId) {
    console.log("  ⚠ Dashboard test clinic not found, skipping reviews seeding");
    return reviewIds;
  }

  const patientOneId = patientIds.get(SEED_DATA.PATIENTS[0].phone);
  const patientTwoId = patientIds.get(SEED_DATA.PATIENTS[1].phone);
  const doctor1Id = professionalIds.get("DOCTOR_12345"); // Dr. Ram Sharma
  const completedAppointment1 = appointmentIds.get("COMPLETED_1");
  const completedAppointment2 = appointmentIds.get("COMPLETED_2");

  if (!patientOneId || !patientTwoId || !doctor1Id) {
    console.log("  ⚠ Missing patient/doctor IDs, skipping reviews seeding");
    return reviewIds;
  }

  // Delete existing reviews for this clinic
  await prisma.review.deleteMany({
    where: {
      clinic_id: dashboardClinicId,
    },
  });

  // Create a published review with doctor response (for display tests)
  const review1 = await prisma.review.create({
    data: {
      clinic_id: dashboardClinicId,
      doctor_id: doctor1Id,
      patient_id: patientOneId,
      appointment_id: completedAppointment1 || null,
      rating: 5,
      review_text: "Excellent service and professional staff. Highly recommend!",
      categories: {
        cleanliness: 5,
        wait_time: 4,
        staff: 5,
      },
      doctor_response: "Thank you for your kind feedback. We are glad to have helped.",
      is_published: true,
    },
  });
  reviewIds.set("PUBLISHED_WITH_RESPONSE", review1.id);

  // Create a published review without doctor response (for doctor response test)
  const review2 = await prisma.review.create({
    data: {
      clinic_id: dashboardClinicId,
      doctor_id: doctor1Id,
      patient_id: patientTwoId,
      appointment_id: completedAppointment2 || null,
      rating: 4,
      review_text: "Good experience overall. Would visit again.",
      categories: {
        cleanliness: 4,
        wait_time: 3,
        staff: 4,
      },
      doctor_response: null,
      is_published: true,
    },
  });
  reviewIds.set("PUBLISHED_NO_RESPONSE", review2.id);

  // Create an unpublished review (for admin moderation test)
  const review3 = await prisma.review.create({
    data: {
      clinic_id: dashboardClinicId,
      doctor_id: doctor1Id,
      patient_id: patientOneId,
      appointment_id: null, // General clinic review
      rating: 2,
      review_text: "Service could be improved. Long wait times.",
      categories: {
        cleanliness: 3,
        wait_time: 1,
        staff: 2,
      },
      doctor_response: null,
      is_published: false, // Unpublished for moderation test
    },
  });
  reviewIds.set("UNPUBLISHED", review3.id);

  return reviewIds;
}

/**
 * Seed pharmacy products for POS tests
 */
async function seedPharmacyProducts(
  clinicIds: Map<string, string>
): Promise<Map<string, string>> {
  const productIds = new Map<string, string>();
  const dashboardClinicId = clinicIds.get("dashboard-test-clinic");

  if (!dashboardClinicId) {
    console.log("  ⚠ Dashboard test clinic not found, skipping pharmacy products seeding");
    return productIds;
  }

  // Delete existing products for this clinic
  await prisma.product.deleteMany({
    where: { clinic_id: dashboardClinicId },
  });

  for (let i = 0; i < SEED_DATA.PRODUCTS.length; i++) {
    const productData = SEED_DATA.PRODUCTS[i];
    const product = await prisma.product.create({
      data: {
        clinic_id: dashboardClinicId,
        name: productData.name,
        generic_name: productData.generic_name,
        category: productData.category,
        barcode: productData.barcode,
        gst_rate: productData.gst_rate,
        unit: productData.unit,
        pack_size: productData.pack_size,
        min_stock_level: productData.min_stock_level,
        is_active: true,
      },
    });
    productIds.set(`PRODUCT_${i}`, product.id);
  }

  return productIds;
}

/**
 * Seed inventory batches for POS tests
 */
async function seedInventoryBatches(
  clinicIds: Map<string, string>,
  productIds: Map<string, string>
): Promise<Map<string, string>> {
  const batchIds = new Map<string, string>();
  const dashboardClinicId = clinicIds.get("dashboard-test-clinic");

  if (!dashboardClinicId) {
    console.log("  ⚠ Dashboard test clinic not found, skipping inventory batches seeding");
    return batchIds;
  }

  // Delete existing batches for this clinic
  await prisma.inventoryBatch.deleteMany({
    where: { clinic_id: dashboardClinicId },
  });

  for (let i = 0; i < SEED_DATA.BATCHES.length; i++) {
    const batchData = SEED_DATA.BATCHES[i];
    const productId = productIds.get(`PRODUCT_${batchData.productIndex}`);

    if (!productId) {
      console.log(`  ⚠ Product ${batchData.productIndex} not found, skipping batch ${i}`);
      continue;
    }

    const batch = await prisma.inventoryBatch.create({
      data: {
        clinic_id: dashboardClinicId,
        product_id: productId,
        batch_number: batchData.batch_number,
        expiry_date: batchData.expiry_date,
        quantity: batchData.quantity,
        original_qty: batchData.original_qty,
        purchase_price: batchData.purchase_price,
        mrp: batchData.mrp,
        selling_price: batchData.selling_price,
        is_active: true,
      },
    });
    batchIds.set(`BATCH_${i}`, batch.id);
  }

  return batchIds;
}

/**
 * Seed credit accounts for POS tests
 */
async function seedCreditAccounts(
  clinicIds: Map<string, string>
): Promise<Map<string, string>> {
  const creditAccountIds = new Map<string, string>();
  const dashboardClinicId = clinicIds.get("dashboard-test-clinic");

  if (!dashboardClinicId) {
    console.log("  ⚠ Dashboard test clinic not found, skipping credit accounts seeding");
    return creditAccountIds;
  }

  // Delete existing credit accounts for this clinic
  await prisma.creditAccount.deleteMany({
    where: { clinic_id: dashboardClinicId },
  });

  for (let i = 0; i < SEED_DATA.CREDIT_ACCOUNTS.length; i++) {
    const accountData = SEED_DATA.CREDIT_ACCOUNTS[i];
    const creditAccount = await prisma.creditAccount.create({
      data: {
        clinic_id: dashboardClinicId,
        customer_name: accountData.customer_name,
        phone: accountData.phone,
        address: accountData.address,
        credit_limit: accountData.credit_limit,
        current_balance: accountData.current_balance,
        is_active: true,
      },
    });
    creditAccountIds.set(`CREDIT_${i}`, creditAccount.id);
  }

  return creditAccountIds;
}

/**
 * Clean up all test data
 * IMPORTANT: Order matters due to foreign key constraints
 */
async function cleanupTestData(): Promise<void> {
  // Delete in reverse order of dependencies
  await prisma.auditLog.deleteMany({});
  await prisma.verificationRequest.deleteMany({});

  // Delete clinic doctors (before clinics and professionals)
  const testClinicSlugs = SEED_DATA.CLINICS.map((c) => c.slug);

  // Delete reviews (before appointments and patients)
  await prisma.review.deleteMany({
    where: {
      clinic: {
        slug: {
          in: testClinicSlugs,
        },
      },
    },
  });

  // Delete pharmacy data (sales, credit transactions, batches, products, credit accounts)
  await prisma.creditTransaction.deleteMany({
    where: {
      clinic: {
        slug: {
          in: testClinicSlugs,
        },
      },
    },
  });

  await prisma.sale.deleteMany({
    where: {
      clinic: {
        slug: {
          in: testClinicSlugs,
        },
      },
    },
  });

  await prisma.inventoryBatch.deleteMany({
    where: {
      clinic: {
        slug: {
          in: testClinicSlugs,
        },
      },
    },
  });

  await prisma.product.deleteMany({
    where: {
      clinic: {
        slug: {
          in: testClinicSlugs,
        },
      },
    },
  });

  await prisma.creditAccount.deleteMany({
    where: {
      clinic: {
        slug: {
          in: testClinicSlugs,
        },
      },
    },
  });

  // Delete invoices (before patients)
  await prisma.invoice.deleteMany({
    where: {
      clinic: {
        slug: {
          in: testClinicSlugs,
        },
      },
    },
  });

  // Delete appointments (before patients)
  await prisma.appointment.deleteMany({
    where: {
      clinic: {
        slug: {
          in: testClinicSlugs,
        },
      },
    },
  });

  // Delete patients (before clinics)
  await prisma.patient.deleteMany({
    where: {
      clinic: {
        slug: {
          in: testClinicSlugs,
        },
      },
    },
  });

  await prisma.clinicDoctor.deleteMany({
    where: {
      clinic: {
        slug: {
          in: testClinicSlugs,
        },
      },
    },
  });

  // Delete doctor schedules
  await prisma.doctorSchedule.deleteMany({
    where: {
      clinic: {
        slug: {
          in: testClinicSlugs,
        },
      },
    },
  });

  // Delete doctor leaves
  await prisma.doctorLeave.deleteMany({
    where: {
      clinic: {
        slug: {
          in: testClinicSlugs,
        },
      },
    },
  });

  // Delete services (before clinics)
  await prisma.service.deleteMany({
    where: {
      clinic: {
        slug: {
          in: testClinicSlugs,
        },
      },
    },
  });

  // Delete test clinics
  await prisma.clinic.deleteMany({
    where: {
      slug: {
        in: testClinicSlugs,
      },
    },
  });

  // Delete professionals with test registration numbers
  const testRegistrationNumbers = [
    ...SEED_DATA.DOCTORS.map((d) => d.registration_number),
    ...SEED_DATA.DENTISTS.map((d) => d.registration_number),
    ...SEED_DATA.PHARMACISTS.map((p) => p.registration_number),
  ];

  await prisma.professional.deleteMany({
    where: {
      registration_number: {
        in: testRegistrationNumbers,
      },
    },
  });

  // Delete test users
  const testEmails = Object.values(SEED_DATA.USERS).map((u) => u.email);
  await prisma.session.deleteMany({
    where: {
      user: {
        email: {
          in: testEmails,
        },
      },
    },
  });
  await prisma.account.deleteMany({
    where: {
      user: {
        email: {
          in: testEmails,
        },
      },
    },
  });
  await prisma.user.deleteMany({
    where: {
      email: {
        in: testEmails,
      },
    },
  });
}

/**
 * Main seed function - seeds all test data
 * Returns IDs for reference in tests
 */
export async function seedTestData(): Promise<{
  userIds: Map<string, string>;
  professionalIds: Map<string, string>;
  verificationRequestIds: { pendingId: string; approvedId: string; rejectedId: string };
  clinicIds: Map<string, string>;
}> {
  console.log("🌱 Seeding test data...");

  // Seed users first
  const userIds = await seedUsers();
  console.log(`  ✓ Seeded ${userIds.size} users`);

  // Seed professionals (with professional user claiming one)
  const professionalUserId = userIds.get("PROFESSIONAL");
  const professionalIds = await seedProfessionals(professionalUserId);
  console.log(`  ✓ Seeded ${professionalIds.size} professionals`);

  // Create verification requests with different statuses
  const regularUserId = userIds.get("REGULAR");
  const adminUserId = userIds.get("ADMIN");
  const clinicOwnerUserId = userIds.get("CLINIC_OWNER");

  if (!regularUserId || !adminUserId || !clinicOwnerUserId) {
    throw new Error("Failed to get user IDs for verification requests");
  }

  const verificationRequestIds = await seedVerificationRequests(
    regularUserId,
    professionalIds,
    adminUserId
  );
  console.log("  ✓ Seeded verification requests (pending, approved, rejected)");

  // Seed test clinics (owned by regular user for testing admin verification,
  // with dashboard test clinic owned by clinic owner)
  const clinicIds = await seedClinics(regularUserId, clinicOwnerUserId);
  console.log(`  ✓ Seeded ${clinicIds.size} clinics`);

  // Seed clinic doctors for dashboard test clinic
  await seedClinicDoctors(clinicIds, professionalIds);
  console.log("  ✓ Seeded clinic doctors for dashboard test clinic");

  // Seed doctor schedules for appointment booking tests
  await seedDoctorSchedules(clinicIds, professionalIds);
  console.log("  ✓ Seeded doctor schedules for appointment booking");

  // Seed services for billing tests
  const serviceIds = await seedServices(clinicIds);
  console.log(`  ✓ Seeded ${serviceIds.size} services for billing`);

  // Seed patients for billing tests
  const patientIds = await seedPatients(clinicIds);
  console.log(`  ✓ Seeded ${patientIds.size} patients for billing`);

  // Seed sample invoices for report tests
  await seedInvoices(clinicIds, patientIds, serviceIds, clinicOwnerUserId);
  console.log("  ✓ Seeded sample invoices for reports");

  // Seed appointments for review tests
  const appointmentIds = await seedAppointments(clinicIds, patientIds, professionalIds);
  console.log(`  ✓ Seeded ${appointmentIds.size} appointments for reviews`);

  // Seed reviews for review tests
  const reviewIds = await seedReviews(clinicIds, patientIds, professionalIds, appointmentIds);
  console.log(`  ✓ Seeded ${reviewIds.size} reviews for review tests`);

  // Seed pharmacy products for POS tests
  const productIds = await seedPharmacyProducts(clinicIds);
  console.log(`  ✓ Seeded ${productIds.size} pharmacy products`);

  // Seed inventory batches for POS tests
  const batchIds = await seedInventoryBatches(clinicIds, productIds);
  console.log(`  ✓ Seeded ${batchIds.size} inventory batches`);

  // Seed credit accounts for POS tests
  const creditAccountIds = await seedCreditAccounts(clinicIds);
  console.log(`  ✓ Seeded ${creditAccountIds.size} credit accounts`);

  console.log("✅ Test data seeding complete!");

  return {
    userIds,
    professionalIds,
    verificationRequestIds,
    clinicIds,
  };
}

/**
 * Teardown function - cleans up all test data
 */
export async function teardownTestData(): Promise<void> {
  console.log("🧹 Cleaning up test data...");
  await cleanupTestData();
  console.log("✅ Test data cleanup complete!");
}

/**
 * Disconnect Prisma client
 */
export async function disconnectDb(): Promise<void> {
  await prisma.$disconnect();
}

// Export the prisma client for direct use in tests if needed
export { prisma };
