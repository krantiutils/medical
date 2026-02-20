/**
 * One-time migration script to seed ClinicCounter table from existing data.
 *
 * Run BEFORE deploying code that uses the new atomic sequence numbers.
 *
 * Usage:
 *   cd packages/database
 *   npx tsx scripts/seed-counters.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding ClinicCounter table from existing data...\n");

  const clinics = await prisma.clinic.findMany({ select: { id: true, name: true } });
  console.log(`Found ${clinics.length} clinics.\n`);

  for (const clinic of clinics) {
    console.log(`\n── ${clinic.name} (${clinic.id}) ──`);

    // 1. Patient counter (global scope)
    const patientCount = await prisma.patient.count({ where: { clinic_id: clinic.id } });
    if (patientCount > 0) {
      await upsertCounter(clinic.id, "patient", "global", patientCount);
      console.log(`  patient: ${patientCount}`);
    }

    // 2. Invoice counters (per-year scope)
    const invoiceYears = await prisma.$queryRawUnsafe<{ year: number; cnt: bigint }[]>(
      `SELECT EXTRACT(YEAR FROM created_at)::int AS year, COUNT(*)::bigint AS cnt
       FROM "Invoice" WHERE clinic_id = $1 GROUP BY year ORDER BY year`,
      clinic.id
    );
    for (const row of invoiceYears) {
      const cnt = Number(row.cnt);
      await upsertCounter(clinic.id, "invoice", row.year.toString(), cnt);
      console.log(`  invoice/${row.year}: ${cnt}`);
    }

    // 3. Lab order counters (per-day scope)
    const labDays = await prisma.$queryRawUnsafe<{ day: string; cnt: bigint }[]>(
      `SELECT TO_CHAR(created_at, 'YYYYMMDD') AS day, COUNT(*)::bigint AS cnt
       FROM "LabOrder" WHERE clinic_id = $1 GROUP BY day ORDER BY day`,
      clinic.id
    );
    for (const row of labDays) {
      const cnt = Number(row.cnt);
      await upsertCounter(clinic.id, "lab_order", row.day, cnt);
      console.log(`  lab_order/${row.day}: ${cnt}`);
    }

    // 4. Sale counters (per-day scope)
    const saleDays = await prisma.$queryRawUnsafe<{ day: string; cnt: bigint }[]>(
      `SELECT TO_CHAR(created_at, 'YYYYMMDD') AS day, COUNT(*)::bigint AS cnt
       FROM "Sale" WHERE clinic_id = $1 GROUP BY day ORDER BY day`,
      clinic.id
    );
    for (const row of saleDays) {
      const cnt = Number(row.cnt);
      await upsertCounter(clinic.id, "sale", row.day, cnt);
      console.log(`  sale/${row.day}: ${cnt}`);
    }

    // 5. Admission counters (per-month scope)
    const admissionMonths = await prisma.$queryRawUnsafe<{ month: string; cnt: bigint }[]>(
      `SELECT TO_CHAR(created_at, 'YYYYMM') AS month, COUNT(*)::bigint AS cnt
       FROM "Admission" WHERE clinic_id = $1 GROUP BY month ORDER BY month`,
      clinic.id
    );
    for (const row of admissionMonths) {
      const cnt = Number(row.cnt);
      await upsertCounter(clinic.id, "admission", row.month, cnt);
      console.log(`  admission/${row.month}: ${cnt}`);
    }

    // 6. Prescription counters (per-year scope)
    const rxYears = await prisma.$queryRawUnsafe<{ year: number; cnt: bigint }[]>(
      `SELECT EXTRACT(YEAR FROM created_at)::int AS year, COUNT(*)::bigint AS cnt
       FROM "Prescription" WHERE clinic_id = $1 GROUP BY year ORDER BY year`,
      clinic.id
    );
    for (const row of rxYears) {
      const cnt = Number(row.cnt);
      await upsertCounter(clinic.id, "prescription", row.year.toString(), cnt);
      console.log(`  prescription/${row.year}: ${cnt}`);
    }

    // 7. Token counters (per-day scope) — count appointments per day
    const tokenDays = await prisma.$queryRawUnsafe<{ day: string; cnt: bigint }[]>(
      `SELECT TO_CHAR(appointment_date, 'YYYYMMDD') AS day, COUNT(*)::bigint AS cnt
       FROM "Appointment" WHERE clinic_id = $1 GROUP BY day ORDER BY day`,
      clinic.id
    );
    for (const row of tokenDays) {
      const cnt = Number(row.cnt);
      await upsertCounter(clinic.id, "token", row.day, cnt);
      console.log(`  token/${row.day}: ${cnt}`);
    }
  }

  console.log("\nDone.");
}

async function upsertCounter(
  clinicId: string,
  entity: string,
  scope: string,
  value: number
) {
  await prisma.$executeRawUnsafe(
    `INSERT INTO "ClinicCounter" (id, clinic_id, entity, scope, value, created_at, updated_at)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, now(), now())
     ON CONFLICT (clinic_id, entity, scope)
     DO UPDATE SET value = GREATEST("ClinicCounter".value, $4), updated_at = now()`,
    clinicId,
    entity,
    scope,
    value
  );
}

main()
  .catch((e) => {
    console.error("Error seeding counters:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
