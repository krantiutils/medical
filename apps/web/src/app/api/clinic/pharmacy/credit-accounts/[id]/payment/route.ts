import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@swasthya/database";
import { requireClinicPermission } from "@/lib/require-clinic-access";

// POST /api/clinic/pharmacy/credit-accounts/[id]/payment - Record a payment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await requireClinicPermission("pharmacy");
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: access.message },
        { status: access.reason === "unauthenticated" ? 401 : 403 }
      );
    }

    // Verify account belongs to clinic
    const account = await prisma.creditAccount.findFirst({
      where: {
        id,
        clinic_id: access.clinicId,
      },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Credit account not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { amount, notes } = body;

    // Validate amount
    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return NextResponse.json(
        { error: "Invalid payment amount" },
        { status: 400 }
      );
    }

    const currentBalance = parseFloat(account.current_balance.toString());
    if (paymentAmount > currentBalance) {
      return NextResponse.json(
        { error: "Payment amount exceeds outstanding balance" },
        { status: 400 }
      );
    }

    // Calculate new balance
    const newBalance = currentBalance - paymentAmount;

    // Create transaction and update balance in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update account balance
      const updatedAccount = await tx.creditAccount.update({
        where: { id },
        data: {
          current_balance: newBalance,
        },
      });

      // Create payment transaction
      const transaction = await tx.creditTransaction.create({
        data: {
          type: "PAYMENT",
          amount: paymentAmount,
          balance: newBalance,
          description: `Payment received`,
          notes: notes?.trim() || null,
          credit_account_id: id,
          clinic_id: access.clinicId,
        },
      });

      return { account: updatedAccount, transaction };
    });

    return NextResponse.json({
      success: true,
      account: {
        id: result.account.id,
        customer_name: result.account.customer_name,
        current_balance: result.account.current_balance.toString(),
      },
      transaction: {
        id: result.transaction.id,
        type: result.transaction.type,
        amount: result.transaction.amount.toString(),
        balance: result.transaction.balance.toString(),
        created_at: result.transaction.created_at.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error recording payment:", error);
    return NextResponse.json(
      { error: "Failed to record payment" },
      { status: 500 }
    );
  }
}
