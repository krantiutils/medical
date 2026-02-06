import { NextRequest, NextResponse } from "next/server";
import { prisma, PaymentMode } from "@swasthya/database";
import { requireClinicPermission } from "@/lib/require-clinic-access";

interface SaleItem {
  product_id: string;
  batch_id: string;
  product_name: string;
  batch_number: string;
  quantity: number;
  unit_price: number;
  purchase_price?: number;
  discount: number;
  discount_type: "percent" | "amount";
  gst_rate: number;
  gst_amount: number;
  amount: number;
}

// GET /api/clinic/pharmacy/reports - Get pharmacy sales reports
export async function GET(request: NextRequest) {
  try {
    const access = await requireClinicPermission("pharmacy");
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: access.message },
        { status: access.reason === "unauthenticated" ? 401 : 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    // Build date filter
    const startDate = dateFrom ? new Date(dateFrom) : getDefaultStartDate();
    startDate.setHours(0, 0, 0, 0);
    const endDate = dateTo ? new Date(dateTo) : new Date();
    endDate.setHours(23, 59, 59, 999);

    // Fetch all sales in the date range
    const sales = await prisma.sale.findMany({
      where: {
        clinic_id: access.clinicId,
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        credit_account: {
          select: {
            id: true,
            customer_name: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    // Initialize summary
    const summary = {
      totalSales: sales.length,
      totalRevenue: 0,
      totalDiscount: 0,
      totalTax: 0,
      netRevenue: 0,
      totalCost: 0,
      grossProfit: 0,
      profitMargin: 0,
      cashSales: 0,
      creditSales: 0,
      averageSaleValue: 0,
    };

    // Payment mode breakdown
    const paymentModeBreakdown: Record<string, { count: number; amount: number }> = {};
    for (const mode of Object.values(PaymentMode)) {
      paymentModeBreakdown[mode] = { count: 0, amount: 0 };
    }

    // Daily breakdown
    const dailyBreakdown: Record<string, {
      date: string;
      saleCount: number;
      revenue: number;
      cost: number;
      profit: number;
      discount: number;
      tax: number;
    }> = {};

    // Product-wise sales breakdown
    const productSales: Record<string, {
      productId: string;
      productName: string;
      quantitySold: number;
      revenue: number;
      cost: number;
      profit: number;
      saleCount: number;
      averagePrice: number;
    }> = {};

    // Process each sale
    for (const sale of sales) {
      const total = Number(sale.total);
      const discount = Number(sale.discount);
      const tax = Number(sale.tax_amount);
      const subtotal = Number(sale.subtotal);

      // Update summary totals
      summary.totalRevenue += total;
      summary.totalDiscount += discount;
      summary.totalTax += tax;

      // Update payment mode breakdown
      if (paymentModeBreakdown[sale.payment_mode]) {
        paymentModeBreakdown[sale.payment_mode].count += 1;
        paymentModeBreakdown[sale.payment_mode].amount += total;
      }

      // Track cash vs credit
      if (sale.is_credit) {
        summary.creditSales += total;
      } else {
        summary.cashSales += total;
      }

      // Daily breakdown
      const dateKey = sale.created_at.toISOString().split("T")[0];
      if (!dailyBreakdown[dateKey]) {
        dailyBreakdown[dateKey] = {
          date: dateKey,
          saleCount: 0,
          revenue: 0,
          cost: 0,
          profit: 0,
          discount: 0,
          tax: 0,
        };
      }
      dailyBreakdown[dateKey].saleCount += 1;
      dailyBreakdown[dateKey].revenue += total;
      dailyBreakdown[dateKey].discount += discount;
      dailyBreakdown[dateKey].tax += tax;

      // Process items for product-wise sales and profit calculation
      const items = sale.items as unknown as SaleItem[];
      if (Array.isArray(items)) {
        for (const item of items) {
          const itemAmount = item.amount || 0;
          const itemCost = (item.purchase_price || 0) * item.quantity;
          const itemProfit = itemAmount - itemCost;

          // Update total cost
          summary.totalCost += itemCost;

          // Update daily cost and profit
          dailyBreakdown[dateKey].cost += itemCost;
          dailyBreakdown[dateKey].profit += itemProfit;

          // Product-wise breakdown
          const productKey = item.product_id;
          if (!productSales[productKey]) {
            productSales[productKey] = {
              productId: item.product_id,
              productName: item.product_name,
              quantitySold: 0,
              revenue: 0,
              cost: 0,
              profit: 0,
              saleCount: 0,
              averagePrice: 0,
            };
          }
          productSales[productKey].quantitySold += item.quantity;
          productSales[productKey].revenue += itemAmount;
          productSales[productKey].cost += itemCost;
          productSales[productKey].profit += itemProfit;
          productSales[productKey].saleCount += 1;
        }
      }
    }

    // Calculate derived values
    summary.netRevenue = summary.totalRevenue - summary.totalDiscount;
    summary.grossProfit = summary.netRevenue - summary.totalCost;
    summary.profitMargin = summary.netRevenue > 0
      ? (summary.grossProfit / summary.netRevenue) * 100
      : 0;
    summary.averageSaleValue = summary.totalSales > 0
      ? summary.totalRevenue / summary.totalSales
      : 0;

    // Calculate average price per product
    for (const productKey of Object.keys(productSales)) {
      const product = productSales[productKey];
      product.averagePrice = product.quantitySold > 0
        ? product.revenue / product.quantitySold
        : 0;
    }

    // Convert to sorted arrays
    const dailyData = Object.values(dailyBreakdown).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const productData = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 50); // Top 50 products

    // Format sales for response
    const formattedSales = sales.slice(0, 100).map((sale) => ({
      id: sale.id,
      sale_number: sale.sale_number,
      subtotal: Number(sale.subtotal),
      discount: Number(sale.discount),
      tax_amount: Number(sale.tax_amount),
      total: Number(sale.total),
      payment_mode: sale.payment_mode,
      is_credit: sale.is_credit,
      credit_account: sale.credit_account,
      created_at: sale.created_at.toISOString(),
      items: sale.items,
    }));

    return NextResponse.json({
      clinic: {
        id: access.clinic.id,
        name: access.clinic.name,
      },
      dateRange: {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
      },
      summary: {
        ...summary,
        profitMargin: parseFloat(summary.profitMargin.toFixed(2)),
        averageSaleValue: parseFloat(summary.averageSaleValue.toFixed(2)),
      },
      paymentModeBreakdown,
      dailyData,
      productData,
      sales: formattedSales,
    });
  } catch (error) {
    console.error("Error fetching pharmacy reports:", error);
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
