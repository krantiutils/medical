import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@swasthya/database";
import { authOptions } from "@/lib/auth";

// GET: List doctors affiliated with the user's clinic
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    // Find verified clinic owned by user
    const clinic = await prisma.clinic.findFirst({
      where: {
        claimed_by_id: session.user.id,
        verified: true,
      },
      select: {
        id: true,
      },
    });

    if (!clinic) {
      return NextResponse.json(
        { error: "No verified clinic found", code: "NO_CLINIC" },
        { status: 404 }
      );
    }

    // Get all doctors affiliated with this clinic
    const clinicDoctors = await prisma.clinicDoctor.findMany({
      where: {
        clinic_id: clinic.id,
      },
      include: {
        doctor: {
          select: {
            id: true,
            type: true,
            registration_number: true,
            full_name: true,
            full_name_ne: true,
            degree: true,
            address: true,
            specialties: true,
            slug: true,
            verified: true,
            photo_url: true,
          },
        },
      },
      orderBy: {
        joined_at: "desc",
      },
    });

    return NextResponse.json({
      doctors: clinicDoctors.map((cd) => ({
        clinicDoctorId: cd.id,
        role: cd.role,
        joinedAt: cd.joined_at,
        ...cd.doctor,
      })),
    });
  } catch (error) {
    console.error("Error fetching clinic doctors:", error);
    return NextResponse.json(
      { error: "Failed to fetch clinic doctors" },
      { status: 500 }
    );
  }
}

// POST: Add a doctor to the clinic
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { doctorId, role } = body;

    if (!doctorId) {
      return NextResponse.json(
        { error: "Doctor ID is required" },
        { status: 400 }
      );
    }

    // Find verified clinic owned by user
    const clinic = await prisma.clinic.findFirst({
      where: {
        claimed_by_id: session.user.id,
        verified: true,
      },
      select: {
        id: true,
      },
    });

    if (!clinic) {
      return NextResponse.json(
        { error: "No verified clinic found", code: "NO_CLINIC" },
        { status: 404 }
      );
    }

    // Check if doctor exists and is verified
    const doctor = await prisma.professional.findUnique({
      where: {
        id: doctorId,
      },
      select: {
        id: true,
        full_name: true,
        verified: true,
      },
    });

    if (!doctor) {
      return NextResponse.json(
        { error: "Doctor not found" },
        { status: 404 }
      );
    }

    if (!doctor.verified) {
      return NextResponse.json(
        { error: "Only verified professionals can be added to a clinic" },
        { status: 400 }
      );
    }

    // Check if doctor is already affiliated with this clinic
    const existing = await prisma.clinicDoctor.findUnique({
      where: {
        clinic_id_doctor_id: {
          clinic_id: clinic.id,
          doctor_id: doctorId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Doctor is already affiliated with this clinic" },
        { status: 400 }
      );
    }

    // Create the clinic-doctor relationship
    const clinicDoctor = await prisma.clinicDoctor.create({
      data: {
        clinic_id: clinic.id,
        doctor_id: doctorId,
        role: role || null,
      },
      include: {
        doctor: {
          select: {
            id: true,
            type: true,
            registration_number: true,
            full_name: true,
            full_name_ne: true,
            degree: true,
            address: true,
            specialties: true,
            slug: true,
            verified: true,
            photo_url: true,
          },
        },
      },
    });

    return NextResponse.json({
      clinicDoctorId: clinicDoctor.id,
      role: clinicDoctor.role,
      joinedAt: clinicDoctor.joined_at,
      ...clinicDoctor.doctor,
    });
  } catch (error) {
    console.error("Error adding doctor to clinic:", error);
    return NextResponse.json(
      { error: "Failed to add doctor to clinic" },
      { status: 500 }
    );
  }
}

// DELETE: Remove a doctor from the clinic
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const clinicDoctorId = searchParams.get("id");

    if (!clinicDoctorId) {
      return NextResponse.json(
        { error: "Clinic doctor ID is required" },
        { status: 400 }
      );
    }

    // Find verified clinic owned by user
    const clinic = await prisma.clinic.findFirst({
      where: {
        claimed_by_id: session.user.id,
        verified: true,
      },
      select: {
        id: true,
      },
    });

    if (!clinic) {
      return NextResponse.json(
        { error: "No verified clinic found", code: "NO_CLINIC" },
        { status: 404 }
      );
    }

    // Find the clinic-doctor relationship and verify it belongs to this clinic
    const clinicDoctor = await prisma.clinicDoctor.findUnique({
      where: {
        id: clinicDoctorId,
      },
    });

    if (!clinicDoctor) {
      return NextResponse.json(
        { error: "Clinic doctor relationship not found" },
        { status: 404 }
      );
    }

    if (clinicDoctor.clinic_id !== clinic.id) {
      return NextResponse.json(
        { error: "Unauthorized to remove this doctor" },
        { status: 403 }
      );
    }

    // Delete the relationship
    await prisma.clinicDoctor.delete({
      where: {
        id: clinicDoctorId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Doctor removed from clinic",
    });
  } catch (error) {
    console.error("Error removing doctor from clinic:", error);
    return NextResponse.json(
      { error: "Failed to remove doctor from clinic" },
      { status: 500 }
    );
  }
}
