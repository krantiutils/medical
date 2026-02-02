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
    // Fetch pending verification requests with user and professional data
    const requests = await prisma.verificationRequest.findMany({
      where: {
        status: "PENDING",
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        professional: {
          select: {
            id: true,
            type: true,
            registration_number: true,
            full_name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        submitted_at: "asc", // Oldest first
      },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Error fetching pending claims:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending claims" },
      { status: 500 }
    );
  }
}
