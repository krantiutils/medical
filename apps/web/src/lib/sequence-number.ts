import { prisma } from "@swasthya/database";

/**
 * Atomically increment and return the next sequence number for a given entity.
 *
 * Uses PostgreSQL's INSERT ... ON CONFLICT DO UPDATE (upsert) with atomic
 * value = value + 1 to guarantee unique numbers even under concurrent requests.
 */
export async function nextSequenceNumber({
  clinicId,
  entity,
  scope = "global",
}: {
  clinicId: string;
  entity: string;
  scope?: string;
}): Promise<number> {
  const result = await prisma.$queryRawUnsafe<[{ value: number }]>(
    `INSERT INTO "ClinicCounter" (id, clinic_id, entity, scope, value, created_at, updated_at)
     VALUES (gen_random_uuid(), $1, $2, $3, 1, now(), now())
     ON CONFLICT (clinic_id, entity, scope)
     DO UPDATE SET value = "ClinicCounter".value + 1, updated_at = now()
     RETURNING value`,
    clinicId,
    entity,
    scope
  );

  return result[0].value;
}

// ── Date helpers (Nepal timezone: Asia/Kathmandu, UTC+5:45) ──────────

function nepalDateParts(): { year: string; month: string; day: string } {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Kathmandu",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return { year: get("year"), month: get("month"), day: get("day") };
}

function nepalDateStr(): string {
  const { year, month, day } = nepalDateParts();
  return `${year}${month}${day}`;
}

function nepalYearStr(): string {
  return nepalDateParts().year;
}

function nepalMonthStr(): string {
  const { year, month } = nepalDateParts();
  return `${year}${month}`;
}

// ── Convenience wrappers ───────────────────────────────────────────────

/**
 * Next patient number: P-000001
 */
export async function nextPatientNumber(clinicId: string): Promise<string> {
  const n = await nextSequenceNumber({ clinicId, entity: "patient" });
  return `P-${n.toString().padStart(6, "0")}`;
}

/**
 * Next invoice number: INV-2026-0001
 */
export async function nextInvoiceNumber(clinicId: string): Promise<string> {
  const year = nepalYearStr();
  const n = await nextSequenceNumber({ clinicId, entity: "invoice", scope: year });
  return `INV-${year}-${n.toString().padStart(4, "0")}`;
}

/**
 * Next lab order number: LAB-20260220-0001
 */
export async function nextLabOrderNumber(clinicId: string): Promise<string> {
  const dateStr = nepalDateStr();
  const n = await nextSequenceNumber({ clinicId, entity: "lab_order", scope: dateStr });
  return `LAB-${dateStr}-${n.toString().padStart(4, "0")}`;
}

/**
 * Next sale number: SALE-20260220-0001
 */
export async function nextSaleNumber(clinicId: string): Promise<string> {
  const dateStr = nepalDateStr();
  const n = await nextSequenceNumber({ clinicId, entity: "sale", scope: dateStr });
  return `SALE-${dateStr}-${n.toString().padStart(4, "0")}`;
}

/**
 * Next admission number: ADM-202602-0001
 */
export async function nextAdmissionNumber(clinicId: string): Promise<string> {
  const monthStr = nepalMonthStr();
  const n = await nextSequenceNumber({ clinicId, entity: "admission", scope: monthStr });
  return `ADM-${monthStr}-${n.toString().padStart(4, "0")}`;
}

/**
 * Next prescription number: RX-2026-0001
 */
export async function nextPrescriptionNumber(clinicId: string): Promise<string> {
  const year = nepalYearStr();
  const n = await nextSequenceNumber({ clinicId, entity: "prescription", scope: year });
  return `RX-${year}-${n.toString().padStart(4, "0")}`;
}

/**
 * Next token number for a given date (resets daily): 1, 2, 3, ...
 * Uses Nepal timezone for date boundary.
 */
export async function nextTokenNumber(clinicId: string, _date?: Date): Promise<number> {
  const dateStr = nepalDateStr();
  return nextSequenceNumber({ clinicId, entity: "token", scope: dateStr });
}
