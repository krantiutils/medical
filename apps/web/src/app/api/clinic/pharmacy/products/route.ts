import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@swasthya/database";
import { requireClinicPermission } from "@/lib/require-clinic-access";

// GET /api/clinic/pharmacy/products - List products for the clinic
export async function GET(request: NextRequest) {
  try {
    const access = await requireClinicPermission("pharmacy");
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: access.message },
        { status: access.reason === "unauthenticated" ? 401 : 403 }
      );
    }

    // Get query params for filtering
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const supplierId = searchParams.get("supplierId") || "";
    const isActive = searchParams.get("isActive");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {
      clinic_id: access.clinicId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { generic_name: { contains: search, mode: "insensitive" } },
        { barcode: { contains: search, mode: "insensitive" } },
        { manufacturer: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (supplierId) {
      where.supplier_id = supplierId;
    }

    if (isActive !== null && isActive !== "") {
      where.is_active = isActive === "true";
    }

    // Get products with count
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
            },
          },
          batches: {
            where: {
              is_active: true,
              quantity: { gt: 0 },
            },
            select: {
              id: true,
              quantity: true,
              expiry_date: true,
            },
          },
        },
        orderBy: { updated_at: "desc" },
        skip: offset,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    // Calculate stock for each product
    const productsWithStock = products.map((product) => ({
      ...product,
      totalStock: product.batches.reduce((sum, batch) => sum + batch.quantity, 0),
      nearestExpiry: product.batches.length > 0
        ? product.batches.sort((a, b) =>
            new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()
          )[0]?.expiry_date
        : null,
      batchCount: product.batches.length,
    }));

    return NextResponse.json({
      products: productsWithStock,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST /api/clinic/pharmacy/products - Create a new product
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
      name,
      generic_name,
      category,
      schedule,
      manufacturer,
      barcode,
      hsn_code,
      gst_rate,
      unit,
      pack_size,
      min_stock_level,
      max_stock_level,
      description,
      storage_info,
      supplier_id,
    } = body;

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Product name is required" },
        { status: 400 }
      );
    }

    // Check for duplicate barcode if provided
    if (barcode) {
      const existingProduct = await prisma.product.findFirst({
        where: {
          clinic_id: access.clinicId,
          barcode,
        },
      });

      if (existingProduct) {
        return NextResponse.json(
          { error: "A product with this barcode already exists" },
          { status: 400 }
        );
      }
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        generic_name: generic_name?.trim() || null,
        category: category || "MEDICINE",
        schedule: schedule || null,
        manufacturer: manufacturer?.trim() || null,
        barcode: barcode?.trim() || null,
        hsn_code: hsn_code?.trim() || null,
        gst_rate: gst_rate ? parseFloat(gst_rate) : 0,
        unit: unit || "strip",
        pack_size: pack_size ? parseInt(pack_size) : 1,
        min_stock_level: min_stock_level ? parseInt(min_stock_level) : 0,
        max_stock_level: max_stock_level ? parseInt(max_stock_level) : null,
        description: description?.trim() || null,
        storage_info: storage_info?.trim() || null,
        supplier_id: supplier_id || null,
        clinic_id: access.clinicId,
        is_active: true,
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}

// PUT /api/clinic/pharmacy/products - Update a product
export async function PUT(request: NextRequest) {
  try {
    const access = await requireClinicPermission("pharmacy");
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: access.message },
        { status: access.reason === "unauthenticated" ? 401 : 403 }
      );
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Verify product belongs to clinic
    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        clinic_id: access.clinicId,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Check for duplicate barcode if barcode is being updated
    if (updates.barcode && updates.barcode !== existingProduct.barcode) {
      const duplicateBarcode = await prisma.product.findFirst({
        where: {
          clinic_id: access.clinicId,
          barcode: updates.barcode,
          id: { not: id },
        },
      });

      if (duplicateBarcode) {
        return NextResponse.json(
          { error: "A product with this barcode already exists" },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};

    if (updates.name !== undefined) updateData.name = updates.name.trim();
    if (updates.generic_name !== undefined) updateData.generic_name = updates.generic_name?.trim() || null;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.schedule !== undefined) updateData.schedule = updates.schedule || null;
    if (updates.manufacturer !== undefined) updateData.manufacturer = updates.manufacturer?.trim() || null;
    if (updates.barcode !== undefined) updateData.barcode = updates.barcode?.trim() || null;
    if (updates.hsn_code !== undefined) updateData.hsn_code = updates.hsn_code?.trim() || null;
    if (updates.gst_rate !== undefined) updateData.gst_rate = parseFloat(updates.gst_rate) || 0;
    if (updates.unit !== undefined) updateData.unit = updates.unit;
    if (updates.pack_size !== undefined) updateData.pack_size = parseInt(updates.pack_size) || 1;
    if (updates.min_stock_level !== undefined) updateData.min_stock_level = parseInt(updates.min_stock_level) || 0;
    if (updates.max_stock_level !== undefined) updateData.max_stock_level = updates.max_stock_level ? parseInt(updates.max_stock_level) : null;
    if (updates.description !== undefined) updateData.description = updates.description?.trim() || null;
    if (updates.storage_info !== undefined) updateData.storage_info = updates.storage_info?.trim() || null;
    if (updates.supplier_id !== undefined) updateData.supplier_id = updates.supplier_id || null;
    if (updates.is_active !== undefined) updateData.is_active = updates.is_active;

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE /api/clinic/pharmacy/products - Delete a product
export async function DELETE(request: NextRequest) {
  try {
    const access = await requireClinicPermission("pharmacy");
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: access.message },
        { status: access.reason === "unauthenticated" ? 401 : 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Verify product belongs to clinic
    const product = await prisma.product.findFirst({
      where: {
        id,
        clinic_id: access.clinicId,
      },
      include: {
        batches: {
          where: {
            quantity: { gt: 0 },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Check if product has stock
    if (product.batches.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete product with existing stock. Deactivate it instead." },
        { status: 400 }
      );
    }

    // Delete product (cascades to empty batches)
    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
