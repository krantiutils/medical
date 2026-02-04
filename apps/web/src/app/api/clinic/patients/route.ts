import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@swasthya/database";

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
 * GET /api/clinic/patients
 *
 * List patients for the authenticated user's clinic with pagination and search.
 *
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - q: Search query (name, phone, patient number)
 * - sort: Sort field (default: created_at)
 * - order: Sort order (asc/desc, default: desc)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const query = searchParams.get("q")?.trim() || "";
    const sort = searchParams.get("sort") || "created_at";
    const order = searchParams.get("order") === "asc" ? "asc" : "desc";

    // Find verified clinic owned by user
    const clinic = await prisma.clinic.findFirst({
      where: {
        claimed_by_id: session.user.id,
        verified: true,
      },
      select: { id: true },
    });

    if (!clinic) {
      return NextResponse.json(
        { error: "No verified clinic found", code: "NO_CLINIC" },
        { status: 404 }
      );
    }

    // Build where clause
    const where: Record<string, unknown> = {
      clinic_id: clinic.id,
    };

    if (query.length >= 2) {
      where.OR = [
        { full_name: { contains: query, mode: "insensitive" } },
        { phone: { contains: query } },
        { patient_number: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ];
    }

    // Validate sort field
    const allowedSortFields = ["created_at", "full_name", "patient_number", "updated_at"];
    const sortField = allowedSortFields.includes(sort) ? sort : "created_at";

    // Fetch patients with count
    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        select: {
          id: true,
          patient_number: true,
          full_name: true,
          phone: true,
          email: true,
          gender: true,
          date_of_birth: true,
          blood_group: true,
          address: true,
          photo_url: true,
          created_at: true,
          _count: {
            select: {
              appointments: true,
              invoices: true,
            },
          },
        },
        orderBy: { [sortField]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.patient.count({ where }),
    ]);

    return NextResponse.json({
      patients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error listing patients:", error);
    return NextResponse.json(
      { error: "Failed to list patients" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/clinic/patients
 *
 * Create a new patient for the authenticated user's clinic.
 *
 * Request body:
 * - full_name: Required - Patient's full name
 * - phone: Optional - Phone number (Nepali format: 98/97 prefix, 10 digits)
 * - email: Optional - Email address
 * - date_of_birth: Optional - Date of birth (ISO string)
 * - gender: Optional - Gender (Male/Female/Other)
 * - blood_group: Optional - Blood group
 * - address: Optional - Address
 * - emergency_contact: Optional - Emergency contact JSON
 * - allergies: Optional - Array of allergy strings
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      full_name,
      phone,
      email,
      date_of_birth,
      gender,
      blood_group,
      address,
      emergency_contact,
      allergies,
    } = body;

    // Validate required fields
    if (!full_name || !full_name.trim()) {
      return NextResponse.json(
        { error: "Patient name is required" },
        { status: 400 }
      );
    }

    // Find verified clinic owned by user
    const clinic = await prisma.clinic.findFirst({
      where: {
        claimed_by_id: session.user.id,
        verified: true,
      },
      select: { id: true },
    });

    if (!clinic) {
      return NextResponse.json(
        { error: "No verified clinic found", code: "NO_CLINIC" },
        { status: 404 }
      );
    }

    // Validate and clean phone if provided
    let cleanPhone: string | null = null;
    if (phone) {
      const phoneRegex = /^(98|97)\d{8}$/;
      const cleaned = (phone as string).replace(/\s/g, "");
      cleanPhone = cleaned;
      if (!phoneRegex.test(cleaned)) {
        return NextResponse.json(
          { error: "Invalid phone number format. Must be 10 digits starting with 98 or 97." },
          { status: 400 }
        );
      }

      // Check for duplicate phone in same clinic
      const existingPatient = await prisma.patient.findFirst({
        where: {
          clinic_id: clinic.id,
          phone: cleanPhone,
        },
        select: { id: true, full_name: true, patient_number: true },
      });

      if (existingPatient) {
        return NextResponse.json(
          {
            error: `A patient with this phone number already exists: ${existingPatient.full_name} (${existingPatient.patient_number})`,
            code: "DUPLICATE_PHONE",
            existingPatient,
          },
          { status: 409 }
        );
      }
    }

    // Validate gender if provided
    const validGenders = ["Male", "Female", "Other"];
    if (gender && !validGenders.includes(gender)) {
      return NextResponse.json(
        { error: "Invalid gender. Must be Male, Female, or Other." },
        { status: 400 }
      );
    }

    // Validate blood group if provided
    const validBloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
    if (blood_group && !validBloodGroups.includes(blood_group)) {
      return NextResponse.json(
        { error: "Invalid blood group." },
        { status: 400 }
      );
    }

    // Generate patient number
    const patientNumber = await generatePatientNumber(clinic.id);

    // Create patient
    const patient = await prisma.patient.create({
      data: {
        clinic_id: clinic.id,
        patient_number: patientNumber,
        full_name: full_name.trim(),
        phone: cleanPhone,
        email: email?.trim() || null,
        date_of_birth: date_of_birth ? new Date(date_of_birth) : null,
        gender: gender || null,
        blood_group: blood_group || null,
        address: address?.trim() || null,
        emergency_contact: emergency_contact || null,
        allergies: allergies || [],
      },
      select: {
        id: true,
        patient_number: true,
        full_name: true,
        phone: true,
        email: true,
        date_of_birth: true,
        gender: true,
        blood_group: true,
        address: true,
        emergency_contact: true,
        allergies: true,
        created_at: true,
      },
    });

    return NextResponse.json({ patient }, { status: 201 });
  } catch (error) {
    console.error("Error creating patient:", error);
    return NextResponse.json(
      { error: "Failed to create patient" },
      { status: 500 }
    );
  }
}
