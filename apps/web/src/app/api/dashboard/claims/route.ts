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

  try {
    // Fetch all verification requests for this user
    const requests = await prisma.verificationRequest.findMany({
      where: { user_id: session.user.id },
      include: {
        professional: {
          select: {
            id: true,
            type: true,
            registration_number: true,
            full_name: true,
            slug: true,
          },
        },
        reviewed_by: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { submitted_at: "desc" },
    });

    // Format the response
    const formattedRequests = requests.map((request) => ({
      id: request.id,
      status: request.status,
      government_id_url: request.government_id_url,
      certificate_url: request.certificate_url,
      admin_notes: request.admin_notes,
      submitted_at: request.submitted_at.toISOString(),
      reviewed_at: request.reviewed_at?.toISOString() || null,
      reviewed_by_name: request.reviewed_by?.name || null,
      professional: {
        id: request.professional.id,
        type: request.professional.type,
        registration_number: request.professional.registration_number,
        full_name: request.professional.full_name,
        slug: request.professional.slug,
      },
    }));

    return NextResponse.json({ requests: formattedRequests });
  } catch (error) {
    console.error("Error fetching user claims:", error);
    return NextResponse.json(
      { error: "Failed to fetch claims" },
      { status: 500 }
    );
  }
}
