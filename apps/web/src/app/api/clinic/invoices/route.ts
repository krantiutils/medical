import { NextRequest, NextResponse } from "next/server";
import { prisma, PaymentMode, PaymentStatus } from "@swasthya/database";
import { requireClinicPermission } from "@/lib/require-clinic-access";

// Invoice item type
interface InvoiceItem {
  service_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

// GET /api/clinic/invoices - Get all invoices for the user's clinic
export async function GET(request: NextRequest) {
  try {
    // Check billing permission
    const access = await requireClinicPermission("billing");
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: access.message },
        { status: access.reason === "unauthenticated" ? 401 : 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const paymentStatus = searchParams.get("paymentStatus");

    // Build where clause
    const where: Record<string, unknown> = {
      clinic_id: access.clinicId,
    };

    if (dateFrom || dateTo) {
      where.created_at = {};
      if (dateFrom) {
        (where.created_at as Record<string, unknown>).gte = new Date(dateFrom);
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        (where.created_at as Record<string, unknown>).lte = toDate;
      }
    }

    if (paymentStatus) {
      where.payment_status = paymentStatus;
    }

    // Get invoices with pagination
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          patient: {
            select: {
              id: true,
              patient_number: true,
              full_name: true,
              phone: true,
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
        },
        orderBy: { created_at: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ]);

    return NextResponse.json({
      invoices,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/clinic/invoices - Create a new invoice
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      patient_id,
      appointment_id,
      items,
      discount,
      tax,
      payment_mode,
      payment_status,
      notes,
    } = body;

    // Validate required fields
    if (!patient_id) {
      return NextResponse.json(
        { error: "Patient is required" },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "At least one item is required" },
        { status: 400 }
      );
    }

    // Validate items
    for (const item of items as InvoiceItem[]) {
      if (!item.service_id || !item.name || !item.quantity || item.quantity <= 0) {
        return NextResponse.json(
          { error: "Invalid item data" },
          { status: 400 }
        );
      }
    }

    // Get user's clinic
    const clinic = await prisma.clinic.findFirst({
      where: {
        claimed_by_id: session.user.id,
        verified: true,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!clinic) {
      return NextResponse.json(
        { error: "No clinic found", code: "NO_CLINIC" },
        { status: 404 }
      );
    }

    // Verify patient belongs to the clinic
    const patient = await prisma.patient.findFirst({
      where: {
        id: patient_id,
        clinic_id: clinic.id,
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      );
    }

    // If appointment_id is provided, verify it belongs to the clinic and patient
    if (appointment_id) {
      const appointment = await prisma.appointment.findFirst({
        where: {
          id: appointment_id,
          clinic_id: clinic.id,
          patient_id: patient_id,
        },
      });

      if (!appointment) {
        return NextResponse.json(
          { error: "Appointment not found" },
          { status: 404 }
        );
      }

      // Check if appointment already has an invoice
      const existingInvoice = await prisma.invoice.findFirst({
        where: {
          appointment_id: appointment_id,
        },
      });

      if (existingInvoice) {
        return NextResponse.json(
          { error: "Appointment already has an invoice" },
          { status: 400 }
        );
      }
    }

    // Calculate totals
    const typedItems = items as InvoiceItem[];
    const subtotal = typedItems.reduce(
      (sum: number, item: InvoiceItem) => sum + item.quantity * item.unit_price,
      0
    );
    const discountAmount = Number(discount) || 0;
    const taxAmount = Number(tax) || 0;
    const total = subtotal - discountAmount + taxAmount;

    // Generate invoice number
    const year = new Date().getFullYear();
    const invoiceCount = await prisma.invoice.count({
      where: {
        clinic_id: clinic.id,
        created_at: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`),
        },
      },
    });
    const invoiceNumber = `INV-${year}-${String(invoiceCount + 1).padStart(4, "0")}`;

    // Validate payment mode and status
    const validPaymentModes = Object.values(PaymentMode);
    const validPaymentStatuses = Object.values(PaymentStatus);

    const finalPaymentMode = validPaymentModes.includes(payment_mode)
      ? payment_mode
      : PaymentMode.CASH;

    const finalPaymentStatus = validPaymentStatuses.includes(payment_status)
      ? payment_status
      : PaymentStatus.PENDING;

    // Create the invoice
    const invoice = await prisma.invoice.create({
      data: {
        clinic_id: clinic.id,
        patient_id: patient_id,
        appointment_id: appointment_id || null,
        created_by_id: session.user.id,
        invoice_number: invoiceNumber,
        items: typedItems.map((item: InvoiceItem) => ({
          service_id: item.service_id,
          name: item.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          amount: item.quantity * item.unit_price,
        })),
        subtotal,
        discount: discountAmount,
        tax: taxAmount,
        total,
        payment_mode: finalPaymentMode,
        payment_status: finalPaymentStatus,
        notes: notes?.trim() || null,
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
      },
    });

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
