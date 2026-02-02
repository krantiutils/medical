import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@swasthya/database";
import { WardType } from "@swasthya/database";

// GET /api/clinic/ipd/wards - Get all wards for user's clinic
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find user's verified clinic
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        claimed_clinics: {
          where: { verified: true },
          take: 1,
        },
      },
    });

    if (!user?.claimed_clinics[0]) {
      return NextResponse.json(
        { error: "No verified clinic found", code: "NO_CLINIC" },
        { status: 404 }
      );
    }

    const clinicId = user.claimed_clinics[0].id;

    const wards = await prisma.ward.findMany({
      where: { clinic_id: clinicId },
      include: {
        _count: {
          select: { beds: true },
        },
        beds: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Calculate occupancy for each ward
    const wardsWithOccupancy = wards.map((ward) => {
      const occupiedBeds = ward.beds.filter((b) => b.status === "OCCUPIED").length;
      const availableBeds = ward.beds.filter((b) => b.status === "AVAILABLE").length;
      return {
        id: ward.id,
        name: ward.name,
        type: ward.type,
        floor: ward.floor,
        building: ward.building,
        capacity: ward.capacity,
        description: ward.description,
        is_active: ward.is_active,
        created_at: ward.created_at,
        totalBeds: ward._count.beds,
        occupiedBeds,
        availableBeds,
      };
    });

    return NextResponse.json({ wards: wardsWithOccupancy });
  } catch (error) {
    console.error("Error fetching wards:", error);
    return NextResponse.json(
      { error: "Failed to fetch wards" },
      { status: 500 }
    );
  }
}

// POST /api/clinic/ipd/wards - Create a new ward
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        claimed_clinics: {
          where: { verified: true },
          take: 1,
        },
      },
    });

    if (!user?.claimed_clinics[0]) {
      return NextResponse.json(
        { error: "No verified clinic found", code: "NO_CLINIC" },
        { status: 404 }
      );
    }

    const clinicId = user.claimed_clinics[0].id;
    const body = await request.json();

    const { name, type, floor, building, capacity, description } = body;

    // Validation
    if (!name || !type || !capacity) {
      return NextResponse.json(
        { error: "Name, type, and capacity are required" },
        { status: 400 }
      );
    }

    if (!Object.values(WardType).includes(type)) {
      return NextResponse.json(
        { error: "Invalid ward type" },
        { status: 400 }
      );
    }

    if (capacity < 1 || capacity > 100) {
      return NextResponse.json(
        { error: "Capacity must be between 1 and 100" },
        { status: 400 }
      );
    }

    // Check for duplicate ward name in clinic
    const existingWard = await prisma.ward.findUnique({
      where: {
        clinic_id_name: {
          clinic_id: clinicId,
          name: name.trim(),
        },
      },
    });

    if (existingWard) {
      return NextResponse.json(
        { error: "A ward with this name already exists" },
        { status: 400 }
      );
    }

    const ward = await prisma.ward.create({
      data: {
        name: name.trim(),
        type,
        floor: floor?.trim() || null,
        building: building?.trim() || null,
        capacity: parseInt(capacity),
        description: description?.trim() || null,
        clinic_id: clinicId,
      },
    });

    return NextResponse.json({ ward }, { status: 201 });
  } catch (error) {
    console.error("Error creating ward:", error);
    return NextResponse.json(
      { error: "Failed to create ward" },
      { status: 500 }
    );
  }
}

// DELETE /api/clinic/ipd/wards?id=X - Delete a ward
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        claimed_clinics: {
          where: { verified: true },
          take: 1,
        },
      },
    });

    if (!user?.claimed_clinics[0]) {
      return NextResponse.json(
        { error: "No verified clinic found" },
        { status: 404 }
      );
    }

    const clinicId = user.claimed_clinics[0].id;
    const wardId = request.nextUrl.searchParams.get("id");

    if (!wardId) {
      return NextResponse.json(
        { error: "Ward ID is required" },
        { status: 400 }
      );
    }

    // Verify ward belongs to user's clinic
    const ward = await prisma.ward.findFirst({
      where: {
        id: wardId,
        clinic_id: clinicId,
      },
      include: {
        beds: {
          where: {
            status: "OCCUPIED",
          },
        },
      },
    });

    if (!ward) {
      return NextResponse.json(
        { error: "Ward not found" },
        { status: 404 }
      );
    }

    // Check if any beds are occupied
    if (ward.beds.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete ward with occupied beds. Please discharge all patients first." },
        { status: 400 }
      );
    }

    await prisma.ward.delete({
      where: { id: wardId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting ward:", error);
    return NextResponse.json(
      { error: "Failed to delete ward" },
      { status: 500 }
    );
  }
}

// PATCH /api/clinic/ipd/wards - Update a ward
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        claimed_clinics: {
          where: { verified: true },
          take: 1,
        },
      },
    });

    if (!user?.claimed_clinics[0]) {
      return NextResponse.json(
        { error: "No verified clinic found" },
        { status: 404 }
      );
    }

    const clinicId = user.claimed_clinics[0].id;
    const body = await request.json();
    const { id, name, type, floor, building, capacity, description, is_active } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Ward ID is required" },
        { status: 400 }
      );
    }

    // Verify ward belongs to user's clinic
    const existingWard = await prisma.ward.findFirst({
      where: {
        id,
        clinic_id: clinicId,
      },
    });

    if (!existingWard) {
      return NextResponse.json(
        { error: "Ward not found" },
        { status: 404 }
      );
    }

    // Check for duplicate name if name is being changed
    if (name && name.trim() !== existingWard.name) {
      const duplicateWard = await prisma.ward.findUnique({
        where: {
          clinic_id_name: {
            clinic_id: clinicId,
            name: name.trim(),
          },
        },
      });

      if (duplicateWard) {
        return NextResponse.json(
          { error: "A ward with this name already exists" },
          { status: 400 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (type !== undefined) {
      if (!Object.values(WardType).includes(type)) {
        return NextResponse.json({ error: "Invalid ward type" }, { status: 400 });
      }
      updateData.type = type;
    }
    if (floor !== undefined) updateData.floor = floor?.trim() || null;
    if (building !== undefined) updateData.building = building?.trim() || null;
    if (capacity !== undefined) {
      if (capacity < 1 || capacity > 100) {
        return NextResponse.json({ error: "Capacity must be between 1 and 100" }, { status: 400 });
      }
      updateData.capacity = parseInt(capacity);
    }
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (is_active !== undefined) updateData.is_active = Boolean(is_active);

    const ward = await prisma.ward.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ ward });
  } catch (error) {
    console.error("Error updating ward:", error);
    return NextResponse.json(
      { error: "Failed to update ward" },
      { status: 500 }
    );
  }
}
