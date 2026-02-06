import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@swasthya/database";
import { requireClinicPermission } from "@/lib/require-clinic-access";

interface PurchaseItem {
  product_id: string;
  batch_number: string;
  expiry_date: string;
  quantity: number;
  purchase_price: number;
  mrp: number;
  selling_price: number;
}

// GET /api/clinic/pharmacy/purchases - List purchase/receiving history
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
    const supplierId = searchParams.get("supplierId");
    const invoiceNumber = searchParams.get("invoiceNumber");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {
      clinic_id: access.clinicId,
    };

    if (supplierId) {
      where.supplier_id = supplierId;
    }

    if (invoiceNumber) {
      where.invoice_number = {
        contains: invoiceNumber,
        mode: "insensitive",
      };
    }

    if (startDate || endDate) {
      where.received_date = {};
      if (startDate) {
        (where.received_date as Record<string, unknown>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.received_date as Record<string, unknown>).lte = new Date(endDate + "T23:59:59.999Z");
      }
    }

    // Get batches grouped by invoice
    const [batches, total] = await Promise.all([
      prisma.inventoryBatch.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              generic_name: true,
              category: true,
              unit: true,
            },
          },
          supplier: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { received_date: "desc" },
        skip: offset,
        take: limit,
      }),
      prisma.inventoryBatch.count({ where }),
    ]);

    // Group by invoice number for better display
    const invoiceGroups = batches.reduce((acc, batch) => {
      const key = batch.invoice_number || `NO_INVOICE_${batch.id}`;
      if (!acc[key]) {
        acc[key] = {
          invoice_number: batch.invoice_number,
          supplier: batch.supplier,
          received_date: batch.received_date,
          items: [],
          total_value: 0,
          total_quantity: 0,
        };
      }
      acc[key].items.push(batch);
      acc[key].total_value += Number(batch.purchase_price) * batch.original_qty;
      acc[key].total_quantity += batch.original_qty;
      return acc;
    }, {} as Record<string, {
      invoice_number: string | null;
      supplier: { id: string; name: string } | null;
      received_date: Date;
      items: typeof batches;
      total_value: number;
      total_quantity: number;
    }>);

    return NextResponse.json({
      batches,
      invoiceGroups: Object.values(invoiceGroups),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching purchases:", error);
    return NextResponse.json(
      { error: "Failed to fetch purchases" },
      { status: 500 }
    );
  }
}

