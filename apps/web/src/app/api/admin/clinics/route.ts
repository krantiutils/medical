import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@swasthya/database";
import { authOptions } from "@/lib/auth";

export async function GET() {
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
    // Fetch unverified clinics with claimed_by user data
    const clinics = await prisma.clinic.findMany({
      where: {
        verified: false,
      },
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
    });

    return NextResponse.json({ clinics });
  } catch (error) {
    console.error("Error fetching pending clinics:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending clinics" },
      { status: 500 }
    );
  }
}
