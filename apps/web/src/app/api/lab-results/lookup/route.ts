import { NextRequest, NextResponse } from "next/server";
import { prisma, LabResultFlag, LabOrderStatus } from "@swasthya/database";

/**
 * Simple in-memory rate limiter for the public lookup endpoint.
 * In production, consider using Redis or a proper rate limiting middleware.
 */
const rateLimiter = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 10; // Max 10 requests per minute per IP

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimiter.get(ip);

  if (!entry || entry.resetAt < now) {
    rateLimiter.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  entry.count++;
  return true;
}

// Clean up old entries periodically (in memory, so restart clears it)
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimiter.entries()) {
    if (value.resetAt < now) {
      rateLimiter.delete(key);
    }
  }
}, RATE_LIMIT_WINDOW_MS);

interface LabResultResponse {
  found: boolean;
  order?: {
    id: string;
    order_number: string;
    status: LabOrderStatus;
    priority: string;
    created_at: string;
    completed_at: string | null;
    patient_name: string; // Only first name for privacy
    clinic: {
      name: string;
      address: string | null;
      phone: string | null;
    };
    results?: {
      test_name: string;
      category: string | null;
      result_value: string | null;
      unit: string | null;
      normal_range: string | null;
      flag: LabResultFlag | null;
      remarks: string | null;
    }[];
  };
  message?: string;
}

/**
 * GET /api/lab-results/lookup
 *
 * Public endpoint for walk-in patients to check their lab results.
 * Requires phone number and order number for lookup.
 *
 * Query params:
 * - phone: Patient's phone number (required)
 * - order_number: Lab order number in format LAB-YYYYMMDD-XXXX (required)
 */
export async function GET(request: NextRequest): Promise<NextResponse<LabResultResponse>> {
  try {
    // Get client IP for rate limiting
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown";

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { found: false, message: "Too many requests. Please try again in a minute." },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");
    const orderNumber = searchParams.get("order_number");

    // Validate required params
    if (!phone || !orderNumber) {
      return NextResponse.json(
        { found: false, message: "Phone number and order number are required" },
        { status: 400 }
      );
    }

    // Clean phone number (remove spaces)
    const cleanPhone = phone.replace(/\s/g, "");

    // Validate phone format (basic validation for Nepali phone numbers)
    if (!/^(98|97|96|0)\d{7,9}$/.test(cleanPhone)) {
      return NextResponse.json(
        { found: false, message: "Invalid phone number format" },
        { status: 400 }
      );
    }

    // Validate order number format
    if (!/^LAB-\d{8}-\d{4}$/.test(orderNumber)) {
      return NextResponse.json(
        { found: false, message: "Invalid order number format. Expected: LAB-XXXXXXXX-XXXX" },
        { status: 400 }
      );
    }

    // Find the lab order
    // We need to find a patient with this phone number who has a lab order with this order number
    const labOrder = await prisma.labOrder.findFirst({
      where: {
        order_number: orderNumber,
        patient: {
          phone: cleanPhone,
        },
      },
      include: {
        patient: {
          select: {
            full_name: true,
          },
        },
        clinic: {
          select: {
            name: true,
            address: true,
            phone: true,
          },
        },
        results: {
          include: {
            lab_test: {
              select: {
                name: true,
                category: true,
                unit: true,
                normal_range: true,
              },
            },
          },
        },
      },
    });

    if (!labOrder) {
      return NextResponse.json(
        { found: false, message: "No lab order found with the provided details. Please check your phone number and order number." },
        { status: 404 }
      );
    }

    // Extract first name only for privacy
    const fullName = labOrder.patient.full_name;
    const firstName = fullName.split(" ")[0];

    // Build response based on order status
    const response: LabResultResponse = {
      found: true,
      order: {
        id: labOrder.id,
        order_number: labOrder.order_number,
        status: labOrder.status,
        priority: labOrder.priority,
        created_at: labOrder.created_at.toISOString(),
        completed_at: labOrder.completed_at?.toISOString() || null,
        patient_name: firstName,
        clinic: {
          name: labOrder.clinic.name,
          address: labOrder.clinic.address,
          phone: labOrder.clinic.phone,
        },
      },
    };

    // Only include detailed results if order is completed
    if (labOrder.status === "COMPLETED") {
      response.order!.results = labOrder.results.map((result) => ({
        test_name: result.lab_test.name,
        category: result.lab_test.category,
        result_value: result.result_value,
        unit: result.unit || result.lab_test.unit,
        normal_range: result.normal_range || result.lab_test.normal_range,
        flag: result.flag,
        remarks: result.remarks,
      }));
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error looking up lab results:", error);
    return NextResponse.json(
      { found: false, message: "An error occurred while looking up results. Please try again later." },
      { status: 500 }
    );
  }
}