// POST /api/clinic/pharmacy/purchases - Receive stock (create inventory batches)
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
      supplier_id,
      invoice_number,
      invoice_date,
      received_date,
      items,
      notes,
    } = body as {
      supplier_id: string;
      invoice_number?: string;
      invoice_date?: string;
      received_date?: string;
      items: PurchaseItem[];
      notes?: string;
    };

    // Validate required fields
    if (!supplier_id) {
      return NextResponse.json(
        { error: "Supplier is required" },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "At least one item is required" },
        { status: 400 }
      );
    }

    // Validate supplier belongs to clinic
    const supplier = await prisma.supplier.findFirst({
      where: {
        id: supplier_id,
        clinic_id: access.clinicId,
        is_active: true,
      },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "Invalid supplier" },
        { status: 400 }
      );
    }

    // Validate all products and check for duplicate batch numbers
    const productIds = [...new Set(items.map((item) => item.product_id))];
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        clinic_id: access.clinicId,
      },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: "One or more invalid products" },
        { status: 400 }
      );
    }

    // Validate each item
    const errors: string[] = [];
    items.forEach((item, index) => {
      if (!item.product_id) {
        errors.push(`Item ${index + 1}: Product is required`);
      }
      if (!item.batch_number?.trim()) {
        errors.push(`Item ${index + 1}: Batch number is required`);
      }
      if (!item.expiry_date) {
        errors.push(`Item ${index + 1}: Expiry date is required`);
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
      }
      if (item.purchase_price === undefined || item.purchase_price < 0) {
        errors.push(`Item ${index + 1}: Purchase price is required`);
      }
      if (item.mrp === undefined || item.mrp < 0) {
        errors.push(`Item ${index + 1}: MRP is required`);
      }
      if (item.selling_price === undefined || item.selling_price < 0) {
        errors.push(`Item ${index + 1}: Selling price is required`);
      }

      // Validate expiry date is in future
      if (item.expiry_date) {
        const expiry = new Date(item.expiry_date);
        const now = new Date();
        if (expiry <= now) {
          errors.push(`Item ${index + 1}: Expiry date must be in the future`);
        }
      }
    });

    if (errors.length > 0) {
      return NextResponse.json(
        { error: "Validation failed", details: errors },
        { status: 400 }
      );
    }

    // Create inventory batches in a transaction
    const createdBatches = await prisma.$transaction(async (tx) => {
      const batches = [];
      const receivedAt = received_date ? new Date(received_date) : new Date();

      for (const item of items) {
        // Check if batch already exists for this product
        const existingBatch = await tx.inventoryBatch.findFirst({
          where: {
            clinic_id: access.clinicId,
            product_id: item.product_id,
            batch_number: item.batch_number.trim(),
          },
        });

        if (existingBatch) {
          // Update existing batch quantity
          const updatedBatch = await tx.inventoryBatch.update({
            where: { id: existingBatch.id },
            data: {
              quantity: existingBatch.quantity + item.quantity,
              original_qty: existingBatch.original_qty + item.quantity,
              purchase_price: item.purchase_price, // Update to latest price
              mrp: item.mrp,
              selling_price: item.selling_price,
              is_active: true,
              notes: notes
                ? existingBatch.notes
                  ? `${existingBatch.notes}\n[${new Date().toISOString()}] Added ${item.quantity} units via invoice ${invoice_number || "N/A"}`
                  : `[${new Date().toISOString()}] Added ${item.quantity} units via invoice ${invoice_number || "N/A"}`
                : existingBatch.notes,
            },
            include: {
              product: {
                select: { id: true, name: true, unit: true },
              },
              supplier: {
                select: { id: true, name: true },
              },
            },
          });
          batches.push({ ...updatedBatch, action: "updated" });
        } else {
          // Create new batch
          const newBatch = await tx.inventoryBatch.create({
            data: {
              batch_number: item.batch_number.trim(),
              expiry_date: new Date(item.expiry_date),
              quantity: item.quantity,
              original_qty: item.quantity,
              purchase_price: item.purchase_price,
              mrp: item.mrp,
              selling_price: item.selling_price,
              received_date: receivedAt,
              invoice_number: invoice_number?.trim() || null,
              notes: notes?.trim() || null,
              is_active: true,
              product_id: item.product_id,
              supplier_id: supplier_id,
              clinic_id: access.clinicId,
            },
            include: {
              product: {
                select: { id: true, name: true, unit: true },
              },
              supplier: {
                select: { id: true, name: true },
              },
            },
          });
          batches.push({ ...newBatch, action: "created" });
        }
      }

      return batches;
    });

    // Calculate summary
    const summary = {
      total_items: createdBatches.length,
      created: createdBatches.filter((b) => b.action === "created").length,
      updated: createdBatches.filter((b) => b.action === "updated").length,
      total_quantity: items.reduce((sum, item) => sum + item.quantity, 0),
      total_value: items.reduce((sum, item) => sum + item.purchase_price * item.quantity, 0),
    };

    return NextResponse.json({
      success: true,
      batches: createdBatches,
      summary,
      invoice_number: invoice_number || null,
      supplier: supplier,
    }, { status: 201 });
  } catch (error) {
    console.error("Error receiving stock:", error);
    return NextResponse.json(
      { error: "Failed to receive stock" },
      { status: 500 }
    );
  }
}
