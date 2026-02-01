import { createReadStream } from "fs";
import { resolve } from "path";
import { parse } from "csv-parse";
import { PrismaClient, ProfessionalType } from "@prisma/client";

const prisma = new PrismaClient();

interface PharmacistRecord {
  reg_no: string;
  name: string;
  reg_date: string;
  category: string;
  scraped_at: string;
}

function generateSlug(fullName: string, regNo: string): string {
  // Normalize the name
  const name = fullName.toLowerCase().trim();

  // Replace non-alphanumeric chars with hyphens, remove consecutive hyphens
  const slugifiedName = name
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `pharmacist-${slugifiedName}-${regNo.toLowerCase()}`;
}

function parseRegistrationDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === "") {
    return null;
  }

  // Expected format: YYYY-MM-DD (e.g., 2012-08-28)
  const parsed = new Date(dateStr.trim());
  if (isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

async function importPharmacists(): Promise<void> {
  const csvPath = resolve(__dirname, "../../../data/npc_pharmacists.csv");

  const records: PharmacistRecord[] = [];

  console.log(`Reading CSV from: ${csvPath}`);

  const parser = createReadStream(csvPath).pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
    })
  );

  for await (const record of parser) {
    records.push(record as PharmacistRecord);
  }

  console.log(`Parsed ${records.length} records from CSV`);

  let created = 0;
  let updated = 0;
  let errors = 0;
  const errorDetails: Array<{ reg_no: string; error: string }> = [];

  // Process in batches for better performance
  const batchSize = 100;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);

    const upsertPromises = batch.map(async (record) => {
      try {
        const regNo = record.reg_no?.trim();
        const fullName = record.name?.trim();

        if (!regNo || !fullName) {
          errors++;
          errorDetails.push({
            reg_no: regNo || "MISSING",
            error: "Missing required field (reg_no or name)",
          });
          return;
        }

        const slug = generateSlug(fullName, regNo);
        const registrationDate = parseRegistrationDate(record.reg_date);

        // Store category in meta
        const meta: Record<string, string> = {};
        if (record.category?.trim()) {
          meta.category = record.category.trim();
        }

        const result = await prisma.professional.upsert({
          where: { registration_number: regNo },
          create: {
            type: ProfessionalType.PHARMACIST,
            registration_number: regNo,
            full_name: fullName,
            slug,
            registration_date: registrationDate,
            meta: Object.keys(meta).length > 0 ? meta : undefined,
            last_synced_at: record.scraped_at ? new Date(record.scraped_at) : new Date(),
          },
          update: {
            full_name: fullName,
            slug,
            registration_date: registrationDate,
            meta: Object.keys(meta).length > 0 ? meta : undefined,
            last_synced_at: record.scraped_at ? new Date(record.scraped_at) : new Date(),
          },
        });

        // Check if it was created or updated by comparing created_at and updated_at
        // If created_at equals updated_at (within 1 second), it was likely just created
        const wasCreated =
          Math.abs(result.created_at.getTime() - result.updated_at.getTime()) < 1000;

        if (wasCreated) {
          created++;
        } else {
          updated++;
        }
      } catch (err) {
        errors++;
        const errorMessage = err instanceof Error ? err.message : String(err);
        errorDetails.push({
          reg_no: record.reg_no || "UNKNOWN",
          error: errorMessage,
        });
      }
    });

    await Promise.all(upsertPromises);

    // Progress logging every 500 records
    if ((i + batchSize) % 500 === 0 || i + batchSize >= records.length) {
      console.log(`Processed ${Math.min(i + batchSize, records.length)}/${records.length} records...`);
    }
  }

  console.log("\n=== Import Statistics ===");
  console.log(`Total records: ${records.length}`);
  console.log(`Created: ${created}`);
  console.log(`Updated: ${updated}`);
  console.log(`Errors: ${errors}`);

  if (errorDetails.length > 0 && errorDetails.length <= 10) {
    console.log("\nError details:");
    errorDetails.forEach((e) => {
      console.log(`  Reg ${e.reg_no}: ${e.error}`);
    });
  } else if (errorDetails.length > 10) {
    console.log(`\nFirst 10 errors (of ${errorDetails.length}):`);
    errorDetails.slice(0, 10).forEach((e) => {
      console.log(`  Reg ${e.reg_no}: ${e.error}`);
    });
  }
}

importPharmacists()
  .then(() => {
    console.log("\nImport completed successfully.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Import failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
