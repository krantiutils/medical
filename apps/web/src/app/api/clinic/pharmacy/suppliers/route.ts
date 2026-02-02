import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@swasthya/database";

// GET /api/clinic/pharmacy/suppliers - List suppliers for the clinic
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
        { name: { contains: search, mode: "insensitive" } },
        { contact_name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    if (isActive !== null && isActive !== "") {
      where.is_active = isActive === "true";
    }

    // Get suppliers with product count
    const suppliers = await prisma.supplier.findMany({
      where,
      include: {
        _count: {
          select: {
            products: true,
            batches: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ suppliers });
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return NextResponse.json(
      { error: "Failed to fetch suppliers" },
      { status: 500 }
    );
  }
}

// POST /api/clinic/pharmacy/suppliers - Create a new supplier
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
    const {
      name,
      contact_name,
      phone,
      email,
      address,
      gstin,
      pan_number,
      payment_terms,
      notes,
    } = body;

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Supplier name is required" },
        { status: 400 }
      );
    }

    // Check for duplicate supplier name
    const existingSupplier = await prisma.supplier.findFirst({
      where: {
        clinic_id: clinic.id,
        name: name.trim(),
      },
    });

    if (existingSupplier) {
      return NextResponse.json(
        { error: "A supplier with this name already exists" },
        { status: 400 }
      );
    }

    // Create supplier
    const supplier = await prisma.supplier.create({
      data: {
        name: name.trim(),
        contact_name: contact_name?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        address: address?.trim() || null,
        gstin: gstin?.trim() || null,
        pan_number: pan_number?.trim() || null,
        payment_terms: payment_terms?.trim() || null,
        notes: notes?.trim() || null,
        clinic_id: clinic.id,
        is_active: true,
      },
      include: {
        _count: {
          select: {
            products: true,
            batches: true,
          },
        },
      },
    });

    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    console.error("Error creating supplier:", error);
    return NextResponse.json(
      { error: "Failed to create supplier" },
      { status: 500 }
    );
  }
}

// PUT /api/clinic/pharmacy/suppliers - Update a supplier
export async function PUT(request: NextRequest) {
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
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Supplier ID is required" },
        { status: 400 }
      );
    }

    // Verify supplier belongs to clinic
    const existingSupplier = await prisma.supplier.findFirst({
      where: {
        id,
        clinic_id: clinic.id,
      },
    });

    if (!existingSupplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    // Check for duplicate name if name is being updated
    if (updates.name && updates.name.trim() !== existingSupplier.name) {
      const duplicateName = await prisma.supplier.findFirst({
        where: {
          clinic_id: clinic.id,
          name: updates.name.trim(),
          id: { not: id },
        },
      });

      if (duplicateName) {
        return NextResponse.json(
          { error: "A supplier with this name already exists" },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};

    if (updates.name !== undefined) updateData.name = updates.name.trim();
    if (updates.contact_name !== undefined) updateData.contact_name = updates.contact_name?.trim() || null;
    if (updates.phone !== undefined) updateData.phone = updates.phone?.trim() || null;
    if (updates.email !== undefined) updateData.email = updates.email?.trim() || null;
    if (updates.address !== undefined) updateData.address = updates.address?.trim() || null;
    if (updates.gstin !== undefined) updateData.gstin = updates.gstin?.trim() || null;
    if (updates.pan_number !== undefined) updateData.pan_number = updates.pan_number?.trim() || null;
    if (updates.payment_terms !== undefined) updateData.payment_terms = updates.payment_terms?.trim() || null;
    if (updates.notes !== undefined) updateData.notes = updates.notes?.trim() || null;
    if (updates.is_active !== undefined) updateData.is_active = updates.is_active;

    const supplier = await prisma.supplier.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            products: true,
            batches: true,
          },
        },
      },
    });

    return NextResponse.json(supplier);
  } catch (error) {
    console.error("Error updating supplier:", error);
    return NextResponse.json(
      { error: "Failed to update supplier" },
      { status: 500 }
    );
  }
}

// DELETE /api/clinic/pharmacy/suppliers - Delete a supplier
export async function DELETE(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Supplier ID is required" },
        { status: 400 }
      );
    }

    // Verify supplier belongs to clinic
    const supplier = await prisma.supplier.findFirst({
      where: {
        id,
        clinic_id: clinic.id,
      },
      include: {
        _count: {
          select: {
            products: true,
            batches: true,
          },
        },
      },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    // Check if supplier has products or batches
    if (supplier._count.products > 0 || supplier._count.batches > 0) {
      return NextResponse.json(
        { error: "Cannot delete supplier with associated products or inventory. Deactivate it instead." },
        { status: 400 }
      );
    }

    // Delete supplier
    await prisma.supplier.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting supplier:", error);
    return NextResponse.json(
      { error: "Failed to delete supplier" },
      { status: 500 }
    );
  }
}
