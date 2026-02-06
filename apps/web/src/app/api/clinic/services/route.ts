import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@swasthya/database";
import { requireClinicPermission } from "@/lib/require-clinic-access";

// GET /api/clinic/services - Get all services for the user's clinic
export async function GET() {
  try {
    const access = await requireClinicPermission("services");
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: access.message },
        { status: access.reason === "unauthenticated" ? 401 : 403 }
      );
    }

    // Get all services for the clinic
    const services = await prisma.service.findMany({
      where: {
        clinic_id: access.clinicId,
      },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ services });
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/clinic/services - Create a new service
export async function POST(request: NextRequest) {
  try {
    const access = await requireClinicPermission("services");
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: access.message },
        { status: access.reason === "unauthenticated" ? 401 : 403 }
      );
    }

    const body = await request.json();
    const { name, description, price, category, is_active } = body;

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Service name is required" },
        { status: 400 }
      );
    }

    if (price === undefined || price === null || isNaN(Number(price)) || Number(price) < 0) {
      return NextResponse.json(
        { error: "Valid price is required" },
        { status: 400 }
      );
    }

    // Create the service
    const service = await prisma.service.create({
      data: {
        clinic_id: access.clinicId,
        name: name.trim(),
        description: description?.trim() || null,
        price: Number(price),
        category: category?.trim() || null,
        is_active: is_active !== false,
      },
    });

    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    console.error("Error creating service:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
