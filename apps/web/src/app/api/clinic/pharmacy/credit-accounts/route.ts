import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@swasthya/database";

// GET /api/clinic/pharmacy/credit-accounts - List credit accounts for the clinic
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
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

    // Get query params for filtering
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const isActive = searchParams.get("isActive");

    // Build where clause
    const where: Record<string, unknown> = {
      clinic_id: clinic.id,
    };

    if (search) {
      where.OR = [
        { customer_name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    if (isActive !== null && isActive !== "") {
      where.is_active = isActive === "true";
    }

    const accounts = await prisma.creditAccount.findMany({
      where,
      orderBy: { customer_name: "asc" },
      select: {
        id: true,
        customer_name: true,
        phone: true,
        address: true,
        credit_limit: true,
        current_balance: true,
        is_active: true,
        created_at: true,
      },
    });

    return NextResponse.json({
      accounts: accounts.map((account) => ({
        ...account,
        credit_limit: account.credit_limit.toString(),
        current_balance: account.current_balance.toString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching credit accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch credit accounts" },
      { status: 500 }
    );
  }
}

// POST /api/clinic/pharmacy/credit-accounts - Create a new credit account
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
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

    const body = await request.json();
    const { name, phone, address, credit_limit } = body;

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Customer name is required" },
        { status: 400 }
      );
    }

    // Check for duplicate phone if provided
    if (phone) {
      const existingAccount = await prisma.creditAccount.findFirst({
        where: {
          clinic_id: clinic.id,
          phone,
        },
      });

      if (existingAccount) {
        return NextResponse.json(
          { error: "A credit account with this phone number already exists" },
          { status: 400 }
        );
      }
    }

    // Create credit account
    const account = await prisma.creditAccount.create({
      data: {
        customer_name: name.trim(),
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        credit_limit: credit_limit || 0,
        current_balance: 0,
        clinic_id: clinic.id,
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
    console.error("Error creating credit account:", error);
    return NextResponse.json(
      { error: "Failed to create credit account" },
      { status: 500 }
    );
  }
}
