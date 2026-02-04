import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@swasthya/database";

// GET /api/patient/appointments - Get appointments for logged-in patient
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const filter = searchParams.get("filter"); // "upcoming" | "past" | null

  if (filter && filter !== "upcoming" && filter !== "past") {
    return NextResponse.json(
      { error: "Invalid filter. Must be 'upcoming' or 'past'." },
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
        appointments: [],
        pagination: { total: 0, page, limit, totalPages: 0 },
        message: "No patient records found for your account",
      });
    }

    const patientIds = patients.map((p) => p.id);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Build where clause based on filter
    const baseWhere = { patient_id: { in: patientIds } };
    let whereClause;

    if (filter === "upcoming") {
      whereClause = {
        ...baseWhere,
        appointment_date: { gte: todayStart },
        status: { in: ["SCHEDULED" as const, "CHECKED_IN" as const, "IN_PROGRESS" as const] },
      };
    } else if (filter === "past") {
      whereClause = {
        ...baseWhere,
        OR: [
          { appointment_date: { lt: todayStart } },
          { status: { in: ["COMPLETED" as const, "CANCELLED" as const, "NO_SHOW" as const] } },
        ],
      };
    } else {
      whereClause = baseWhere;
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where: whereClause,
        include: {
          doctor: {
            select: {
              id: true,
              full_name: true,
              degree: true,
              specialties: true,
              photo_url: true,
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
        orderBy: { appointment_date: filter === "past" ? "desc" : "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.appointment.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      appointments: appointments.map((apt) => ({
        id: apt.id,
        appointment_date: apt.appointment_date,
        time_slot_start: apt.time_slot_start,
        time_slot_end: apt.time_slot_end,
        status: apt.status,
        type: apt.type,
        chief_complaint: apt.chief_complaint,
        token_number: apt.token_number,
        source: apt.source,
        created_at: apt.created_at,
        doctor: apt.doctor,
        clinic: apt.clinic,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching patient appointments:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointments" },
      { status: 500 }
    );
  }
}
