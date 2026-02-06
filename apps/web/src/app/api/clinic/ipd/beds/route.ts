import { NextRequest, NextResponse } from "next/server";
import { prisma, BedStatus, WardType } from "@swasthya/database";
import { requireClinicPermission } from "@/lib/require-clinic-access";

// GET /api/clinic/ipd/beds?ward_id=X - Get all beds for a ward (or all wards)
export async function GET(request: NextRequest) {
  try {
    const access = await requireClinicPermission("ipd");
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: access.message },
        { status: access.reason === "unauthenticated" ? 401 : 403 }
      );
    }

    const wardId = request.nextUrl.searchParams.get("ward_id");

    const beds = await prisma.bed.findMany({
      where: {
        ward: {
          clinic_id: access.clinicId,
          ...(wardId ? { id: wardId } : {}),
        },
      },
      include: {
        ward: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        admissions: {
          where: {
            status: "ADMITTED",
          },
          take: 1,
          include: {
            patient: {
              select: {
                id: true,
                full_name: true,
                patient_number: true,
              },
            },
          },
        },
      },
      orderBy: [
        { ward: { name: "asc" } },
        { bed_number: "asc" },
      ],
    });

    const bedsWithPatient = beds.map((bed) => ({
      id: bed.id,
      bed_number: bed.bed_number,
      status: bed.status,
      type: bed.type,
      daily_rate: bed.daily_rate.toString(),
      features: bed.features,
      notes: bed.notes,
      is_active: bed.is_active,
      ward_id: bed.ward_id,
      ward: bed.ward,
      current_patient: bed.admissions[0]?.patient || null,
      current_admission_id: bed.admissions[0]?.id || null,
    }));

    return NextResponse.json({ beds: bedsWithPatient });
  } catch (error) {
    console.error("Error fetching beds:", error);
    return NextResponse.json(
      { error: "Failed to fetch beds" },
      { status: 500 }
    );
  }
}

// POST /api/clinic/ipd/beds - Create a new bed
export async function POST(request: NextRequest) {
  try {
    const access = await requireClinicPermission("ipd");
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: access.message },
        { status: access.reason === "unauthenticated" ? 401 : 403 }
      );
    }

    const body = await request.json();

    const { ward_id, bed_number, type, daily_rate, features, notes } = body;

    // Validation
    if (!ward_id || !bed_number) {
      return NextResponse.json(
        { error: "Ward ID and bed number are required" },
        { status: 400 }
      );
    }

    // Verify ward belongs to user's clinic
    const ward = await prisma.ward.findFirst({
      where: {
        id: ward_id,
        clinic_id: access.clinicId,
      },
    });

    if (!ward) {
      return NextResponse.json(
        { error: "Ward not found" },
        { status: 404 }
      );
    }

    // Check for duplicate bed number in ward
    const existingBed = await prisma.bed.findUnique({
      where: {
        ward_id_bed_number: {
          ward_id,
          bed_number: bed_number.trim(),
        },
      },
    });

    if (existingBed) {
      return NextResponse.json(
        { error: "A bed with this number already exists in this ward" },
        { status: 400 }
      );
    }

    if (type && !Object.values(WardType).includes(type)) {
      return NextResponse.json(
        { error: "Invalid bed type" },
        { status: 400 }
      );
    }

    const bed = await prisma.bed.create({
      data: {
        bed_number: bed_number.trim(),
        ward_id,
        type: type || null,
        daily_rate: daily_rate ? parseFloat(daily_rate) : 0,
        features: features || [],
        notes: notes?.trim() || null,
      },
      include: {
        ward: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    return NextResponse.json({ bed }, { status: 201 });
  } catch (error) {
    console.error("Error creating bed:", error);
    return NextResponse.json(
      { error: "Failed to create bed" },
      { status: 500 }
    );
  }
}

// DELETE /api/clinic/ipd/beds?id=X - Delete a bed
export async function DELETE(request: NextRequest) {
  try {
    const access = await requireClinicPermission("ipd");
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: access.message },
        { status: access.reason === "unauthenticated" ? 401 : 403 }
      );
    }

    const bedId = request.nextUrl.searchParams.get("id");

    if (!bedId) {
      return NextResponse.json(
        { error: "Bed ID is required" },
        { status: 400 }
      );
    }

    // Verify bed belongs to user's clinic
    const bed = await prisma.bed.findFirst({
      where: {
        id: bedId,
        ward: {
          clinic_id: access.clinicId,
        },
      },
    });

    if (!bed) {
      return NextResponse.json(
        { error: "Bed not found" },
        { status: 404 }
      );
    }

    // Check if bed is occupied
    if (bed.status === "OCCUPIED") {
      return NextResponse.json(
        { error: "Cannot delete an occupied bed. Please discharge the patient first." },
        { status: 400 }
      );
    }

    await prisma.bed.delete({
      where: { id: bedId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting bed:", error);
    return NextResponse.json(
      { error: "Failed to delete bed" },
      { status: 500 }
    );
  }
}

// PATCH /api/clinic/ipd/beds - Update a bed
export async function PATCH(request: NextRequest) {
  try {
    const access = await requireClinicPermission("ipd");
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: access.message },
        { status: access.reason === "unauthenticated" ? 401 : 403 }
      );
    }

    const body = await request.json();
    const { id, bed_number, type, daily_rate, features, notes, status, is_active } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Bed ID is required" },
        { status: 400 }
      );
    }

    // Verify bed belongs to user's clinic
    const existingBed = await prisma.bed.findFirst({
      where: {
        id,
        ward: {
          clinic_id: access.clinicId,
        },
      },
    });

    if (!existingBed) {
      return NextResponse.json(
        { error: "Bed not found" },
        { status: 404 }
      );
    }

    // Check for duplicate bed number if changing
    if (bed_number && bed_number.trim() !== existingBed.bed_number) {
      const duplicateBed = await prisma.bed.findUnique({
        where: {
          ward_id_bed_number: {
            ward_id: existingBed.ward_id,
            bed_number: bed_number.trim(),
          },
        },
      });

      if (duplicateBed) {
        return NextResponse.json(
          { error: "A bed with this number already exists in this ward" },
          { status: 400 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (bed_number !== undefined) updateData.bed_number = bed_number.trim();
    if (type !== undefined) {
      if (type && !Object.values(WardType).includes(type)) {
        return NextResponse.json({ error: "Invalid bed type" }, { status: 400 });
      }
      updateData.type = type || null;
    }
    if (daily_rate !== undefined) updateData.daily_rate = parseFloat(daily_rate) || 0;
    if (features !== undefined) updateData.features = features;
    if (notes !== undefined) updateData.notes = notes?.trim() || null;
    if (status !== undefined) {
      if (!Object.values(BedStatus).includes(status)) {
        return NextResponse.json({ error: "Invalid bed status" }, { status: 400 });
      }
      // Don't allow manually setting to OCCUPIED - must go through admission
      if (status === "OCCUPIED" && existingBed.status !== "OCCUPIED") {
        return NextResponse.json(
          { error: "Cannot manually set bed to occupied. Use admission process." },
          { status: 400 }
        );
      }
      updateData.status = status;
    }
    if (is_active !== undefined) updateData.is_active = Boolean(is_active);

    const bed = await prisma.bed.update({
      where: { id },
      data: updateData,
      include: {
        ward: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    return NextResponse.json({ bed });
  } catch (error) {
    console.error("Error updating bed:", error);
    return NextResponse.json(
      { error: "Failed to update bed" },
      { status: 500 }
    );
  }
}
