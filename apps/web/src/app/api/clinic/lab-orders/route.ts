import { NextRequest, NextResponse } from "next/server";
import { prisma, LabOrderStatus, LabOrderPriority } from "@swasthya/database";
import { requireClinicPermission } from "@/lib/require-clinic-access";

// GET /api/clinic/lab-orders - List lab orders for a clinic
export async function GET(request: NextRequest) {
  const access = await requireClinicPermission("lab:view");
  if (!access.hasAccess) {
    if (access.reason === "no_clinic") {
      return NextResponse.json(
        { error: access.message, code: "NO_CLINIC" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: access.message },
      { status: access.reason === "unauthenticated" ? 401 : 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const patientId = searchParams.get("patient_id");
  const clinicalNoteId = searchParams.get("clinical_note_id");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  // Build filters
  const where: Record<string, unknown> = {
    clinic_id: access.clinicId,
  };

  if (status) {
    where.status = status as LabOrderStatus;
  }

  if (patientId) {
    where.patient_id = patientId;
  }

  if (clinicalNoteId) {
    where.clinical_note_id = clinicalNoteId;
  }

  try {
    const [labOrders, total] = await Promise.all([
      prisma.labOrder.findMany({
        where,
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
          ordered_by: {
            select: {
              id: true,
              full_name: true,
              registration_number: true,
            },
          },
          results: {
            include: {
              lab_test: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.labOrder.count({ where }),
    ]);

    return NextResponse.json({
      labOrders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching lab orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch lab orders" },
      { status: 500 }
    );
  }
}

// POST /api/clinic/lab-orders - Create a new lab order
export async function POST(request: NextRequest) {
  const access = await requireClinicPermission("lab");
  if (!access.hasAccess) {
    if (access.reason === "no_clinic") {
      return NextResponse.json(
        { error: access.message, code: "NO_CLINIC" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: access.message },
      { status: access.reason === "unauthenticated" ? 401 : 403 }
    );
  }

  try {
    const body = await request.json();
    const {
      patient_id,
      ordered_by_id,
      clinical_note_id,
      appointment_id,
      priority = "ROUTINE",
      clinical_notes,
      tests,
    } = body;

    // Validate required fields
    if (!patient_id || !ordered_by_id || !tests || tests.length === 0) {
      return NextResponse.json(
        { error: "patient_id, ordered_by_id, and tests are required" },
        { status: 400 }
      );
    }

    // Generate order number
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    // Count orders today for sequential number
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));
    const orderCount = await prisma.labOrder.count({
      where: {
        clinic_id: access.clinicId,
        created_at: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    const orderNumber = `LAB-${year}${month}${day}-${String(orderCount + 1).padStart(4, "0")}`;

    // Create lab order with results
    const labOrder = await prisma.labOrder.create({
      data: {
        order_number: orderNumber,
        priority: priority as LabOrderPriority,
        clinical_notes: clinical_notes || null,
        clinic_id: access.clinicId,
        patient_id,
        ordered_by_id,
        clinical_note_id: clinical_note_id || null,
        appointment_id: appointment_id || null,
        results: {
          create: tests.map((testId: string) => ({
            lab_test_id: testId,
          })),
        },
      },
      include: {
        patient: {
          select: {
            id: true,
            full_name: true,
            patient_number: true,
          },
        },
        ordered_by: {
          select: {
            id: true,
            full_name: true,
            registration_number: true,
          },
        },
        results: {
          include: {
            lab_test: true,
          },
        },
      },
    });

    return NextResponse.json({ labOrder }, { status: 201 });
  } catch (error) {
    console.error("Error creating lab order:", error);
    return NextResponse.json(
      { error: "Failed to create lab order" },
      { status: 500 }
    );
  }
}
