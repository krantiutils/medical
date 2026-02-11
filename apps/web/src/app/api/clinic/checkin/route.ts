import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@swasthya/database";
import { authOptions } from "@/lib/auth";

async function getClinicForUser(userId: string) {
  return prisma.clinic.findFirst({
    where: {
      claimed_by_id: userId,
      verified: true,
    },
    select: { id: true },
  });
}

// GET: List today's check-ins for the clinic (with doctor info)
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const clinic = await getClinicForUser(session.user.id);
    if (!clinic) {
      return NextResponse.json(
        { error: "No verified clinic found", code: "NO_CLINIC" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");

    // Default to today
    const date = dateParam ? new Date(dateParam) : new Date();
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const checkIns = await prisma.doctorCheckIn.findMany({
      where: {
        clinic_id: clinic.id,
        checked_in: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        doctor: {
          select: {
            id: true,
            full_name: true,
            full_name_ne: true,
            type: true,
            photo_url: true,
            specialties: true,
            degree: true,
          },
        },
      },
      orderBy: { checked_in: "desc" },
    });

    // Also get list of affiliated doctors for the clinic (to show who hasn't checked in)
    const affiliatedDoctors = await prisma.clinicDoctor.findMany({
      where: { clinic_id: clinic.id },
      include: {
        doctor: {
          select: {
            id: true,
            full_name: true,
            full_name_ne: true,
            type: true,
            photo_url: true,
            specialties: true,
            degree: true,
          },
        },
      },
    });

    return NextResponse.json({
      checkIns,
      affiliatedDoctors: affiliatedDoctors.map((cd) => ({
        ...cd.doctor,
        role: cd.role,
      })),
      date: startOfDay.toISOString(),
    });
  } catch (error) {
    console.error("Error fetching check-ins:", error);
    return NextResponse.json({ error: "Failed to fetch check-ins" }, { status: 500 });
  }
}

// POST: Check in a doctor
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const clinic = await getClinicForUser(session.user.id);
    if (!clinic) {
      return NextResponse.json(
        { error: "No verified clinic found", code: "NO_CLINIC" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { doctorId, notes } = body;

    if (!doctorId) {
      return NextResponse.json({ error: "doctorId is required" }, { status: 400 });
    }

    // Verify doctor is affiliated with the clinic
    const affiliation = await prisma.clinicDoctor.findUnique({
      where: {
        clinic_id_doctor_id: {
          clinic_id: clinic.id,
          doctor_id: doctorId,
        },
      },
    });

    if (!affiliation) {
      return NextResponse.json(
        { error: "Doctor is not affiliated with this clinic" },
        { status: 400 }
      );
    }

    // Check if already checked in today (and not checked out)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingCheckIn = await prisma.doctorCheckIn.findFirst({
      where: {
        doctor_id: doctorId,
        clinic_id: clinic.id,
        checked_in: { gte: today, lt: tomorrow },
        checked_out: null,
      },
    });

    if (existingCheckIn) {
      return NextResponse.json(
        { error: "Doctor is already checked in", checkIn: existingCheckIn },
        { status: 409 }
      );
    }

    const checkIn = await prisma.doctorCheckIn.create({
      data: {
        doctor_id: doctorId,
        clinic_id: clinic.id,
        notes: notes || null,
      },
      include: {
        doctor: {
          select: {
            id: true,
            full_name: true,
            full_name_ne: true,
            type: true,
            photo_url: true,
          },
        },
      },
    });

    return NextResponse.json({ checkIn }, { status: 201 });
  } catch (error) {
    console.error("Error creating check-in:", error);
    return NextResponse.json({ error: "Failed to check in doctor" }, { status: 500 });
  }
}

// PATCH: Check out a doctor (set checked_out timestamp)
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const clinic = await getClinicForUser(session.user.id);
    if (!clinic) {
      return NextResponse.json(
        { error: "No verified clinic found", code: "NO_CLINIC" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { checkInId } = body;

    if (!checkInId) {
      return NextResponse.json({ error: "checkInId is required" }, { status: 400 });
    }

    // Verify the check-in belongs to this clinic
    const checkIn = await prisma.doctorCheckIn.findFirst({
      where: {
        id: checkInId,
        clinic_id: clinic.id,
      },
    });

    if (!checkIn) {
      return NextResponse.json({ error: "Check-in not found" }, { status: 404 });
    }

    if (checkIn.checked_out) {
      return NextResponse.json({ error: "Already checked out" }, { status: 409 });
    }

    const updated = await prisma.doctorCheckIn.update({
      where: { id: checkInId },
      data: { checked_out: new Date() },
      include: {
        doctor: {
          select: {
            id: true,
            full_name: true,
            full_name_ne: true,
            type: true,
            photo_url: true,
          },
        },
      },
    });

    return NextResponse.json({ checkIn: updated });
  } catch (error) {
    console.error("Error checking out doctor:", error);
    return NextResponse.json({ error: "Failed to check out doctor" }, { status: 500 });
  }
}
