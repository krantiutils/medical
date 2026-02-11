import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma, FamilyRelation } from "@swasthya/database";
import { authOptions } from "@/lib/auth";

const VALID_RELATIONS: string[] = Object.values(FamilyRelation);
const VALID_GENDERS = ["male", "female", "other"];
const VALID_BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

/**
 * GET /api/patient/family-members/[id]
 * Get a specific family member.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const familyMember = await prisma.familyMember.findFirst({
    where: { id, user_id: session.user.id },
  });

  if (!familyMember) {
    return NextResponse.json(
      { error: "Family member not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ family_member: familyMember });
}

/**
 * PUT /api/patient/family-members/[id]
 * Update a family member.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership
  const existing = await prisma.familyMember.findFirst({
    where: { id, user_id: session.user.id },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Family member not found" },
      { status: 404 }
    );
  }

  const body = await request.json();
  const { name, relation, date_of_birth, gender, blood_group, phone } = body;

  // Build update data - only include provided fields
  const updateData: Record<string, unknown> = {};

  if (name !== undefined) {
    if (!name.trim()) {
      return NextResponse.json(
        { error: "Name cannot be empty" },
        { status: 400 }
      );
    }
    updateData.name = name.trim();
  }

  if (relation !== undefined) {
    if (!VALID_RELATIONS.includes(relation)) {
      return NextResponse.json(
        { error: `Invalid relation. Must be one of: ${VALID_RELATIONS.join(", ")}` },
        { status: 400 }
      );
    }
    updateData.relation = relation;
  }

  if (date_of_birth !== undefined) {
    if (date_of_birth === null) {
      updateData.date_of_birth = null;
    } else {
      const parsed = new Date(date_of_birth);
      if (isNaN(parsed.getTime())) {
        return NextResponse.json(
          { error: "Invalid date_of_birth format" },
          { status: 400 }
        );
      }
      if (parsed > new Date()) {
        return NextResponse.json(
          { error: "Date of birth cannot be in the future" },
          { status: 400 }
        );
      }
      updateData.date_of_birth = parsed;
    }
  }

  if (gender !== undefined) {
    if (gender !== null && !VALID_GENDERS.includes(gender)) {
      return NextResponse.json(
        { error: `Invalid gender. Must be one of: ${VALID_GENDERS.join(", ")}` },
        { status: 400 }
      );
    }
    updateData.gender = gender;
  }

  if (blood_group !== undefined) {
    if (blood_group !== null && !VALID_BLOOD_GROUPS.includes(blood_group)) {
      return NextResponse.json(
        { error: `Invalid blood group. Must be one of: ${VALID_BLOOD_GROUPS.join(", ")}` },
        { status: 400 }
      );
    }
    updateData.blood_group = blood_group;
  }

  if (phone !== undefined) {
    if (phone === null) {
      updateData.phone = null;
    } else {
      const phoneRegex = /^(98|97)\d{8}$/;
      const cleanPhone = phone.replace(/\s/g, "");
      if (!phoneRegex.test(cleanPhone)) {
        return NextResponse.json(
          { error: "Invalid phone number format. Must be 10 digits starting with 98 or 97." },
          { status: 400 }
        );
      }
      updateData.phone = cleanPhone;
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "No fields to update" },
      { status: 400 }
    );
  }

  const familyMember = await prisma.familyMember.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ success: true, family_member: familyMember });
}

/**
 * DELETE /api/patient/family-members/[id]
 * Delete a family member.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership
  const existing = await prisma.familyMember.findFirst({
    where: { id, user_id: session.user.id },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Family member not found" },
      { status: 404 }
    );
  }

  await prisma.familyMember.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
