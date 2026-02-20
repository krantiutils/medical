import { NextRequest, NextResponse } from "next/server";
import { prisma, PaymentStatus } from "@swasthya/database";
import { requireClinicPermission } from "@/lib/require-clinic-access";

// GET /api/clinic/invoices/[id] - Get a specific invoice
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireClinicPermission("billing");
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: access.message, code: access.reason === "unauthenticated" ? "UNAUTHENTICATED" : "NO_CLINIC" },
        { status: access.reason === "unauthenticated" ? 401 : 403 }
      );
    }

    const { id } = await params;

    // Fetch clinic details for the invoice response
    const clinic = await prisma.clinic.findUnique({
      where: { id: access.clinicId },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        logo_url: true,
      },
    });

    // Get the invoice
    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        clinic_id: access.clinicId,
      },
      include: {
        patient: {
          select: {
            id: true,
            patient_number: true,
            full_name: true,
            phone: true,
            address: true,
          },
        },
        appointment: {
          select: {
            id: true,
            appointment_date: true,
            doctor: {
              select: {
                id: true,
                full_name: true,
              },
            },
          },
        },
        created_by: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ invoice, clinic });
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/clinic/invoices/[id] - Update invoice payment status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireClinicPermission("billing");
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: access.message, code: access.reason === "unauthenticated" ? "UNAUTHENTICATED" : "NO_CLINIC" },
        { status: access.reason === "unauthenticated" ? 401 : 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { payment_status } = body;

    // Validate payment status
    const validPaymentStatuses = Object.values(PaymentStatus);
    if (!validPaymentStatuses.includes(payment_status)) {
      return NextResponse.json(
        { error: "Invalid payment status" },
        { status: 400 }
      );
    }

    // Verify the invoice belongs to the clinic
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id,
        clinic_id: access.clinicId,
      },
    });

    if (!existingInvoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // Update the invoice
    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        payment_status,
      },
      include: {
        patient: {
          select: {
            id: true,
            patient_number: true,
            full_name: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
