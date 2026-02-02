import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@swasthya/database";

/**
 * GET /api/clinic/[clinicId]/booking-info
 *
 * Get clinic and doctor information for the booking page.
 * Accepts either clinic ID or slug as the [clinicId] parameter.
 *
 * Query params:
 * - doctor_id: Required - The ID of the doctor
 *
 * Returns clinic and doctor basic info for display.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clinicId: string }> }
) {
  try {
    const { clinicId: clinicIdOrSlug } = await params;
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctor_id");

    // Validate required parameters
    if (!doctorId) {
      return NextResponse.json(
        { error: "doctor_id query parameter is required" },
        { status: 400 }
      );
    }

    // Try to find clinic by ID first, then by slug
    let clinic = await prisma.clinic.findUnique({
      where: { id: clinicIdOrSlug },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        verified: true,
      },
    });

    // If not found by ID, try by slug
    if (!clinic) {
      clinic = await prisma.clinic.findFirst({
        where: { slug: clinicIdOrSlug },
        select: {
          id: true,
          name: true,
          address: true,
          phone: true,
          verified: true,
        },
      });
    }

    if (!clinic) {
      return NextResponse.json(
        { error: "Clinic not found" },
        { status: 404 }
      );
    }

    if (!clinic.verified) {
      return NextResponse.json(
        { error: "Clinic is not verified" },
        { status: 400 }
      );
    }

    // Verify doctor is affiliated with this clinic
    const clinicDoctor = await prisma.clinicDoctor.findFirst({
      where: {
        clinic_id: clinic.id,
        doctor_id: doctorId,
      },
      include: {
        doctor: {
          select: {
            id: true,
            full_name: true,
            type: true,
            degree: true,
            specialties: true,
          },
        },
      },
    });

    if (!clinicDoctor) {
      return NextResponse.json(
        { error: "Doctor is not affiliated with this clinic" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      clinic: {
        id: clinic.id,
        name: clinic.name,
        address: clinic.address,
        phone: clinic.phone,
      },
      doctor: {
        id: clinicDoctor.doctor.id,
        full_name: clinicDoctor.doctor.full_name,
        type: clinicDoctor.doctor.type,
        degree: clinicDoctor.doctor.degree,
        specialties: clinicDoctor.doctor.specialties,
      },
    });
  } catch (error) {
    console.error("Error fetching booking info:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking info" },
      { status: 500 }
    );
  }
}
