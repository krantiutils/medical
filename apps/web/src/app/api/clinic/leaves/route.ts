import { NextRequest, NextResponse } from "next/server";
import { prisma, AppointmentStatus } from "@swasthya/database";
import { requireClinicPermission } from "@/lib/require-clinic-access";

// GET: Get leaves for a doctor in the clinic
export async function GET(request: NextRequest) {
  try {
    const access = await requireClinicPermission("leaves");
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: access.message },
        { status: access.reason === "unauthenticated" ? 401 : 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctorId");
    const upcoming = searchParams.get("upcoming") === "true";

    const whereClause: {
      clinic_id: string;
      doctor_id?: string;
      leave_date?: { gte: Date };
    } = {
      clinic_id: access.clinicId,
    };

    if (doctorId) {
      // Verify doctor is affiliated with this clinic
      const clinicDoctor = await prisma.clinicDoctor.findUnique({
        where: {
          clinic_id_doctor_id: {
            clinic_id: access.clinicId,
            doctor_id: doctorId,
          },
        },
      });

      if (!clinicDoctor) {
        return NextResponse.json(
          { error: "Doctor not affiliated with this clinic" },
          { status: 400 }
        );
      }

      whereClause.doctor_id = doctorId;
    }

    // Filter for upcoming leaves (today and future)
    if (upcoming) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      whereClause.leave_date = { gte: today };
    }

    const leaves = await prisma.doctorLeave.findMany({
      where: whereClause,
      include: {
        doctor: {
          select: {
            id: true,
            full_name: true,
            type: true,
            registration_number: true,
          },
        },
      },
      orderBy: {
        leave_date: "asc",
      },
    });

    return NextResponse.json({ leaves });
  } catch (error) {
    console.error("Error fetching leaves:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaves" },
      { status: 500 }
    );
  }
}

// POST: Create a new leave
export async function POST(request: NextRequest) {
  try {
    const access = await requireClinicPermission("leaves");
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: access.message },
        { status: access.reason === "unauthenticated" ? 401 : 403 }
      );
    }

    const body = await request.json();
    const { doctorId, leaveDate, startTime, endTime, reason, checkAffected } = body;

    if (!doctorId) {
      return NextResponse.json(
        { error: "Doctor ID is required" },
        { status: 400 }
      );
    }

    if (!leaveDate) {
      return NextResponse.json(
        { error: "Leave date is required" },
        { status: 400 }
      );
    }

    if (!reason || reason.trim() === "") {
      return NextResponse.json(
        { error: "Reason is required" },
        { status: 400 }
      );
    }

    // Validate time format if provided
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (startTime && !timeRegex.test(startTime)) {
      return NextResponse.json(
        { error: "Invalid start time format (use HH:MM)" },
        { status: 400 }
      );
    }
    if (endTime && !timeRegex.test(endTime)) {
      return NextResponse.json(
        { error: "Invalid end time format (use HH:MM)" },
        { status: 400 }
      );
    }

    // If one time is provided, both must be provided
    if ((startTime && !endTime) || (!startTime && endTime)) {
      return NextResponse.json(
        { error: "Both start time and end time must be provided for partial day leave" },
        { status: 400 }
      );
    }

    // Verify doctor is affiliated with this clinic
    const clinicDoctor = await prisma.clinicDoctor.findUnique({
      where: {
        clinic_id_doctor_id: {
          clinic_id: access.clinicId,
          doctor_id: doctorId,
        },
      },
    });

    if (!clinicDoctor) {
      return NextResponse.json(
        { error: "Doctor not affiliated with this clinic" },
        { status: 400 }
      );
    }

    // Parse the leave date
    const leaveDateObj = new Date(leaveDate);
    leaveDateObj.setHours(0, 0, 0, 0);

    // Check for affected appointments
    const affectedAppointments = await prisma.appointment.findMany({
      where: {
        clinic_id: access.clinicId,
        doctor_id: doctorId,
        appointment_date: leaveDateObj,
        status: {
          in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CHECKED_IN],
        },
        // If partial day leave, filter appointments by time
        ...(startTime && endTime
          ? {
              time_slot_start: { gte: startTime, lt: endTime },
            }
          : {}),
      },
      include: {
        patient: {
          select: {
            full_name: true,
          },
        },
      },
    });

    // If only checking affected appointments, return the count
    if (checkAffected) {
      return NextResponse.json({
        affectedCount: affectedAppointments.length,
        affectedAppointments: affectedAppointments.map((a) => ({
          id: a.id,
          timeSlot: `${a.time_slot_start} - ${a.time_slot_end}`,
          patientName: a.patient.full_name,
        })),
      });
    }

    // Create the leave
    const leave = await prisma.doctorLeave.create({
      data: {
        doctor_id: doctorId,
        clinic_id: access.clinicId,
        leave_date: leaveDateObj,
        start_time: startTime || null,
        end_time: endTime || null,
        reason: reason.trim(),
      },
      include: {
        doctor: {
          select: {
            id: true,
            full_name: true,
            type: true,
            registration_number: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      leave,
      affectedCount: affectedAppointments.length,
    });
  } catch (error) {
    console.error("Error creating leave:", error);
    return NextResponse.json(
      { error: "Failed to create leave" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a leave
export async function DELETE(request: NextRequest) {
  try {
    const access = await requireClinicPermission("leaves");
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: access.message },
        { status: access.reason === "unauthenticated" ? 401 : 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const leaveId = searchParams.get("id");

    if (!leaveId) {
      return NextResponse.json(
        { error: "Leave ID is required" },
        { status: 400 }
      );
    }

    // Find the leave and verify it belongs to this clinic
    const leave = await prisma.doctorLeave.findUnique({
      where: {
        id: leaveId,
      },
    });

    if (!leave) {
      return NextResponse.json(
        { error: "Leave not found" },
        { status: 404 }
      );
    }

    if (leave.clinic_id !== access.clinicId) {
      return NextResponse.json(
        { error: "Unauthorized to delete this leave" },
        { status: 403 }
      );
    }

    // Delete the leave
    await prisma.doctorLeave.delete({
      where: {
        id: leaveId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Leave deleted",
    });
  } catch (error) {
    console.error("Error deleting leave:", error);
    return NextResponse.json(
      { error: "Failed to delete leave" },
      { status: 500 }
    );
  }
}
