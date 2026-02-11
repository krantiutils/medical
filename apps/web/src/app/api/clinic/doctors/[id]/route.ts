import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma, ProfessionalType } from "@swasthya/database";
import { authOptions } from "@/lib/auth";

// PATCH: Update a clinic-created (unverified) doctor's info
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const { id: doctorId } = await params;
    const body = await request.json();

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

    // Verify the doctor is affiliated with this clinic
    const clinicDoctor = await prisma.clinicDoctor.findUnique({
      where: {
        clinic_id_doctor_id: {
          clinic_id: clinic.id,
          doctor_id: doctorId,
        },
      },
    });

    if (!clinicDoctor) {
      return NextResponse.json(
        { error: "Doctor is not affiliated with your clinic" },
        { status: 403 }
      );
    }

    // Only allow editing unverified (clinic-created) doctors
    const doctor = await prisma.professional.findUnique({
      where: { id: doctorId },
      select: { id: true, verified: true, type: true, registration_number: true },
    });

    if (!doctor) {
      return NextResponse.json(
        { error: "Doctor not found" },
        { status: 404 }
      );
    }

    if (doctor.verified) {
      return NextResponse.json(
        { error: "Cannot edit verified professionals. Only clinic-created doctors can be updated." },
        { status: 403 }
      );
    }

    // Build update data — only allowed fields
    const updateData: Record<string, unknown> = {};

    if (body.full_name !== undefined && body.full_name.trim()) {
      updateData.full_name = body.full_name.trim();
    }
    if (body.full_name_ne !== undefined) {
      updateData.full_name_ne = body.full_name_ne?.trim() || null;
    }
    if (body.degree !== undefined) {
      updateData.degree = body.degree?.trim() || null;
    }
    if (body.address !== undefined) {
      updateData.address = body.address?.trim() || null;
    }
    if (body.specialties !== undefined && Array.isArray(body.specialties)) {
      updateData.specialties = body.specialties;
    }
    if (body.type !== undefined && ["DOCTOR", "DENTIST", "PHARMACIST"].includes(body.type)) {
      // If changing type, check unique constraint on type+registration_number
      if (body.type !== doctor.type) {
        const conflict = await prisma.professional.findUnique({
          where: {
            type_registration_number: {
              type: body.type,
              registration_number: doctor.registration_number,
            },
          },
          select: { id: true },
        });
        if (conflict && conflict.id !== doctorId) {
          return NextResponse.json(
            { error: "A professional with this type and registration number already exists" },
            { status: 409 }
          );
        }
      }
      updateData.type = body.type;
    }
    if (body.registration_number !== undefined && body.registration_number.trim()) {
      const newRegNum = body.registration_number.trim();
      const currentType = (updateData.type as ProfessionalType) || doctor.type;
      if (newRegNum !== doctor.registration_number) {
        const conflict = await prisma.professional.findUnique({
          where: {
            type_registration_number: {
              type: currentType,
              registration_number: newRegNum,
            },
          },
          select: { id: true },
        });
        if (conflict && conflict.id !== doctorId) {
          return NextResponse.json(
            { error: "A professional with this type and registration number already exists" },
            { status: 409 }
          );
        }
      }
      updateData.registration_number = newRegNum;
    }

    // Also allow updating the role on the ClinicDoctor record
    if (body.role !== undefined) {
      await prisma.clinicDoctor.update({
        where: {
          clinic_id_doctor_id: {
            clinic_id: clinic.id,
            doctor_id: doctorId,
          },
        },
        data: { role: body.role || null },
      });
    }

    if (Object.keys(updateData).length === 0 && body.role === undefined) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const updated = Object.keys(updateData).length > 0
      ? await prisma.professional.update({
          where: { id: doctorId },
          data: updateData,
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
        })
      : await prisma.professional.findUnique({
          where: { id: doctorId },
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
        });

    // Get the updated ClinicDoctor for the role
    const updatedCd = await prisma.clinicDoctor.findUnique({
      where: {
        clinic_id_doctor_id: {
          clinic_id: clinic.id,
          doctor_id: doctorId,
        },
      },
    });

    return NextResponse.json({
      clinicDoctorId: updatedCd?.id,
      role: updatedCd?.role,
      joinedAt: updatedCd?.joined_at,
      ...updated,
    });
  } catch (error) {
    console.error("Error updating doctor:", error);
    return NextResponse.json(
      { error: "Failed to update doctor" },
      { status: 500 }
    );
  }
}
