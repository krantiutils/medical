import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@swasthya/database";

// GET /api/patient/lab-results - Get lab results for logged-in patient
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  try {
    // Find all patients linked to this user (via email or phone)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, phone: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find patients matching user's email or phone
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
        labOrders: [],
        pagination: { total: 0, page, limit, totalPages: 0 },
        message: "No patient records found for your account",
      });
    }

    const patientIds = patients.map((p) => p.id);

    // Fetch completed lab orders for these patients
    const [labOrders, total] = await Promise.all([
      prisma.labOrder.findMany({
        where: {
          patient_id: { in: patientIds },
          status: "COMPLETED",
        },
        include: {
          clinic: {
            select: {
              id: true,
              name: true,
              address: true,
              phone: true,
            },
          },
          ordered_by: {
            select: {
              id: true,
              full_name: true,
              registration_number: true,
              degree: true,
            },
          },
          results: {
            include: {
              lab_test: {
                select: {
                  id: true,
                  name: true,
                  short_name: true,
                  category: true,
                  normal_range: true,
                  unit: true,
                },
              },
            },
            orderBy: {
              lab_test: { name: "asc" },
            },
          },
        },
        orderBy: { completed_at: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.labOrder.count({
        where: {
          patient_id: { in: patientIds },
          status: "COMPLETED",
        },
      }),
    ]);

    return NextResponse.json({
      labOrders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching patient lab results:", error);
    return NextResponse.json(
      { error: "Failed to fetch lab results" },
      { status: 500 }
    );
  }
}
