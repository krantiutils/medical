import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@swasthya/database";
import { requireClinicPermission } from "@/lib/require-clinic-access";

// GET /api/clinic/pharmacy/credit-accounts/[id] - Get a single credit account with transactions
export async function GET(
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

    const account = await prisma.creditAccount.findFirst({
      where: {
        id,
        clinic_id: access.clinicId,
      },
      include: {
        transactions: {
          orderBy: { created_at: "desc" },
          take: 50,
        },
        sales: {
          orderBy: { created_at: "desc" },
          take: 20,
          select: {
            id: true,
            sale_number: true,
            total: true,
            amount_due: true,
            created_at: true,
          },
        },
      },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Credit account not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      account: {
        id: account.id,
        customer_name: account.customer_name,
        phone: account.phone,
        address: account.address,
        credit_limit: account.credit_limit.toString(),
        current_balance: account.current_balance.toString(),
        is_active: account.is_active,
        created_at: account.created_at.toISOString(),
      },
      transactions: account.transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: t.amount.toString(),
        balance: t.balance.toString(),
        description: t.description,
        notes: t.notes,
        created_at: t.created_at.toISOString(),
        sale_id: t.sale_id,
      })),
      sales: account.sales.map((s) => ({
        id: s.id,
        sale_number: s.sale_number,
        total: s.total.toString(),
        amount_due: s.amount_due.toString(),
        created_at: s.created_at.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching credit account:", error);
    return NextResponse.json(
      { error: "Failed to fetch credit account" },
      { status: 500 }
    );
  }
}

// PUT /api/clinic/pharmacy/credit-accounts/[id] - Update a credit account
export async function PUT(
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
    const existingAccount = await prisma.creditAccount.findFirst({
      where: {
        id,
        clinic_id: access.clinicId,
      },
    });

    if (!existingAccount) {
      return NextResponse.json(
        { error: "Credit account not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, phone, address, credit_limit, is_active } = body;

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Customer name is required" },
        { status: 400 }
      );
    }

    // Check for duplicate phone if changed
    if (phone && phone !== existingAccount.phone) {
      const duplicatePhone = await prisma.creditAccount.findFirst({
        where: {
          clinic_id: access.clinicId,
          phone,
          id: { not: id },
        },
      });

      if (duplicatePhone) {
        return NextResponse.json(
          { error: "A credit account with this phone number already exists" },
          { status: 400 }
        );
      }
    }

    // Update account
    const account = await prisma.creditAccount.update({
      where: { id },
      data: {
        customer_name: name.trim(),
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        credit_limit: credit_limit ?? existingAccount.credit_limit,
        is_active: is_active ?? existingAccount.is_active,
      },
    });

    return NextResponse.json({
      account: {
        id: account.id,
        customer_name: account.customer_name,
        phone: account.phone,
        address: account.address,
        credit_limit: account.credit_limit.toString(),
        current_balance: account.current_balance.toString(),
        is_active: account.is_active,
      },
    });
  } catch (error) {
    console.error("Error updating credit account:", error);
    return NextResponse.json(
      { error: "Failed to update credit account" },
      { status: 500 }
    );
  }
}

// DELETE /api/clinic/pharmacy/credit-accounts/[id] - Delete a credit account
export async function DELETE(
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

    // Verify account belongs to clinic and has no outstanding balance
    const account = await prisma.creditAccount.findFirst({
      where: {
        id,
        clinic_id: access.clinicId,
      },
      include: {
        _count: {
          select: {
            transactions: true,
            sales: true,
          },
        },
      },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Credit account not found" },
        { status: 404 }
      );
    }

    // Prevent deletion if has outstanding balance
    if (parseFloat(account.current_balance.toString()) > 0) {
      return NextResponse.json(
        { error: "Cannot delete account with outstanding balance" },
        { status: 400 }
      );
    }

    // Prevent deletion if has transactions
    if (account._count.transactions > 0 || account._count.sales > 0) {
      return NextResponse.json(
        { error: "Cannot delete account with transaction history" },
        { status: 400 }
      );
    }

    // Delete account
    await prisma.creditAccount.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting credit account:", error);
    return NextResponse.json(
      { error: "Failed to delete credit account" },
      { status: 500 }
    );
  }
}
