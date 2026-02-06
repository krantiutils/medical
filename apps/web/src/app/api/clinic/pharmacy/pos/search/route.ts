import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@swasthya/database";
import { requireClinicPermission } from "@/lib/require-clinic-access";

// GET /api/clinic/pharmacy/pos/search - Search products with available batches for POS
export async function GET(request: NextRequest) {
  try {
    const access = await requireClinicPermission("pharmacy");
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: access.message },
        { status: access.reason === "unauthenticated" ? 401 : 403 }
      );
    }

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";
    const barcode = searchParams.get("barcode") || "";

    // Build where clause
    const where: Record<string, unknown> = {
      clinic_id: access.clinicId,
      is_active: true,
    };

    if (barcode) {
      // Exact barcode match
      where.barcode = barcode;
    } else if (query) {
      // Search by name, generic name, or barcode
      where.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { generic_name: { contains: query, mode: "insensitive" } },
        { barcode: { contains: query, mode: "insensitive" } },
      ];
    } else {
      return NextResponse.json({ products: [] });
    }

    // Find products with available batches (not expired, has stock)
    const products = await prisma.product.findMany({
      where,
      include: {
        batches: {
          where: {
            is_active: true,
            quantity: { gt: 0 },
            expiry_date: { gt: new Date() }, // Not expired
          },
          orderBy: {
            expiry_date: "asc", // FEFO ordering
          },
          select: {
            id: true,
            batch_number: true,
            expiry_date: true,
            quantity: true,
            mrp: true,
            selling_price: true,
            purchase_price: true,
          },
        },
      },
      orderBy: { name: "asc" },
      take: 20,
    });

    // Calculate total stock for each product
    const productsWithStock = products
      .filter((product) => product.batches.length > 0) // Only products with available batches
      .map((product) => ({
        id: product.id,
        name: product.name,
        generic_name: product.generic_name,
        category: product.category,
        unit: product.unit,
        pack_size: product.pack_size,
        gst_rate: product.gst_rate.toString(),
        is_active: product.is_active,
        batches: product.batches.map((batch) => ({
          id: batch.id,
          batch_number: batch.batch_number,
          expiry_date: batch.expiry_date.toISOString(),
          quantity: batch.quantity,
          mrp: batch.mrp.toString(),
          selling_price: batch.selling_price.toString(),
          purchase_price: batch.purchase_price.toString(),
        })),
        totalStock: product.batches.reduce((sum, batch) => sum + batch.quantity, 0),
      }));

    return NextResponse.json({ products: productsWithStock });
  } catch (error) {
    console.error("Error searching products:", error);
    return NextResponse.json(
      { error: "Failed to search products" },
      { status: 500 }
    );
  }
}
