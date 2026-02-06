import { NextRequest, NextResponse } from "next/server";
import { prisma, PaymentMode, PaymentStatus, LabOrderPriority } from "@swasthya/database";
import { requireClinicPermission } from "@/lib/require-clinic-access";

interface WalkInPatientData {
  full_name: string;
  phone: string;
  gender?: string;
  date_of_birth?: string;
}

interface WalkInRequestBody {
  patient?: WalkInPatientData;
  patient_id?: string;
  test_ids: string[];
  priority?: "ROUTINE" | "URGENT" | "STAT";
  notes?: string;
  payment_mode?: "CASH" | "CARD" | "UPI";
  payment_status?: "PENDING" | "PAID";
}

interface TestInfo {
  id: string;
  name: string;
  short_name: string | null;
  price: number;
}

/**
 * Generate next patient number for a clinic
 */
async function generatePatientNumber(clinicId: string): Promise<string> {
  const count = await prisma.patient.count({
    where: { clinic_id: clinicId },
  });

  const nextNumber = count + 1;
  return `P-${nextNumber.toString().padStart(6, "0")}`;
}

/**
 * Generate lab order number in format LAB-YYYYMMDD-XXXX
 */
async function generateLabOrderNumber(clinicId: string): Promise<string> {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const dateStr = `${year}${month}${day}`;

  // Count orders today for sequential number
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const orderCount = await prisma.labOrder.count({
    where: {
      clinic_id: clinicId,
      created_at: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
  });

  return `LAB-${dateStr}-${String(orderCount + 1).padStart(4, "0")}`;
}

/**
 * Generate invoice number in format INV-YYYY-XXXX
 */
async function generateInvoiceNumber(clinicId: string): Promise<string> {
  const year = new Date().getFullYear();

  const invoiceCount = await prisma.invoice.count({
    where: {
      clinic_id: clinicId,
      created_at: {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${year + 1}-01-01`),
      },
    },
  });

  return `INV-${year}-${String(invoiceCount + 1).padStart(4, "0")}`;
}

// Common lab tests database (for clinics that haven't set up their own)
const COMMON_LAB_TESTS: TestInfo[] = [
  // Hematology
  { id: "common-0", name: "Complete Blood Count (CBC)", short_name: "CBC", price: 350 },
  { id: "common-1", name: "Hemoglobin", short_name: "Hb", price: 100 },
  { id: "common-2", name: "Erythrocyte Sedimentation Rate", short_name: "ESR", price: 80 },
  { id: "common-3", name: "Platelet Count", short_name: "PLT", price: 150 },
  { id: "common-4", name: "Prothrombin Time", short_name: "PT", price: 300 },
  { id: "common-5", name: "Activated Partial Thromboplastin Time", short_name: "aPTT", price: 350 },
  // Biochemistry - Liver
  { id: "common-6", name: "Liver Function Test", short_name: "LFT", price: 600 },
  { id: "common-7", name: "Bilirubin (Total)", short_name: "T.Bili", price: 120 },
  { id: "common-8", name: "SGPT (ALT)", short_name: "ALT", price: 150 },
  { id: "common-9", name: "SGOT (AST)", short_name: "AST", price: 150 },
  { id: "common-10", name: "Alkaline Phosphatase", short_name: "ALP", price: 180 },
  { id: "common-11", name: "Albumin", short_name: "Alb", price: 120 },
  { id: "common-12", name: "Total Protein", short_name: "TP", price: 120 },
  // Biochemistry - Kidney
  { id: "common-13", name: "Renal Function Test", short_name: "RFT", price: 500 },
  { id: "common-14", name: "Blood Urea Nitrogen", short_name: "BUN", price: 100 },
  { id: "common-15", name: "Creatinine", short_name: "Cr", price: 100 },
  { id: "common-16", name: "Uric Acid", short_name: "UA", price: 150 },
  { id: "common-17", name: "eGFR", short_name: "eGFR", price: 200 },
  // Biochemistry - Lipids
  { id: "common-18", name: "Lipid Profile", short_name: "Lipid", price: 450 },
  { id: "common-19", name: "Total Cholesterol", short_name: "TC", price: 100 },
  { id: "common-20", name: "HDL Cholesterol", short_name: "HDL", price: 150 },
  { id: "common-21", name: "LDL Cholesterol", short_name: "LDL", price: 150 },
  { id: "common-22", name: "Triglycerides", short_name: "TG", price: 120 },
  // Biochemistry - Diabetes
  { id: "common-23", name: "Fasting Blood Sugar", short_name: "FBS", price: 80 },
  { id: "common-24", name: "Random Blood Sugar", short_name: "RBS", price: 80 },
  { id: "common-25", name: "Post Prandial Blood Sugar", short_name: "PPBS", price: 80 },
  { id: "common-26", name: "HbA1c", short_name: "HbA1c", price: 600 },
  { id: "common-27", name: "Oral Glucose Tolerance Test", short_name: "OGTT", price: 300 },
  // Thyroid
  { id: "common-28", name: "Thyroid Profile (T3, T4, TSH)", short_name: "TFT", price: 800 },
  { id: "common-29", name: "TSH", short_name: "TSH", price: 350 },
  { id: "common-30", name: "Free T3", short_name: "FT3", price: 400 },
  { id: "common-31", name: "Free T4", short_name: "FT4", price: 400 },
  // Urine
  { id: "common-32", name: "Urine Routine & Microscopy", short_name: "Urine R/M", price: 100 },
  { id: "common-33", name: "Urine Culture & Sensitivity", short_name: "Urine C/S", price: 400 },
  { id: "common-34", name: "24-Hour Urine Protein", short_name: "24h Prot", price: 200 },
  // Stool
  { id: "common-35", name: "Stool Routine & Microscopy", short_name: "Stool R/M", price: 80 },
  { id: "common-36", name: "Stool Occult Blood", short_name: "FOBT", price: 100 },
  // Cardiac
  { id: "common-37", name: "Troponin I", short_name: "TnI", price: 800 },
  { id: "common-38", name: "CK-MB", short_name: "CK-MB", price: 400 },
  { id: "common-39", name: "BNP", short_name: "BNP", price: 1200 },
  // Electrolytes
  { id: "common-40", name: "Electrolytes (Na, K, Cl)", short_name: "Elec", price: 350 },
  { id: "common-41", name: "Sodium", short_name: "Na", price: 100 },
  { id: "common-42", name: "Potassium", short_name: "K", price: 100 },
  { id: "common-43", name: "Calcium", short_name: "Ca", price: 120 },
  { id: "common-44", name: "Magnesium", short_name: "Mg", price: 150 },
  { id: "common-45", name: "Phosphorus", short_name: "P", price: 120 },
  // Hormones
  { id: "common-46", name: "Vitamin D (25-OH)", short_name: "Vit D", price: 1200 },
  { id: "common-47", name: "Vitamin B12", short_name: "B12", price: 800 },
  { id: "common-48", name: "Folic Acid", short_name: "Folate", price: 600 },
  { id: "common-49", name: "Iron Studies", short_name: "Iron", price: 500 },
  { id: "common-50", name: "Ferritin", short_name: "Ferr", price: 400 },
  // Serology
  { id: "common-51", name: "HIV 1 & 2 Antibodies", short_name: "HIV", price: 300 },
  { id: "common-52", name: "HBsAg", short_name: "HBsAg", price: 250 },
  { id: "common-53", name: "Anti-HCV", short_name: "HCV", price: 400 },
  { id: "common-54", name: "VDRL", short_name: "VDRL", price: 100 },
  { id: "common-55", name: "Dengue NS1 Antigen", short_name: "Dengue NS1", price: 600 },
  { id: "common-56", name: "Widal Test", short_name: "Widal", price: 200 },
  { id: "common-57", name: "RA Factor", short_name: "RA", price: 250 },
  { id: "common-58", name: "CRP (C-Reactive Protein)", short_name: "CRP", price: 200 },
  { id: "common-59", name: "ASO Titre", short_name: "ASO", price: 200 },
  // Microbiology
  { id: "common-60", name: "Blood Culture & Sensitivity", short_name: "Blood C/S", price: 600 },
  { id: "common-61", name: "Throat Swab Culture", short_name: "Throat C/S", price: 400 },
  { id: "common-62", name: "Wound Swab Culture", short_name: "Wound C/S", price: 400 },
  // Others
  { id: "common-63", name: "Pregnancy Test (Urine)", short_name: "UPT", price: 100 },
  { id: "common-64", name: "Pregnancy Test (Blood)", short_name: "B-hCG", price: 400 },
  { id: "common-65", name: "PSA (Prostate Specific Antigen)", short_name: "PSA", price: 800 },
  { id: "common-66", name: "ANA (Antinuclear Antibody)", short_name: "ANA", price: 1200 },
  { id: "common-67", name: "Anti-dsDNA", short_name: "dsDNA", price: 1000 },
];

/**
 * POST /api/clinic/lab-orders/walk-in
 *
 * Create a walk-in lab order with invoice.
 * This endpoint handles:
 * 1. Creating or finding the patient
 * 2. Creating the lab order
 * 3. Creating lab results for each test
 * 4. Creating an invoice
 * 5. Returning receipt data
 */
export async function POST(request: NextRequest) {
  try {
    // Check lab permission
    const access = await requireClinicPermission("lab");
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: access.message },
        { status: access.reason === "unauthenticated" ? 401 : 403 }
      );
    }

    const body: WalkInRequestBody = await request.json();
    const {
      patient: patientData,
      patient_id,
      test_ids,
      priority = "ROUTINE",
      notes,
      payment_mode = "CASH",
      payment_status = "PENDING",
    } = body;

    // Validate: either patient_id or patient data required
    if (!patient_id && !patientData) {
      return NextResponse.json(
        { error: "Either patient_id or patient data is required" },
        { status: 400 }
      );
    }

    // Validate patient data if provided
    if (patientData) {
      if (!patientData.full_name || !patientData.full_name.trim()) {
        return NextResponse.json(
          { error: "Patient name is required" },
          { status: 400 }
        );
      }
      if (!patientData.phone || !patientData.phone.trim()) {
        return NextResponse.json(
          { error: "Patient phone is required" },
          { status: 400 }
        );
      }
    }

    // Validate test_ids
    if (!test_ids || !Array.isArray(test_ids) || test_ids.length === 0) {
      return NextResponse.json(
        { error: "At least one test must be selected" },
        { status: 400 }
      );
    }

    // Get clinic details for receipt
    const clinic = await prisma.clinic.findUnique({
      where: { id: access.clinicId },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
      },
    });

    if (!clinic) {
      return NextResponse.json(
        { error: "Clinic not found" },
        { status: 404 }
      );
    }

    // Resolve or create patient
    let patient;
    if (patient_id) {
      // Use existing patient
      patient = await prisma.patient.findFirst({
        where: {
          id: patient_id,
          clinic_id: access.clinicId,
        },
        select: {
          id: true,
          patient_number: true,
          full_name: true,
          phone: true,
          gender: true,
          date_of_birth: true,
        },
      });

      if (!patient) {
        return NextResponse.json(
          { error: "Patient not found" },
          { status: 404 }
        );
      }
    } else {
      // Try to find existing patient by phone or create new
      const cleanPhone = patientData!.phone.replace(/\s/g, "");

      const existingPatient = await prisma.patient.findFirst({
        where: {
          clinic_id: access.clinicId,
          phone: cleanPhone,
        },
        select: {
          id: true,
          patient_number: true,
          full_name: true,
          phone: true,
          gender: true,
          date_of_birth: true,
        },
      });

      if (existingPatient) {
        patient = existingPatient;
      } else {
        // Create new patient
        const patientNumber = await generatePatientNumber(access.clinicId);
        patient = await prisma.patient.create({
          data: {
            clinic_id: access.clinicId,
            patient_number: patientNumber,
            full_name: patientData!.full_name.trim(),
            phone: cleanPhone,
            gender: patientData!.gender || null,
            date_of_birth: patientData!.date_of_birth
              ? new Date(patientData!.date_of_birth)
              : null,
          },
          select: {
            id: true,
            patient_number: true,
            full_name: true,
            phone: true,
            gender: true,
            date_of_birth: true,
          },
        });
      }
    }

    // Get test details and prices
    // First check if these are clinic-specific tests or common tests
    const clinicTestIds = test_ids.filter((id) => !id.startsWith("common-"));
    const commonTestIds = test_ids.filter((id) => id.startsWith("common-"));

    const tests: TestInfo[] = [];
    let totalPrice = 0;

    // Fetch clinic-specific tests
    if (clinicTestIds.length > 0) {
      const clinicTests = await prisma.labTest.findMany({
        where: {
          id: { in: clinicTestIds },
          clinic_id: access.clinicId,
          is_active: true,
        },
        select: {
          id: true,
          name: true,
          short_name: true,
          price: true,
        },
      });

      for (const test of clinicTests) {
        const price = Number(test.price) || 0;
        tests.push({
          id: test.id,
          name: test.name,
          short_name: test.short_name,
          price,
        });
        totalPrice += price;
      }
    }

    // Map common tests
    if (commonTestIds.length > 0) {
      for (const testId of commonTestIds) {
        const commonTest = COMMON_LAB_TESTS.find((t) => t.id === testId);
        if (commonTest) {
          tests.push(commonTest);
          totalPrice += commonTest.price;
        }
      }
    }

    if (tests.length === 0) {
      return NextResponse.json(
        { error: "No valid tests found" },
        { status: 400 }
      );
    }

    // For walk-in orders, we need to find a doctor or use a default
    // In many clinics, walk-in lab tests are self-ordered
    // We'll use the first doctor in the clinic as a fallback
    let orderedById: string | null = null;

    // Try to find any doctor associated with the clinic
    const clinicDoctor = await prisma.clinicDoctor.findFirst({
      where: { clinic_id: access.clinicId },
      select: { doctor_id: true },
    });

    if (clinicDoctor) {
      orderedById = clinicDoctor.doctor_id;
    } else {
      // If no doctors, we cannot create a lab order (ordered_by is required)
      // For walk-in, we'll need to handle this - let's create a "LAB" professional entry
      // For now, return an error if no doctor is available
      return NextResponse.json(
        { error: "No doctor found in clinic. A doctor is required to create lab orders." },
        { status: 400 }
      );
    }

    // Generate order number
    const orderNumber = await generateLabOrderNumber(access.clinicId);

    // Create lab order with results in a transaction
    // For common tests, we need to first create the LabTest entries
    const result = await prisma.$transaction(async (tx) => {
      // For common tests, create LabTest entries if they don't exist
      const testIdMap: Record<string, string> = {}; // Maps original ID to actual DB ID

      for (const test of tests) {
        if (test.id.startsWith("common-")) {
          // Check if this common test already exists for this clinic
          let existingTest = await tx.labTest.findFirst({
            where: {
              clinic_id: access.clinicId,
              name: test.name,
            },
            select: { id: true },
          });

          if (!existingTest) {
            // Create the test for this clinic
            existingTest = await tx.labTest.create({
              data: {
                clinic_id: access.clinicId,
                name: test.name,
                short_name: test.short_name,
                price: test.price,
                is_active: true,
              },
              select: { id: true },
            });
          }

          testIdMap[test.id] = existingTest.id;
        } else {
          testIdMap[test.id] = test.id;
        }
      }

      // Create lab order
      const labOrder = await tx.labOrder.create({
        data: {
          order_number: orderNumber,
          priority: priority as LabOrderPriority,
          clinical_notes: notes || null,
          clinic_id: access.clinicId,
          patient_id: patient.id,
          ordered_by_id: orderedById!,
          results: {
            create: tests.map((test) => ({
              lab_test_id: testIdMap[test.id],
            })),
          },
        },
        include: {
          patient: {
            select: {
              id: true,
              patient_number: true,
              full_name: true,
              phone: true,
              gender: true,
              date_of_birth: true,
            },
          },
          ordered_by: {
            select: {
              id: true,
              full_name: true,
              registration_number: true,
            },
          },
          results: {
            include: {
              lab_test: {
                select: {
                  id: true,
                  name: true,
                  short_name: true,
                  price: true,
                },
              },
            },
          },
        },
      });

      // Create invoice
      const invoiceNumber = await generateInvoiceNumber(access.clinicId);
      const invoiceItems = tests.map((test) => ({
        service_id: testIdMap[test.id],
        name: test.name,
        quantity: 1,
        unit_price: test.price,
        amount: test.price,
      }));

      const invoice = await tx.invoice.create({
        data: {
          clinic_id: access.clinicId,
          patient_id: patient.id,
          created_by_id: access.userId,
          invoice_number: invoiceNumber,
          items: invoiceItems,
          subtotal: totalPrice,
          discount: 0,
          tax: 0,
          total: totalPrice,
          payment_mode: payment_mode as PaymentMode,
          payment_status: payment_status as PaymentStatus,
          notes: `Lab Order: ${orderNumber}`,
        },
      });

      return { labOrder, invoice };
    });

    // Build receipt data
    const receipt = {
      clinic_name: clinic.name,
      clinic_address: clinic.address || "",
      clinic_phone: clinic.phone || "",
      order_number: orderNumber,
      patient_name: patient.full_name,
      patient_phone: patient.phone || "",
      patient_number: patient.patient_number,
      tests: tests.map((t) => ({
        name: t.name,
        short_name: t.short_name,
        price: t.price,
      })),
      total: totalPrice,
      payment_status: payment_status,
      payment_mode: payment_mode,
      created_at: new Date().toISOString(),
      invoice_number: result.invoice.invoice_number,
    };

    return NextResponse.json(
      {
        order: result.labOrder,
        invoice: result.invoice,
        patient,
        receipt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating walk-in lab order:", error);
    return NextResponse.json(
      { error: "Failed to create walk-in lab order" },
      { status: 500 }
    );
  }
}
