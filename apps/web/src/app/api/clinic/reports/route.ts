import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, PaymentMode, PaymentStatus } from "@swasthya/database";

// GET /api/clinic/reports - Get billing reports for the user's clinic
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

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

    // Build date filter
    const startDate = dateFrom ? new Date(dateFrom) : getDefaultStartDate();
    const endDate = dateTo ? new Date(dateTo) : new Date();
    endDate.setHours(23, 59, 59, 999);

    // Get all invoices in the date range
    const invoices = await prisma.invoice.findMany({
      where: {
        clinic_id: clinic.id,
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        invoice_number: true,
        subtotal: true,
        discount: true,
        tax: true,
        total: true,
        payment_mode: true,
        payment_status: true,
        created_at: true,
        items: true,
        patient: {
          select: {
            full_name: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    // Calculate summary statistics
    const summary = {
      totalInvoices: invoices.length,
      totalCollection: 0,
      totalPending: 0,
      totalPaid: 0,
      totalPartial: 0,
      totalDiscount: 0,
      totalTax: 0,
      subtotal: 0,
    };

    // Payment mode breakdown
    const paymentModeBreakdown: Record<string, { count: number; amount: number }> = {};
    for (const mode of Object.values(PaymentMode)) {
      paymentModeBreakdown[mode] = { count: 0, amount: 0 };
    }

    // Payment status breakdown
    const paymentStatusBreakdown: Record<string, { count: number; amount: number }> = {};
    for (const status of Object.values(PaymentStatus)) {
      paymentStatusBreakdown[status] = { count: 0, amount: 0 };
    }

    // Daily breakdown
    const dailyBreakdown: Record<string, {
      date: string;
      invoiceCount: number;
      totalCollection: number;
      paidAmount: number;
      pendingAmount: number;
    }> = {};

    // Process invoices
    for (const invoice of invoices) {
      const total = Number(invoice.total);
      const discount = Number(invoice.discount);
      const tax = Number(invoice.tax);
      const subtotal = Number(invoice.subtotal);

      summary.subtotal += subtotal;
      summary.totalDiscount += discount;
      summary.totalTax += tax;

      // Update payment mode breakdown
      if (paymentModeBreakdown[invoice.payment_mode]) {
        paymentModeBreakdown[invoice.payment_mode].count += 1;
        paymentModeBreakdown[invoice.payment_mode].amount += total;
      }

      // Update payment status breakdown
      if (paymentStatusBreakdown[invoice.payment_status]) {
        paymentStatusBreakdown[invoice.payment_status].count += 1;
        paymentStatusBreakdown[invoice.payment_status].amount += total;
      }

      // Update totals based on payment status
      if (invoice.payment_status === PaymentStatus.PAID) {
        summary.totalPaid += total;
        summary.totalCollection += total;
      } else if (invoice.payment_status === PaymentStatus.PARTIAL) {
        summary.totalPartial += total;
        // For partial, we count the amount as pending
        summary.totalPending += total;
      } else if (invoice.payment_status === PaymentStatus.PENDING) {
        summary.totalPending += total;
      }

      // Daily breakdown
      const dateKey = invoice.created_at.toISOString().split("T")[0];
      if (!dailyBreakdown[dateKey]) {
        dailyBreakdown[dateKey] = {
          date: dateKey,
          invoiceCount: 0,
          totalCollection: 0,
          paidAmount: 0,
          pendingAmount: 0,
        };
      }
      dailyBreakdown[dateKey].invoiceCount += 1;
      dailyBreakdown[dateKey].totalCollection += total;
      if (invoice.payment_status === PaymentStatus.PAID) {
        dailyBreakdown[dateKey].paidAmount += total;
      } else {
        dailyBreakdown[dateKey].pendingAmount += total;
      }
    }

    // Convert daily breakdown to sorted array
    const dailyData = Object.values(dailyBreakdown).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Format invoices for response (simplified)
    const formattedInvoices = invoices.map((inv) => ({
      id: inv.id,
      invoice_number: inv.invoice_number,
      patient_name: inv.patient.full_name,
      subtotal: Number(inv.subtotal),
      discount: Number(inv.discount),
      tax: Number(inv.tax),
      total: Number(inv.total),
      payment_mode: inv.payment_mode,
      payment_status: inv.payment_status,
      created_at: inv.created_at.toISOString(),
      items: inv.items,
    }));

    return NextResponse.json({
      clinic: {
        id: clinic.id,
        name: clinic.name,
      },
      dateRange: {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
      },
      summary,
      paymentModeBreakdown,
      paymentStatusBreakdown,
      dailyData,
      invoices: formattedInvoices,
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to get default start date (30 days ago)
function getDefaultStartDate(): Date {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  date.setHours(0, 0, 0, 0);
  return date;
}
