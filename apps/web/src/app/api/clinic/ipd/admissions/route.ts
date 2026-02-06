import { NextRequest, NextResponse } from "next/server";
import { prisma, AdmissionStatus, BedStatus } from "@swasthya/database";
import { requireClinicPermission } from "@/lib/require-clinic-access";

// GET /api/clinic/ipd/admissions - Get all admissions (with filters)
export async function GET(request: NextRequest) {
  try {
    const access = await requireClinicPermission("ipd");
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: access.message },
        { status: access.reason === "unauthenticated" ? 401 : 403 }
      );
    }

    const status = request.nextUrl.searchParams.get("status");
    const patientId = request.nextUrl.searchParams.get("patient_id");

    const whereClause: Record<string, unknown> = { clinic_id: access.clinicId };

    if (status) {
      if (!Object.values(AdmissionStatus).includes(status as AdmissionStatus)) {
        return NextResponse.json({ error: "Invalid status filter" }, { status: 400 });
      }
      whereClause.status = status;
    }

    if (patientId) {
      whereClause.patient_id = patientId;
    }

    const admissions = await prisma.admission.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            id: true,
            full_name: true,
            patient_number: true,
            phone: true,
            gender: true,
            date_of_birth: true,
          },
        },
        bed: {
          select: {
            id: true,
            bed_number: true,
            ward: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
        admitting_doctor: {
          select: {
            id: true,
            full_name: true,
            type: true,
          },
        },
        attending_doctor: {
          select: {
            id: true,
            full_name: true,
            type: true,
          },
        },
      },
      orderBy: { admission_date: "desc" },
    });

    return NextResponse.json({ admissions });
  } catch (error) {
    console.error("Error fetching admissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch admissions" },
      { status: 500 }
    );
  }
}

// POST /api/clinic/ipd/admissions - Create a new admission
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

    const {
      patient_id,
      bed_id,
      admitting_doctor_id,
      attending_doctor_id,
      admission_diagnosis,
      chief_complaint,
      notes,
    } = body;

    // Validation
    if (!patient_id || !bed_id || !admitting_doctor_id) {
      return NextResponse.json(
        { error: "Patient, bed, and admitting doctor are required" },
        { status: 400 }
      );
    }

    // Verify patient belongs to clinic
    const patient = await prisma.patient.findFirst({
      where: {
        id: patient_id,
        clinic_id: access.clinicId,
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      );
    }

    // Verify bed belongs to clinic and is available
    const bed = await prisma.bed.findFirst({
      where: {
        id: bed_id,
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

    if (bed.status !== "AVAILABLE") {
      return NextResponse.json(
        { error: "Bed is not available for admission" },
        { status: 400 }
      );
    }

    // Verify admitting doctor is affiliated with clinic
    const admittingDoctor = await prisma.clinicDoctor.findFirst({
      where: {
        clinic_id: access.clinicId,
        doctor_id: admitting_doctor_id,
      },
    });

    if (!admittingDoctor) {
      return NextResponse.json(
        { error: "Admitting doctor is not affiliated with this clinic" },
        { status: 400 }
      );
    }

    // If attending doctor specified, verify affiliation
    if (attending_doctor_id && attending_doctor_id !== admitting_doctor_id) {
      const attendingDoctor = await prisma.clinicDoctor.findFirst({
        where: {
          clinic_id: access.clinicId,
          doctor_id: attending_doctor_id,
        },
      });

      if (!attendingDoctor) {
        return NextResponse.json(
          { error: "Attending doctor is not affiliated with this clinic" },
          { status: 400 }
        );
      }
    }

    // Check if patient already has an active admission
    const existingAdmission = await prisma.admission.findFirst({
      where: {
        patient_id,
        clinic_id: access.clinicId,
        status: "ADMITTED",
      },
    });

    if (existingAdmission) {
      return NextResponse.json(
        { error: "Patient is already admitted" },
        { status: 400 }
      );
    }

    // Generate admission number
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");

    const lastAdmission = await prisma.admission.findFirst({
      where: {
        clinic_id: access.clinicId,
        admission_number: {
          startsWith: `ADM-${year}${month}-`,
        },
      },
      orderBy: { created_at: "desc" },
    });

    let seq = 1;
    if (lastAdmission) {
      const lastSeq = parseInt(lastAdmission.admission_number.split("-")[2]);
      seq = lastSeq + 1;
    }
    const admissionNumber = `ADM-${year}${month}-${String(seq).padStart(4, "0")}`;

    // Create admission and update bed status in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const admission = await tx.admission.create({
        data: {
          admission_number: admissionNumber,
          clinic_id: access.clinicId,
          patient_id,
          bed_id,
          admitting_doctor_id,
          attending_doctor_id: attending_doctor_id || null,
          admission_diagnosis: admission_diagnosis?.trim() || null,
          chief_complaint: chief_complaint?.trim() || null,
          notes: notes?.trim() || null,
        },
        include: {
          patient: {
            select: {
              id: true,
              full_name: true,
              patient_number: true,
            },
          },
          bed: {
            select: {
              id: true,
              bed_number: true,
              ward: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          admitting_doctor: {
            select: {
              id: true,
              full_name: true,
            },
          },
        },
      });

      // Update bed status to OCCUPIED
      await tx.bed.update({
        where: { id: bed_id },
        data: { status: BedStatus.OCCUPIED },
      });

      return admission;
    });

    return NextResponse.json({ admission: result }, { status: 201 });
  } catch (error) {
    console.error("Error creating admission:", error);
    return NextResponse.json(
      { error: "Failed to create admission" },
      { status: 500 }
    );
  }
}
