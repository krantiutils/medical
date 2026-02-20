import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@swasthya/database";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  // Check authentication
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check admin role
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));

    const where = { verified: false };

    // Fetch unverified clinics with claimed_by user data
    const [clinics, total] = await Promise.all([
      prisma.clinic.findMany({
        where,
        include: {
          claimed_by: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: {
          created_at: "asc", // Oldest first
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.clinic.count({ where }),
    ]);

    return NextResponse.json({
      clinics,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching pending clinics:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending clinics" },
      { status: 500 }
    );
  }
}
