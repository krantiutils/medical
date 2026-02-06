import { ClinicStaffRole } from "@swasthya/database";

/**
 * Permission definitions for each clinic staff role.
 *
 * Permission format:
 * - Simple: "dashboard", "patients", "billing"
 * - Scoped: "patients:vitals", "lab:view", "schedules:own", "reports:financial"
 * - Wildcard: "*" (full access, only for OWNER)
 *
 * When checking permissions:
 * - Exact match is checked first
 * - Then base permission is checked (e.g., "lab" matches "lab:view")
 */
export const ROLE_PERMISSIONS: Record<ClinicStaffRole, string[]> = {
  OWNER: ["*"], // Full access to everything
  ADMIN: [
    "dashboard",
    "reception",
    "patients",
    "appointments",
    "doctors",
    "schedules",
    "leaves",
    "billing",
    "services",
    "lab",
    "pharmacy",
    "ipd",
    "reports",
    "staff",
    "settings",
    "page-builder",
    "check-in",
    "consultations",
    "prescriptions",
  ],
  DOCTOR: [
    "dashboard",
    "patients",
    "consultations",
    "prescriptions",
    "lab:view",
    "lab:order",
    "schedules:own",
    "leaves:own",
    "check-in:own",
  ],
  RECEPTIONIST: [
    "dashboard",
    "reception",
    "patients",
    "appointments",
    "check-in",
  ],
  BILLING: [
    "dashboard",
    "billing",
    "invoices",
    "services",
    "reports:financial",
  ],
  LAB: [
    "dashboard",
    "lab",
    "patients:view",
  ],
  PHARMACY: [
    "dashboard",
    "pharmacy",
    "patients:view",
  ],
  NURSE: [
    "dashboard",
    "patients:vitals",
    "reception",
    "appointments:view",
    "check-in",
  ],
};

/**
 * Check if a role has a specific permission.
 *
 * @param role - The clinic staff role
 * @param permission - The permission to check (e.g., "dashboard", "lab:view", "patients:vitals")
 * @returns true if the role has the permission
 *
 * @example
 * hasPermission("OWNER", "anything") // true (wildcard)
 * hasPermission("DOCTOR", "consultations") // true (exact match)
 * hasPermission("DOCTOR", "lab:view") // true (exact match)
 * hasPermission("ADMIN", "lab:view") // true (base "lab" permission covers "lab:view")
 * hasPermission("NURSE", "patients") // false (only has "patients:vitals")
 */
export function hasPermission(role: ClinicStaffRole, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role];

  if (!permissions) {
    return false;
  }

  // Wildcard grants all permissions
  if (permissions.includes("*")) {
    return true;
  }

  // Exact match
  if (permissions.includes(permission)) {
    return true;
  }

  // Check if role has base permission that covers the scoped permission
  // e.g., having "lab" permission should grant "lab:view", "lab:order", etc.
  const [base] = permission.split(":");
  if (base !== permission && permissions.includes(base)) {
    return true;
  }

  return false;
}

/**
 * Get all permissions for a role (expanded, not including "*").
 * Useful for debugging or displaying what a role can access.
 */
export function getRolePermissions(role: ClinicStaffRole): string[] {
  const permissions = ROLE_PERMISSIONS[role];
  if (permissions.includes("*")) {
    // Return all known permissions for OWNER
    return Object.values(ROLE_PERMISSIONS)
      .flat()
      .filter((p) => p !== "*")
      .filter((p, i, arr) => arr.indexOf(p) === i); // unique
  }
  return [...permissions];
}

/**
 * Permission groups for organizing UI elements (e.g., sidebar navigation).
 */
export const PERMISSION_GROUPS = {
  clinical: ["consultations", "prescriptions", "patients", "lab", "ipd"],
  administrative: ["reception", "appointments", "schedules", "leaves", "check-in", "doctors"],
  financial: ["billing", "invoices", "services", "reports"],
  pharmacy: ["pharmacy"],
  settings: ["staff", "settings", "page-builder"],
} as const;

/**
 * Human-readable labels for permissions.
 */
export const PERMISSION_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  reception: "Reception",
  patients: "Patients",
  "patients:view": "View Patients",
  "patients:vitals": "Record Vitals",
  appointments: "Appointments",
  "appointments:view": "View Appointments",
  doctors: "Manage Doctors",
  schedules: "Schedules",
  "schedules:own": "Own Schedule",
  leaves: "Leaves",
  "leaves:own": "Own Leaves",
  billing: "Billing",
  invoices: "Invoices",
  services: "Services",
  lab: "Laboratory",
  "lab:view": "View Lab Results",
  "lab:order": "Order Lab Tests",
  pharmacy: "Pharmacy",
  ipd: "IPD Management",
  reports: "Reports",
  "reports:financial": "Financial Reports",
  staff: "Staff Management",
  settings: "Settings",
  "page-builder": "Page Builder",
  "check-in": "Doctor Check-in",
  "check-in:own": "Own Check-in",
  consultations: "Consultations",
  prescriptions: "Prescriptions",
};

/**
 * Human-readable labels for roles.
 */
export const ROLE_LABELS: Record<ClinicStaffRole, string> = {
  OWNER: "Owner",
  ADMIN: "Administrator",
  DOCTOR: "Doctor",
  RECEPTIONIST: "Receptionist",
  BILLING: "Billing Staff",
  LAB: "Lab Technician",
  PHARMACY: "Pharmacy Staff",
  NURSE: "Nurse",
};

/**
 * Role descriptions for UI display.
 */
export const ROLE_DESCRIPTIONS: Record<ClinicStaffRole, string> = {
  OWNER: "Full access to all clinic features including deletion",
  ADMIN: "Full access except clinic deletion; can manage staff",
  DOCTOR: "Clinical access: consultations, prescriptions, lab orders",
  RECEPTIONIST: "Front desk: reception, appointments, patient registration",
  BILLING: "Financial: invoices, payments, billing reports",
  LAB: "Laboratory: manage lab orders and results",
  PHARMACY: "Pharmacy: POS, inventory, suppliers",
  NURSE: "Nursing: vitals, basic clinical notes, reception support",
};
