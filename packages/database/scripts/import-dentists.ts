import { createReadStream } from "fs";
import { resolve } from "path";
import { parse } from "csv-parse";
import { PrismaClient, ProfessionalType } from "@prisma/client";

const prisma = new PrismaClient();

interface DentistRecord {
  nmc_no: string;
  nda_id: string;
  name: string;
  location: string;
  scraped_at: string;
}

function generateSlug(fullName: string, nmcNo: string): string {
  // Remove "Dr." prefix if present and normalize
  const name = fullName
    .replace(/^Dr\.?\s*/i, "")
    .toLowerCase()
    .trim();

  // Replace non-alphanumeric chars with hyphens, remove consecutive hyphens
  const slugifiedName = name
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `dr-${slugifiedName}-${nmcNo}`;
}

async function importDentists(): Promise<void> {
  const csvPath = resolve(__dirname, "../../../data/nda_dentists.csv");

  const records: DentistRecord[] = [];

  console.log(`Reading CSV from: ${csvPath}`);

  const parser = createReadStream(csvPath).pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
    })
  );

  for await (const record of parser) {
    records.push(record as DentistRecord);
  }

  console.log(`Parsed ${records.length} records from CSV`);

  let created = 0;
  let updated = 0;
  let errors = 0;
  const errorDetails: Array<{ nmc_no: string; error: string }> = [];

  // Process in batches for better performance
  const batchSize = 100;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);

    const upsertPromises = batch.map(async (record) => {
      try {
        const nmcNo = record.nmc_no?.trim();
        const fullName = record.name?.trim();

        if (!nmcNo || !fullName) {
          errors++;
          errorDetails.push({
            nmc_no: nmcNo || "MISSING",
            error: "Missing required field (nmc_no or name)",
          });
          return;
        }

        const slug = generateSlug(fullName, nmcNo);

        // Store NDA ID in meta if present
        const meta: Record<string, string> = {};
        if (record.nda_id?.trim()) {
          meta.nda_id = record.nda_id.trim();
        }

        const result = await prisma.professional.upsert({
          where: { registration_number: nmcNo },
          create: {
            type: ProfessionalType.DENTIST,
            registration_number: nmcNo,
            full_name: fullName,
            address: record.location?.trim() || null,
            slug,
            meta: Object.keys(meta).length > 0 ? meta : undefined,
            last_synced_at: record.scraped_at ? new Date(record.scraped_at) : new Date(),
          },
          update: {
            full_name: fullName,
            address: record.location?.trim() || null,
            slug,
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
          nmc_no: record.nmc_no || "UNKNOWN",
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
      console.log(`  NMC ${e.nmc_no}: ${e.error}`);
    });
  } else if (errorDetails.length > 10) {
    console.log(`\nFirst 10 errors (of ${errorDetails.length}):`);
    errorDetails.slice(0, 10).forEach((e) => {
      console.log(`  NMC ${e.nmc_no}: ${e.error}`);
    });
  }
}

importDentists()
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
