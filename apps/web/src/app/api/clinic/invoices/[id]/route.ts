import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, PaymentStatus } from "@swasthya/database";

// GET /api/clinic/invoices/[id] - Get a specific invoice
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get user's clinic
    const clinic = await prisma.clinic.findFirst({
      where: {
        claimed_by_id: session.user.id,
        verified: true,
      },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        logo_url: true,
      },
    });

    if (!clinic) {
      return NextResponse.json(
        { error: "No clinic found", code: "NO_CLINIC" },
        { status: 404 }
      );
    }

    // Get the invoice
    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        clinic_id: clinic.id,
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    // Get user's clinic
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
        { error: "No clinic found", code: "NO_CLINIC" },
        { status: 404 }
      );
    }

    // Verify the invoice belongs to the clinic
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id,
        clinic_id: clinic.id,
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
