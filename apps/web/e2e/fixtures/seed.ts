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
      services: ["General Consultation", "Specialist Consultation", "Lab Tests"],
      verified: true, // Verified clinic for dashboard tests
      ownerType: "CLINIC_OWNER", // Special marker for clinic owner
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

  // Link professional user to a claimed doctor profile
  if (claimedByUserId) {
    const verifiedDoctor = SEED_DATA.DOCTORS.find(
      (d) => d.registration_number === "88888"
    );
    if (verifiedDoctor) {
      await prisma.professional.update({
        where: {
          type_registration_number: {
            type: ProfessionalType.DOCTOR,
            registration_number: verifiedDoctor.registration_number,
          },
        },
        data: {
          claimed_by_id: claimedByUserId,
        },
      });
    }
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
          timings: {},
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
 * Clean up all test data
 * IMPORTANT: Order matters due to foreign key constraints
 */
async function cleanupTestData(): Promise<void> {
  // Delete in reverse order of dependencies
  await prisma.auditLog.deleteMany({});
  await prisma.verificationRequest.deleteMany({});

  // Delete clinic doctors (before clinics and professionals)
  const testClinicSlugs = SEED_DATA.CLINICS.map((c) => c.slug);
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
