import { headers } from "next/headers";
import { prisma, Prisma } from "@swasthya/database";

export type AuditAction =
  | "CLAIM_SUBMITTED"
  | "CLAIM_APPROVED"
  | "CLAIM_REJECTED"
  | "CLINIC_APPROVED"
  | "CLINIC_REJECTED"
  | "CLINIC_CHANGES_REQUESTED";

export interface AuditLogParams {
  action: AuditAction;
  targetType: string;
  targetId: string;
  actorId?: string;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Log an audit event to the database.
 * Fails silently - errors are logged but don't break the main flow.
 */
export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    // Get request headers for IP and user agent
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    const realIp = headersList.get("x-real-ip");
    const userAgent = headersList.get("user-agent");

    // Extract IP address (handle x-forwarded-for having multiple IPs)
    let ipAddress: string | null = null;
    if (forwardedFor) {
      ipAddress = forwardedFor.split(",")[0].trim();
    } else if (realIp) {
      ipAddress = realIp;
    }

    await prisma.auditLog.create({
      data: {
        action: params.action,
        target_type: params.targetType,
        target_id: params.targetId,
        actor_id: params.actorId || null,
        metadata: params.metadata ?? undefined,
        ip_address: ipAddress,
        user_agent: userAgent || null,
      },
    });

    console.log(
      `[Audit] ${params.action} on ${params.targetType}:${params.targetId}` +
        (params.actorId ? ` by ${params.actorId}` : "")
    );
  } catch (error) {
    // Log the error but don't throw - audit logging should never break main flow
    console.error("[Audit] Failed to log audit event:", error);
    console.error("[Audit] Event details:", params);
  }
}

/**
 * Log a claim submission event
 */
export async function logClaimSubmitted(
  verificationRequestId: string,
  userId: string,
  professionalId: string,
  professionalName: string
): Promise<void> {
  return logAudit({
    action: "CLAIM_SUBMITTED",
    targetType: "VerificationRequest",
    targetId: verificationRequestId,
    actorId: userId,
    metadata: {
      professional_id: professionalId,
      professional_name: professionalName,
    },
  });
}

/**
 * Log a claim approval event
 */
export async function logClaimApproved(
  verificationRequestId: string,
  adminId: string,
  userId: string,
  professionalId: string,
  professionalName: string
): Promise<void> {
  return logAudit({
    action: "CLAIM_APPROVED",
    targetType: "VerificationRequest",
    targetId: verificationRequestId,
    actorId: adminId,
    metadata: {
      user_id: userId,
      professional_id: professionalId,
      professional_name: professionalName,
    },
  });
}

/**
 * Log a claim rejection event
 */
export async function logClaimRejected(
  verificationRequestId: string,
  adminId: string,
  userId: string,
  professionalId: string,
  professionalName: string,
  rejectionReason: string
): Promise<void> {
  return logAudit({
    action: "CLAIM_REJECTED",
    targetType: "VerificationRequest",
    targetId: verificationRequestId,
    actorId: adminId,
    metadata: {
      user_id: userId,
      professional_id: professionalId,
      professional_name: professionalName,
      rejection_reason: rejectionReason,
    },
  });
}

/**
 * Log a clinic approval event
 */
export async function logClinicApproved(
  clinicId: string,
  adminId: string,
  ownerId: string | null,
  clinicName: string
): Promise<void> {
  return logAudit({
    action: "CLINIC_APPROVED",
    targetType: "Clinic",
    targetId: clinicId,
    actorId: adminId,
    metadata: {
      owner_id: ownerId,
      clinic_name: clinicName,
    },
  });
}

/**
 * Log a clinic rejection event
 */
export async function logClinicRejected(
  clinicId: string,
  adminId: string,
  ownerId: string | null,
  clinicName: string,
  rejectionReason: string
): Promise<void> {
  return logAudit({
    action: "CLINIC_REJECTED",
    targetType: "Clinic",
    targetId: clinicId,
    actorId: adminId,
    metadata: {
      owner_id: ownerId,
      clinic_name: clinicName,
      rejection_reason: rejectionReason,
    },
  });
}

/**
 * Log a clinic changes requested event
 */
export async function logClinicChangesRequested(
  clinicId: string,
  adminId: string,
  ownerId: string | null,
  clinicName: string,
  notes: string
): Promise<void> {
  return logAudit({
    action: "CLINIC_CHANGES_REQUESTED",
    targetType: "Clinic",
    targetId: clinicId,
    actorId: adminId,
    metadata: {
      owner_id: ownerId,
      clinic_name: clinicName,
      notes,
    },
  });
}
