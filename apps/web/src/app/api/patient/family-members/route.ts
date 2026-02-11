import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma, FamilyRelation } from "@swasthya/database";
import { authOptions } from "@/lib/auth";

const VALID_RELATIONS: string[] = Object.values(FamilyRelation);
const VALID_GENDERS = ["male", "female", "other"];
const VALID_BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

/**
 * GET /api/patient/family-members
 * List all family members for the authenticated user.
 */
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const familyMembers = await prisma.familyMember.findMany({
    where: { user_id: session.user.id },
    orderBy: { created_at: "asc" },
  });

  return NextResponse.json({ family_members: familyMembers });
}

/**
 * POST /api/patient/family-members
 * Create a new family member.
 *
 * Body:
 * - name: string (required)
 * - relation: FamilyRelation (required)
 * - date_of_birth: string (optional, ISO date)
 * - gender: string (optional)
 * - blood_group: string (optional)
 * - phone: string (optional)
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, relation, date_of_birth, gender, blood_group, phone } = body;

  // Validate required fields
  if (!name || !name.trim()) {
    return NextResponse.json(
      { error: "Name is required" },
      { status: 400 }
    );
  }

  if (!relation) {
    return NextResponse.json(
      { error: "Relation is required" },
      { status: 400 }
    );
  }

  if (!VALID_RELATIONS.includes(relation)) {
    return NextResponse.json(
      { error: `Invalid relation. Must be one of: ${VALID_RELATIONS.join(", ")}` },
      { status: 400 }
    );
  }

  // Validate optional fields
  if (gender && !VALID_GENDERS.includes(gender)) {
    return NextResponse.json(
      { error: `Invalid gender. Must be one of: ${VALID_GENDERS.join(", ")}` },
      { status: 400 }
    );
  }

  if (blood_group && !VALID_BLOOD_GROUPS.includes(blood_group)) {
    return NextResponse.json(
      { error: `Invalid blood group. Must be one of: ${VALID_BLOOD_GROUPS.join(", ")}` },
      { status: 400 }
    );
  }

  if (phone) {
    const phoneRegex = /^(98|97)\d{8}$/;
    const cleanPhone = phone.replace(/\s/g, "");
    if (!phoneRegex.test(cleanPhone)) {
      return NextResponse.json(
        { error: "Invalid phone number format. Must be 10 digits starting with 98 or 97." },
        { status: 400 }
      );
    }
  }

  let parsedDob: Date | null = null;
  if (date_of_birth) {
    parsedDob = new Date(date_of_birth);
    if (isNaN(parsedDob.getTime())) {
      return NextResponse.json(
        { error: "Invalid date_of_birth format" },
        { status: 400 }
      );
    }
    if (parsedDob > new Date()) {
      return NextResponse.json(
        { error: "Date of birth cannot be in the future" },
        { status: 400 }
      );
    }
  }

  // Limit family members to 10 per user
  const existingCount = await prisma.familyMember.count({
    where: { user_id: session.user.id },
  });

  if (existingCount >= 10) {
    return NextResponse.json(
      { error: "Maximum of 10 family members allowed" },
      { status: 400 }
    );
  }

  const familyMember = await prisma.familyMember.create({
    data: {
      user_id: session.user.id,
      name: name.trim(),
      relation: relation as FamilyRelation,
      date_of_birth: parsedDob,
      gender: gender || null,
      blood_group: blood_group || null,
      phone: phone?.replace(/\s/g, "") || null,
    },
  });

  return NextResponse.json(
    { success: true, family_member: familyMember },
    { status: 201 }
  );
}
