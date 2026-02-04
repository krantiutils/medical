import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@swasthya/database";

/**
 * GET /api/clinic/patients/[id]
 *
 * Get a single patient's details for the authenticated user's clinic.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clinic = await prisma.clinic.findFirst({
      where: {
        claimed_by_id: session.user.id,
        verified: true,
      },
      select: { id: true },
    });

    if (!clinic) {
      return NextResponse.json(
        { error: "No verified clinic found", code: "NO_CLINIC" },
        { status: 404 }
      );
    }

    const patient = await prisma.patient.findFirst({
      where: {
        id,
        clinic_id: clinic.id,
      },
      include: {
        _count: {
          select: {
            appointments: true,
            invoices: true,
            clinical_notes: true,
            prescriptions: true,
            lab_orders: true,
            admissions: true,
          },
        },
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ patient });
  } catch (error) {
    console.error("Error fetching patient:", error);
    return NextResponse.json(
      { error: "Failed to fetch patient" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/clinic/patients/[id]
 *
 * Update a patient's details.
 *
 * Request body (all optional):
 * - full_name, phone, email, date_of_birth, gender, blood_group,
 *   address, emergency_contact, allergies
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clinic = await prisma.clinic.findFirst({
      where: {
        claimed_by_id: session.user.id,
        verified: true,
      },
      select: { id: true },
    });

    if (!clinic) {
      return NextResponse.json(
        { error: "No verified clinic found", code: "NO_CLINIC" },
        { status: 404 }
      );
    }

    // Verify patient belongs to this clinic
    const existingPatient = await prisma.patient.findFirst({
      where: {
        id,
        clinic_id: clinic.id,
      },
      select: { id: true },
    });

    if (!existingPatient) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      full_name,
      phone,
      email,
      date_of_birth,
      gender,
      blood_group,
      address,
      emergency_contact,
      allergies,
    } = body;

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (full_name !== undefined) {
      if (!full_name || !full_name.trim()) {
        return NextResponse.json(
          { error: "Patient name cannot be empty" },
          { status: 400 }
        );
      }
      updateData.full_name = full_name.trim();
    }

    if (phone !== undefined) {
      if (phone) {
        const phoneRegex = /^(98|97)\d{8}$/;
        const cleanPhone = phone.replace(/\s/g, "");
        if (!phoneRegex.test(cleanPhone)) {
          return NextResponse.json(
            { error: "Invalid phone number format. Must be 10 digits starting with 98 or 97." },
            { status: 400 }
          );
        }

        // Check for duplicate phone in same clinic (excluding current patient)
        const duplicatePatient = await prisma.patient.findFirst({
          where: {
            clinic_id: clinic.id,
            phone: cleanPhone,
            id: { not: id },
          },
          select: { id: true, full_name: true, patient_number: true },
        });

        if (duplicatePatient) {
          return NextResponse.json(
            {
              error: `A patient with this phone number already exists: ${duplicatePatient.full_name} (${duplicatePatient.patient_number})`,
              code: "DUPLICATE_PHONE",
            },
            { status: 409 }
          );
        }

        updateData.phone = cleanPhone;
      } else {
        updateData.phone = null;
      }
    }

    if (email !== undefined) {
      updateData.email = email?.trim() || null;
    }

    if (date_of_birth !== undefined) {
      updateData.date_of_birth = date_of_birth ? new Date(date_of_birth) : null;
    }

    if (gender !== undefined) {
      const validGenders = ["Male", "Female", "Other"];
      if (gender && !validGenders.includes(gender)) {
        return NextResponse.json(
          { error: "Invalid gender. Must be Male, Female, or Other." },
          { status: 400 }
        );
      }
      updateData.gender = gender || null;
    }

    if (blood_group !== undefined) {
      const validBloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
      if (blood_group && !validBloodGroups.includes(blood_group)) {
        return NextResponse.json(
          { error: "Invalid blood group." },
          { status: 400 }
        );
      }
      updateData.blood_group = blood_group || null;
    }

    if (address !== undefined) {
      updateData.address = address?.trim() || null;
    }

    if (emergency_contact !== undefined) {
      updateData.emergency_contact = emergency_contact || null;
    }

    if (allergies !== undefined) {
      updateData.allergies = allergies || [];
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const patient = await prisma.patient.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        patient_number: true,
        full_name: true,
        phone: true,
        email: true,
        date_of_birth: true,
        gender: true,
        blood_group: true,
        address: true,
        emergency_contact: true,
        allergies: true,
        created_at: true,
        updated_at: true,
      },
    });

    return NextResponse.json({ patient });
  } catch (error) {
    console.error("Error updating patient:", error);
    return NextResponse.json(
      { error: "Failed to update patient" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/clinic/patients/[id]
 *
 * Delete a patient from the authenticated user's clinic.
 * Only deletes if the patient has no appointments, invoices, or admissions.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clinic = await prisma.clinic.findFirst({
      where: {
        claimed_by_id: session.user.id,
        verified: true,
      },
      select: { id: true },
    });

    if (!clinic) {
      return NextResponse.json(
        { error: "No verified clinic found", code: "NO_CLINIC" },
        { status: 404 }
      );
    }

    const patient = await prisma.patient.findFirst({
      where: {
        id,
        clinic_id: clinic.id,
      },
      include: {
        _count: {
          select: {
            appointments: true,
            invoices: true,
            admissions: true,
          },
        },
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      );
    }

    // Prevent deletion of patients with records
    const totalRecords =
      patient._count.appointments +
      patient._count.invoices +
      patient._count.admissions;

    if (totalRecords > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete patient with existing records. This patient has appointments, invoices, or admissions.",
          code: "HAS_RECORDS",
          counts: patient._count,
        },
        { status: 409 }
      );
    }

    await prisma.patient.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting patient:", error);
    return NextResponse.json(
      { error: "Failed to delete patient" },
      { status: 500 }
    );
  }
}
