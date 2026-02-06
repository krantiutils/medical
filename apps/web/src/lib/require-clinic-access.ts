import { getServerSession } from "next-auth";
import { prisma, ClinicStaffRole } from "@swasthya/database";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/clinic-permissions";

/**
 * Result of a clinic access check.
 */
export interface ClinicAccessResult {
  /** Whether the user has access */
  hasAccess: true;
  /** The user's ID */
  userId: string;
  /** The clinic ID */
  clinicId: string;
  /** The clinic details */
  clinic: {
    id: string;
    name: string;
    slug: string;
    type: string;
    verified: boolean;
  };
  /** The user's role at this clinic */
  role: ClinicStaffRole;
  /** Whether the user is the clinic owner (via claimed_by_id, legacy check) */
  isLegacyOwner: boolean;
}

export interface ClinicAccessDenied {
  hasAccess: false;
  reason: "unauthenticated" | "no_clinic" | "no_access" | "permission_denied";
  message: string;
}

export type ClinicAccessCheckResult = ClinicAccessResult | ClinicAccessDenied;

/**
 * Get the user's clinic access information.
 *
 * This function checks:
 * 1. User is authenticated
 * 2. User has a ClinicStaff record for the clinic, OR
 * 3. User is the legacy owner (claimed_by_id matches)
 *
 * For backwards compatibility, if a user is the legacy owner (claimed_by_id)
 * but has no ClinicStaff record, they are treated as OWNER.
 *
 * @param clinicId - Optional clinic ID. If not provided, finds the user's primary clinic.
 * @returns Access result with role and clinic info, or denied result with reason.
 */
export async function getClinicAccess(
  clinicId?: string
): Promise<ClinicAccessCheckResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      hasAccess: false,
      reason: "unauthenticated",
      message: "Authentication required",
    };
  }

  const userId = session.user.id;

  // If clinicId is provided, check access to that specific clinic
  if (clinicId) {
    return checkClinicAccess(userId, clinicId);
  }

  // Otherwise, find the user's primary clinic
  // First, check ClinicStaff memberships
  const staffMembership = await prisma.clinicStaff.findFirst({
    where: { user_id: userId },
    include: {
      clinic: {
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          verified: true,
          claimed_by_id: true,
        },
      },
    },
    orderBy: { created_at: "asc" }, // Oldest membership first (likely primary)
  });

  if (staffMembership) {
    return {
      hasAccess: true,
      userId,
      clinicId: staffMembership.clinic.id,
      clinic: {
        id: staffMembership.clinic.id,
        name: staffMembership.clinic.name,
        slug: staffMembership.clinic.slug,
        type: staffMembership.clinic.type,
        verified: staffMembership.clinic.verified,
      },
      role: staffMembership.role,
      isLegacyOwner: staffMembership.clinic.claimed_by_id === userId,
    };
  }

  // Fallback: Check legacy ownership (claimed_by_id)
  const ownedClinic = await prisma.clinic.findFirst({
    where: {
      claimed_by_id: userId,
      verified: true,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      verified: true,
    },
  });

  if (ownedClinic) {
    // Legacy owner without ClinicStaff record - treat as OWNER
    return {
      hasAccess: true,
      userId,
      clinicId: ownedClinic.id,
      clinic: ownedClinic,
      role: ClinicStaffRole.OWNER,
      isLegacyOwner: true,
    };
  }

  return {
    hasAccess: false,
    reason: "no_clinic",
    message: "No clinic found for user",
  };
}

/**
 * Check if a user has access to a specific clinic.
 */
async function checkClinicAccess(
  userId: string,
  clinicId: string
): Promise<ClinicAccessCheckResult> {
  // First, check ClinicStaff membership
  const staffMembership = await prisma.clinicStaff.findUnique({
    where: {
      clinic_id_user_id: {
        clinic_id: clinicId,
        user_id: userId,
      },
    },
    include: {
      clinic: {
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          verified: true,
          claimed_by_id: true,
        },
      },
    },
  });

  if (staffMembership) {
    return {
      hasAccess: true,
      userId,
      clinicId: staffMembership.clinic.id,
      clinic: {
        id: staffMembership.clinic.id,
        name: staffMembership.clinic.name,
        slug: staffMembership.clinic.slug,
        type: staffMembership.clinic.type,
        verified: staffMembership.clinic.verified,
      },
      role: staffMembership.role,
      isLegacyOwner: staffMembership.clinic.claimed_by_id === userId,
    };
  }

  // Check legacy ownership
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      verified: true,
      claimed_by_id: true,
    },
  });

  if (!clinic) {
    return {
      hasAccess: false,
      reason: "no_clinic",
      message: "Clinic not found",
    };
  }

  if (clinic.claimed_by_id === userId) {
    // Legacy owner without ClinicStaff record
    return {
      hasAccess: true,
      userId,
      clinicId: clinic.id,
      clinic: {
        id: clinic.id,
        name: clinic.name,
        slug: clinic.slug,
        type: clinic.type,
        verified: clinic.verified,
      },
      role: ClinicStaffRole.OWNER,
      isLegacyOwner: true,
    };
  }

  return {
    hasAccess: false,
    reason: "no_access",
    message: "User does not have access to this clinic",
  };
}

/**
 * Require clinic access with a specific permission.
 *
 * @param permission - The permission required (e.g., "dashboard", "billing", "lab:view")
 * @param clinicId - Optional clinic ID. If not provided, uses user's primary clinic.
 * @returns Access result if permitted, denied result otherwise.
 */
export async function requireClinicPermission(
  permission: string,
  clinicId?: string
): Promise<ClinicAccessCheckResult> {
  const access = await getClinicAccess(clinicId);

  if (!access.hasAccess) {
    return access;
  }

  if (!hasPermission(access.role, permission)) {
    return {
      hasAccess: false,
      reason: "permission_denied",
      message: `Permission '${permission}' required. Your role (${access.role}) does not have this permission.`,
    };
  }

  return access;
}

/**
 * Helper to check multiple permissions (any of them).
 *
 * @param permissions - Array of permissions. User needs at least one.
 * @param clinicId - Optional clinic ID.
 */
export async function requireAnyClinicPermission(
  permissions: string[],
  clinicId?: string
): Promise<ClinicAccessCheckResult> {
  const access = await getClinicAccess(clinicId);

  if (!access.hasAccess) {
    return access;
  }

  const hasAny = permissions.some((p) => hasPermission(access.role, p));

  if (!hasAny) {
    return {
      hasAccess: false,
      reason: "permission_denied",
      message: `One of these permissions required: ${permissions.join(", ")}. Your role (${access.role}) does not have any of them.`,
    };
  }

  return access;
}

/**
 * Helper to check all permissions are present.
 *
 * @param permissions - Array of permissions. User needs all of them.
 * @param clinicId - Optional clinic ID.
 */
export async function requireAllClinicPermissions(
  permissions: string[],
  clinicId?: string
): Promise<ClinicAccessCheckResult> {
  const access = await getClinicAccess(clinicId);

  if (!access.hasAccess) {
    return access;
  }

  const missing = permissions.filter((p) => !hasPermission(access.role, p));

  if (missing.length > 0) {
    return {
      hasAccess: false,
      reason: "permission_denied",
      message: `Missing permissions: ${missing.join(", ")}. Your role (${access.role}) does not have these permissions.`,
    };
  }

  return access;
}
