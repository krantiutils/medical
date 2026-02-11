import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@swasthya/database";

// GET /api/patient/medical-records - Get medical records for the logged-in patient
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") || "20"))
  );
  const recordType = searchParams.get("type");

  const validTypes = [
    "LAB_REPORT",
    "PRESCRIPTION",
    "IMAGING",
    "DISCHARGE_SUMMARY",
    "OTHER",
  ];

  try {
    // Find all patients linked to this user (via email or phone)
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
        records: [],
        pagination: { total: 0, page, limit, totalPages: 0 },
        message: "No patient records found for your account",
      });
    }

    const patientIds = patients.map((p) => p.id);

    const where: Record<string, unknown> = {
      patient_id: { in: patientIds },
    };

    if (recordType && validTypes.includes(recordType)) {
      where.record_type = recordType;
    }

    const [records, total] = await Promise.all([
      prisma.medicalRecord.findMany({
        where,
        include: {
          clinic: {
            select: {
              id: true,
              name: true,
              address: true,
              phone: true,
            },
          },
        },
        orderBy: { uploaded_at: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.medicalRecord.count({ where }),
    ]);

    return NextResponse.json({
      records,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching patient medical records:", error);
    return NextResponse.json(
      { error: "Failed to fetch medical records" },
      { status: 500 }
    );
  }
}
