import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@swasthya/database";

// Interface for prescription item
interface PrescriptionItem {
  drug_name: string;
  generic_name?: string;
  dosage: string;
  frequency: string;
  duration: string;
  duration_unit: string;
  quantity: number;
  instructions?: string;
  product_id?: string;
}

// GET /api/clinic/prescriptions - List prescriptions or get by clinical_note_id
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find user's verified clinic
    const clinic = await prisma.clinic.findFirst({
      where: {
        claimed_by_id: session.user.id,
        verified: true,
      },
    });

    if (!clinic) {
      return NextResponse.json(
        { error: "No verified clinic found", code: "NO_CLINIC" },
        { status: 404 }
      );
    }

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const clinicalNoteId = searchParams.get("clinical_note_id");
    const patientId = searchParams.get("patient_id");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Build where clause
    const where: Record<string, unknown> = {
      clinic_id: clinic.id,
    };

    if (clinicalNoteId) {
      where.clinical_note_id = clinicalNoteId;
    }

    if (patientId) {
      where.patient_id = patientId;
    }

    if (status) {
      where.status = status;
    }

    // Find prescriptions
    const [prescriptions, total] = await Promise.all([
      prisma.prescription.findMany({
        where,
        include: {
          patient: {
            select: {
              id: true,
              full_name: true,
              patient_number: true,
              date_of_birth: true,
              gender: true,
              phone: true,
            },
          },
          doctor: {
            select: {
              id: true,
              full_name: true,
              registration_number: true,
              degree: true,
            },
          },
          clinical_note: {
            select: {
              id: true,
              chief_complaint: true,
              diagnoses: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.prescription.count({ where }),
    ]);

    return NextResponse.json({
      prescriptions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error listing prescriptions:", error);
    return NextResponse.json(
      { error: "Failed to list prescriptions" },
      { status: 500 }
    );
  }
}

// POST /api/clinic/prescriptions - Create a new prescription
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find user's verified clinic
    const clinic = await prisma.clinic.findFirst({
      where: {
        claimed_by_id: session.user.id,
        verified: true,
      },
    });

    if (!clinic) {
      return NextResponse.json(
        { error: "No verified clinic found", code: "NO_CLINIC" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      patient_id,
      doctor_id,
      clinical_note_id,
      appointment_id,
      items,
      instructions,
    } = body;

    // Validate required fields
    if (!patient_id || !doctor_id) {
      return NextResponse.json(
        { error: "patient_id and doctor_id are required" },
        { status: 400 }
      );
    }

    // Verify patient belongs to clinic
    const patient = await prisma.patient.findFirst({
      where: {
        id: patient_id,
        clinic_id: clinic.id,
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: "Patient not found in your clinic" },
        { status: 404 }
      );
    }

    // Generate prescription number
    const year = new Date().getFullYear();
    const lastPrescription = await prisma.prescription.findFirst({
      where: {
        clinic_id: clinic.id,
        prescription_no: { startsWith: `RX-${year}-` },
      },
      orderBy: { prescription_no: "desc" },
    });

    let nextNumber = 1;
    if (lastPrescription) {
      const lastNumber = parseInt(
        lastPrescription.prescription_no.split("-")[2] || "0"
      );
      nextNumber = lastNumber + 1;
    }
    const prescription_no = `RX-${year}-${nextNumber.toString().padStart(4, "0")}`;

    // Create prescription
    const prescription = await prisma.prescription.create({
      data: {
        prescription_no,
        clinic_id: clinic.id,
        patient_id,
        doctor_id,
        clinical_note_id: clinical_note_id || null,
        appointment_id: appointment_id || null,
        items: items || [],
        instructions: instructions || null,
        status: "DRAFT",
      },
      include: {
        patient: {
          select: {
            id: true,
            full_name: true,
            patient_number: true,
            date_of_birth: true,
            gender: true,
          },
        },
        doctor: {
          select: {
            id: true,
            full_name: true,
            registration_number: true,
            degree: true,
          },
        },
      },
    });

    return NextResponse.json({ prescription }, { status: 201 });
  } catch (error) {
    console.error("Error creating prescription:", error);
    return NextResponse.json(
      { error: "Failed to create prescription" },
      { status: 500 }
    );
  }
}

// Helper function to validate prescription items
export function validatePrescriptionItems(
  items: PrescriptionItem[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!Array.isArray(items)) {
    return { valid: false, errors: ["Items must be an array"] };
  }

  items.forEach((item, index) => {
    if (!item.drug_name?.trim()) {
      errors.push(`Item ${index + 1}: drug_name is required`);
    }
    if (!item.dosage?.trim()) {
      errors.push(`Item ${index + 1}: dosage is required`);
    }
    if (!item.frequency?.trim()) {
      errors.push(`Item ${index + 1}: frequency is required`);
    }
    if (!item.duration?.trim()) {
      errors.push(`Item ${index + 1}: duration is required`);
    }
    if (item.quantity !== undefined && item.quantity < 0) {
      errors.push(`Item ${index + 1}: quantity must be positive`);
    }
  });

  return { valid: errors.length === 0, errors };
}
