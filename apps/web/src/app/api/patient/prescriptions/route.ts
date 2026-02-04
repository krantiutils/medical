import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@swasthya/database";

// GET /api/patient/prescriptions - Get prescriptions for logged-in patient
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const status = searchParams.get("status"); // optional: DRAFT, ISSUED, DISPENSED, CANCELLED

  const validStatuses = ["DRAFT", "ISSUED", "DISPENSED", "CANCELLED"];
  if (status && !validStatuses.includes(status)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, phone: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const patients = await prisma.patient.findMany({
      where: {
        OR: [
          { email: user.email },
          ...(user.phone ? [{ phone: user.phone }] : []),
        ],
      },
      select: { id: true },
    });

    if (patients.length === 0) {
      return NextResponse.json({
        prescriptions: [],
        pagination: { total: 0, page, limit, totalPages: 0 },
        message: "No patient records found for your account",
      });
    }

    const patientIds = patients.map((p) => p.id);

    const whereClause = {
      patient_id: { in: patientIds },
      ...(status ? { status: status as "DRAFT" | "ISSUED" | "DISPENSED" | "CANCELLED" } : {}),
    };

    const [prescriptions, total] = await Promise.all([
      prisma.prescription.findMany({
        where: whereClause,
        include: {
          doctor: {
            select: {
              id: true,
              full_name: true,
              degree: true,
              specialties: true,
              registration_number: true,
            },
          },
          clinic: {
            select: {
              id: true,
              name: true,
              address: true,
              phone: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.prescription.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      prescriptions: prescriptions.map((rx) => ({
        id: rx.id,
        prescription_no: rx.prescription_no,
        items: rx.items,
        instructions: rx.instructions,
        status: rx.status,
        issued_at: rx.issued_at,
        valid_until: rx.valid_until,
        created_at: rx.created_at,
        doctor: rx.doctor,
        clinic: rx.clinic,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching patient prescriptions:", error);
    return NextResponse.json(
      { error: "Failed to fetch prescriptions" },
      { status: 500 }
    );
  }
}
