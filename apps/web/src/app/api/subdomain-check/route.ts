import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@swasthya/database";

/**
 * Internal endpoint used by middleware to detect subdomain type.
 * Middleware runs in edge runtime where Prisma can't execute,
 * so it fetches this Node.js route handler instead.
 */
export async function GET(request: NextRequest) {
  const sub = request.nextUrl.searchParams.get("sub");
  if (!sub) {
    return NextResponse.json({ type: null });
  }

  // Check clinic first
  const clinic = await prisma.clinic.findFirst({
    where: { slug: sub, verified: true },
    select: { id: true },
  });
  if (clinic) {
    return NextResponse.json({ type: "clinic" });
  }

  // Check doctor subdomain
  const doctor = await prisma.professional.findFirst({
    where: {
      subdomain: sub,
      subdomain_enabled: true,
      verified: true,
    },
    select: { id: true },
  });
  if (doctor) {
    return NextResponse.json({ type: "doctor" });
  }

  return NextResponse.json({ type: null });
}
