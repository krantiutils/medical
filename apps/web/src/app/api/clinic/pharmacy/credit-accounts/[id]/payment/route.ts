import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@swasthya/database";

// POST /api/clinic/pharmacy/credit-accounts/[id]/payment - Record a payment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find user's verified clinic
    const clinic = await prisma.clinic.findFirst({
      where: {
        claimed_by_id: session.user.id,
        verified: true,
      },
    });

    if (!clinic) {
      return NextResponse.json(
        { error: "No verified clinic found", code: "NO_CLINIC" },
        { status: 404 }
      );
    }

    // Verify account belongs to clinic
    const account = await prisma.creditAccount.findFirst({
      where: {
        id,
        clinic_id: clinic.id,
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
          clinic_id: clinic.id,
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
