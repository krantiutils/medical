import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@swasthya/database";
import { requireClinicPermission } from "@/lib/require-clinic-access";

interface SaleItem {
  product_id: string;
  batch_id: string;
  product_name: string;
  batch_number: string;
  quantity: number;
  unit_price: number;
  discount: number;
  discount_type: "percent" | "amount";
  gst_rate: number;
  gst_amount: number;
  amount: number;
}

// POST /api/clinic/pharmacy/pos/sale - Complete a sale
export async function POST(request: NextRequest) {
  try {
    const access = await requireClinicPermission("pharmacy");
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: access.message },
        { status: access.reason === "unauthenticated" ? 401 : 403 }
      );
    }

    const body = await request.json();
    const {
      items,
      subtotal,
      discount,
      tax_amount,
      total,
      amount_paid,
      payment_mode,
      is_credit,
      credit_account_id,
      prescription_id,
      notes,
    } = body;

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 }
      );
    }

    // Verify all batches have sufficient stock
    for (const item of items as SaleItem[]) {
      const batch = await prisma.inventoryBatch.findUnique({
        where: { id: item.batch_id },
      });

      if (!batch || batch.clinic_id !== access.clinicId) {
        return NextResponse.json(
          { error: `Invalid batch for product: ${item.product_name}` },
          { status: 400 }
        );
      }

      if (batch.quantity < item.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for ${item.product_name}. Available: ${batch.quantity}`,
          },
          { status: 400 }
        );
      }
    }

    // Verify credit account if credit sale
    if (is_credit) {
      if (!credit_account_id) {
        return NextResponse.json(
          { error: "Credit account is required for credit sale" },
          { status: 400 }
        );
      }

      const creditAccount = await prisma.creditAccount.findUnique({
        where: { id: credit_account_id },
      });

      if (!creditAccount || creditAccount.clinic_id !== access.clinicId) {
        return NextResponse.json(
          { error: "Invalid credit account" },
          { status: 400 }
        );
      }
    }

    // Generate sale number
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    const lastSale = await prisma.sale.findFirst({
      where: {
        clinic_id: access.clinicId,
        sale_number: { startsWith: `SALE-${year}${month}${day}` },
      },
      orderBy: { created_at: "desc" },
    });

    let saleCounter = 1;
    if (lastSale) {
      const lastNumber = parseInt(lastSale.sale_number.split("-").pop() || "0");
      saleCounter = lastNumber + 1;
    }
    const saleNumber = `SALE-${year}${month}${day}-${String(saleCounter).padStart(4, "0")}`;

    // Create sale and update inventory in a transaction
    const sale = await prisma.$transaction(async (tx) => {
      // Create sale record
      const newSale = await tx.sale.create({
        data: {
          sale_number: saleNumber,
          clinic_id: access.clinicId,
          items: items,
          subtotal,
          discount,
          tax_amount,
          total,
          amount_paid: is_credit ? 0 : amount_paid,
          amount_due: is_credit ? total : Math.max(0, total - amount_paid),
          payment_mode,
          is_credit,
          credit_account_id: is_credit ? credit_account_id : null,
          prescription_id: prescription_id || null,
          notes: notes || null,
        },
      });

      // Deduct stock from batches
      for (const item of items as SaleItem[]) {
        await tx.inventoryBatch.update({
          where: { id: item.batch_id },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });

        // Check if batch is now empty and mark inactive
        const updatedBatch = await tx.inventoryBatch.findUnique({
          where: { id: item.batch_id },
        });
        if (updatedBatch && updatedBatch.quantity <= 0) {
          await tx.inventoryBatch.update({
            where: { id: item.batch_id },
            data: { is_active: false },
          });
        }
      }

      // If credit sale, update credit account balance and create transaction
      if (is_credit && credit_account_id) {
        const creditAccount = await tx.creditAccount.findUnique({
          where: { id: credit_account_id },
        });

        if (creditAccount) {
          const newBalance = parseFloat(creditAccount.current_balance.toString()) + total;

          await tx.creditAccount.update({
            where: { id: credit_account_id },
            data: {
              current_balance: newBalance,
            },
          });

          await tx.creditTransaction.create({
            data: {
              type: "SALE",
              amount: total,
              balance: newBalance,
              description: `Sale: ${saleNumber}`,
              credit_account_id: credit_account_id,
              sale_id: newSale.id,
              clinic_id: access.clinicId,
            },
          });
        }
      }

      return newSale;
    });

    // Generate receipt HTML
    const receipt = generateReceipt(access.clinic.name, sale, items as SaleItem[]);

    return NextResponse.json({
      sale: {
        id: sale.id,
        sale_number: sale.sale_number,
        total: sale.total.toString(),
        amount_paid: sale.amount_paid.toString(),
        is_credit: sale.is_credit,
      },
      receipt,
    });
  } catch (error) {
    console.error("Error completing sale:", error);
    return NextResponse.json(
      { error: "Failed to complete sale" },
      { status: 500 }
    );
  }
}

// Generate receipt HTML
function generateReceipt(
  clinicName: string,
  sale: {
    sale_number: string;
    subtotal: unknown;
    discount: unknown;
    tax_amount: unknown;
    total: unknown;
    amount_paid: unknown;
    is_credit: boolean;
    created_at: Date;
  },
  items: SaleItem[]
): string {
  const formatDate = (date: Date) => {
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toFixed(2)}`;
  };

  let itemsHtml = "";
  for (const item of items) {
    itemsHtml += `
      <tr>
        <td style="padding: 4px 0;">
          ${item.product_name}<br/>
          <small style="color: #666;">Batch: ${item.batch_number}</small>
        </td>
        <td style="text-align: center;">${item.quantity}</td>
        <td style="text-align: right;">${formatCurrency(item.unit_price)}</td>
        <td style="text-align: right;">${formatCurrency(item.amount)}</td>
      </tr>
    `;
  }

  const amountDue = sale.is_credit
    ? parseFloat(sale.total as string)
    : Math.max(0, parseFloat(sale.total as string) - parseFloat(sale.amount_paid as string));
  const change = !sale.is_credit
    ? Math.max(0, parseFloat(sale.amount_paid as string) - parseFloat(sale.total as string))
    : 0;

  return `
    <div class="header">
      <h1>${clinicName}</h1>
      <p>Tax Invoice</p>
    </div>
    <div class="divider"></div>
    <table>
      <tr>
        <td><strong>Invoice #:</strong></td>
        <td class="right">${sale.sale_number}</td>
      </tr>
      <tr>
        <td><strong>Date:</strong></td>
        <td class="right">${formatDate(sale.created_at)}</td>
      </tr>
    </table>
    <div class="divider"></div>
    <table style="width: 100%; font-size: 11px;">
      <thead>
        <tr style="border-bottom: 1px solid #000;">
          <th style="text-align: left; padding: 4px 0;">Item</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Price</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>
    <div class="divider"></div>
    <table>
      <tr>
        <td>Subtotal:</td>
        <td class="right">${formatCurrency(parseFloat(sale.subtotal as string))}</td>
      </tr>
      <tr>
        <td>Discount:</td>
        <td class="right">- ${formatCurrency(parseFloat(sale.discount as string))}</td>
      </tr>
      <tr>
        <td>GST:</td>
        <td class="right">${formatCurrency(parseFloat(sale.tax_amount as string))}</td>
      </tr>
      <tr class="total">
        <td><strong>Total:</strong></td>
        <td class="right"><strong>${formatCurrency(parseFloat(sale.total as string))}</strong></td>
      </tr>
      ${
        sale.is_credit
          ? `<tr><td>Payment:</td><td class="right">CREDIT</td></tr>
             <tr><td><strong>Balance Due:</strong></td><td class="right"><strong>${formatCurrency(amountDue)}</strong></td></tr>`
          : `<tr><td>Paid:</td><td class="right">${formatCurrency(parseFloat(sale.amount_paid as string))}</td></tr>
             ${change > 0 ? `<tr><td>Change:</td><td class="right">${formatCurrency(change)}</td></tr>` : ""}`
      }
    </table>
    <div class="divider"></div>
    <div class="footer">
      <p>Thank you for your purchase!</p>
      <p>Get well soon!</p>
    </div>
  `;
}
