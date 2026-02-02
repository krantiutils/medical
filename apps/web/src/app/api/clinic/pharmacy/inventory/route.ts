import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@swasthya/database";

// GET /api/clinic/pharmacy/inventory - Get inventory data for dashboard
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

    const searchParams = request.nextUrl.searchParams;
    const view = searchParams.get("view") || "overview"; // overview, low-stock, expiring, adjustments
    const expiryDays = parseInt(searchParams.get("expiryDays") || "30");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const sixtyDays = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const ninetyDays = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    const expiryDate = new Date(now.getTime() + expiryDays * 24 * 60 * 60 * 1000);

    if (view === "overview") {
      // Get summary statistics
      const [
        totalProducts,
        activeProducts,
        totalBatches,
        lowStockProducts,
        expiring30Days,
        expiring60Days,
        expiring90Days,
        expiredBatches,
        totalStockValue,
      ] = await Promise.all([
        // Total products count
        prisma.product.count({
          where: { clinic_id: clinic.id },
        }),
        // Active products count
        prisma.product.count({
          where: { clinic_id: clinic.id, is_active: true },
        }),
        // Total active batches count
        prisma.inventoryBatch.count({
          where: {
            clinic_id: clinic.id,
            is_active: true,
            quantity: { gt: 0 },
          },
        }),
        // Low stock products
        prisma.$queryRaw<{ count: bigint }[]>`
          SELECT COUNT(DISTINCT p.id) as count
          FROM "Product" p
          LEFT JOIN "InventoryBatch" b ON p.id = b.product_id AND b.is_active = true AND b.quantity > 0
          WHERE p.clinic_id = ${clinic.id}
            AND p.is_active = true
            AND p.min_stock_level > 0
          GROUP BY p.id
          HAVING COALESCE(SUM(b.quantity), 0) <= p.min_stock_level
        `.then(rows => rows.length),
        // Expiring in 30 days
        prisma.inventoryBatch.count({
          where: {
            clinic_id: clinic.id,
            is_active: true,
            quantity: { gt: 0 },
            expiry_date: { lte: thirtyDays, gt: now },
          },
        }),
        // Expiring in 60 days
        prisma.inventoryBatch.count({
          where: {
            clinic_id: clinic.id,
            is_active: true,
            quantity: { gt: 0 },
            expiry_date: { lte: sixtyDays, gt: thirtyDays },
          },
        }),
        // Expiring in 90 days
        prisma.inventoryBatch.count({
          where: {
            clinic_id: clinic.id,
            is_active: true,
            quantity: { gt: 0 },
            expiry_date: { lte: ninetyDays, gt: sixtyDays },
          },
        }),
        // Expired batches (still in stock)
        prisma.inventoryBatch.count({
          where: {
            clinic_id: clinic.id,
            is_active: true,
            quantity: { gt: 0 },
            expiry_date: { lte: now },
          },
        }),
        // Total stock value (MRP * quantity)
        prisma.inventoryBatch.aggregate({
          where: {
            clinic_id: clinic.id,
            is_active: true,
            quantity: { gt: 0 },
          },
          _sum: {
            quantity: true,
          },
        }),
      ]);

      // Calculate stock value using raw query for precision
      const stockValueResult = await prisma.$queryRaw<{ total: number }[]>`
        SELECT COALESCE(SUM(b.mrp * b.quantity), 0)::float as total
        FROM "InventoryBatch" b
        WHERE b.clinic_id = ${clinic.id}
          AND b.is_active = true
          AND b.quantity > 0
      `;

      return NextResponse.json({
        overview: {
          totalProducts,
          activeProducts,
          totalBatches,
          lowStockProducts,
          expiring: {
            in30Days: expiring30Days,
            in60Days: expiring60Days,
            in90Days: expiring90Days,
            expired: expiredBatches,
          },
          totalStockValue: stockValueResult[0]?.total || 0,
          totalUnits: totalStockValue._sum.quantity || 0,
        },
      });
    }

    if (view === "low-stock") {
      // Get products with low stock
      const lowStockQuery = await prisma.product.findMany({
        where: {
          clinic_id: clinic.id,
          is_active: true,
          min_stock_level: { gt: 0 },
        },
        include: {
          supplier: {
            select: { id: true, name: true },
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
              batch_number: true,
              selling_price: true,
            },
          },
        },
        orderBy: { name: "asc" },
      });

      // Filter products where total stock <= min_stock_level
      const lowStockProducts = lowStockQuery
        .map((product) => {
          const totalStock = product.batches.reduce((sum, b) => sum + b.quantity, 0);
          const nearestExpiry = product.batches.length > 0
            ? product.batches.reduce((min, b) =>
                new Date(b.expiry_date) < new Date(min) ? b.expiry_date.toISOString() : min,
                product.batches[0].expiry_date.toISOString()
              )
            : null;
          return {
            ...product,
            totalStock,
            nearestExpiry,
            stockDeficit: product.min_stock_level - totalStock,
          };
        })
        .filter((p) => p.totalStock <= p.min_stock_level)
        .sort((a, b) => b.stockDeficit - a.stockDeficit);

      const paginatedProducts = lowStockProducts.slice(offset, offset + limit);

      return NextResponse.json({
        products: paginatedProducts,
        pagination: {
          total: lowStockProducts.length,
          page,
          limit,
          totalPages: Math.ceil(lowStockProducts.length / limit),
        },
      });
    }

    if (view === "expiring") {
      // Get batches expiring within specified days
      const expiringBatches = await prisma.inventoryBatch.findMany({
        where: {
          clinic_id: clinic.id,
          is_active: true,
          quantity: { gt: 0 },
          expiry_date: { lte: expiryDate },
        },
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
            select: { id: true, name: true },
          },
        },
        orderBy: { expiry_date: "asc" },
        skip: offset,
        take: limit,
      });

      const totalExpiring = await prisma.inventoryBatch.count({
        where: {
          clinic_id: clinic.id,
          is_active: true,
          quantity: { gt: 0 },
          expiry_date: { lte: expiryDate },
        },
      });

      // Add days until expiry and expired flag
      const batchesWithExpiry = expiringBatches.map((batch) => {
        const daysUntilExpiry = Math.ceil(
          (new Date(batch.expiry_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        return {
          ...batch,
          daysUntilExpiry,
          isExpired: daysUntilExpiry <= 0,
          expiryStatus: daysUntilExpiry <= 0 ? "expired" :
                        daysUntilExpiry <= 30 ? "critical" :
                        daysUntilExpiry <= 60 ? "warning" : "caution",
        };
      });

      return NextResponse.json({
        batches: batchesWithExpiry,
        pagination: {
          total: totalExpiring,
          page,
          limit,
          totalPages: Math.ceil(totalExpiring / limit),
        },
      });
    }

    return NextResponse.json({ error: "Invalid view parameter" }, { status: 400 });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/clinic/pharmacy/inventory - Stock adjustment
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
    const { batchId, adjustmentType, quantity, reason, notes } = body;

    if (!batchId || !adjustmentType || quantity === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: batchId, adjustmentType, quantity" },
        { status: 400 }
      );
    }

    // Valid adjustment types
    const validTypes = ["damage", "loss", "theft", "expired", "found", "correction", "other"];
    if (!validTypes.includes(adjustmentType)) {
      return NextResponse.json(
        { error: `Invalid adjustment type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Find the batch and verify it belongs to this clinic
    const batch = await prisma.inventoryBatch.findFirst({
      where: {
        id: batchId,
        clinic_id: clinic.id,
        is_active: true,
      },
      include: {
        product: {
          select: { id: true, name: true },
        },
      },
    });

    if (!batch) {
      return NextResponse.json(
        { error: "Batch not found or inactive" },
        { status: 404 }
      );
    }

    // Calculate new quantity
    const adjustmentQty = parseInt(quantity);
    const isIncrease = ["found", "correction"].includes(adjustmentType) && adjustmentQty > 0;
    const newQuantity = isIncrease
      ? batch.quantity + Math.abs(adjustmentQty)
      : batch.quantity - Math.abs(adjustmentQty);

    if (newQuantity < 0) {
      return NextResponse.json(
        { error: `Cannot reduce stock below 0. Current quantity: ${batch.quantity}` },
        { status: 400 }
      );
    }

    // Update the batch
    const updatedBatch = await prisma.inventoryBatch.update({
      where: { id: batchId },
      data: {
        quantity: newQuantity,
        is_active: newQuantity > 0,
        notes: batch.notes
          ? `${batch.notes}\n[${new Date().toISOString()}] ${adjustmentType.toUpperCase()}: ${isIncrease ? '+' : '-'}${Math.abs(adjustmentQty)} - ${reason || ''} ${notes ? `(${notes})` : ''}`
          : `[${new Date().toISOString()}] ${adjustmentType.toUpperCase()}: ${isIncrease ? '+' : '-'}${Math.abs(adjustmentQty)} - ${reason || ''} ${notes ? `(${notes})` : ''}`,
        updated_at: new Date(),
      },
      include: {
        product: {
          select: { id: true, name: true, unit: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      batch: updatedBatch,
      adjustment: {
        type: adjustmentType,
        quantity: adjustmentQty,
        previousQuantity: batch.quantity,
        newQuantity,
        isIncrease,
      },
    });
  } catch (error) {
    console.error("Error adjusting stock:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
