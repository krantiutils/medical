/**
 * import-hospitals.ts
 *
 * Standalone script to import hospital scrape data into the production DB.
 * Reads the match report JSON, upserts Clinic records (verified=true),
 * creates ClinicDoctor junction records, and updates Professional.photo_url
 * where scraped photos exist and the doctor has none.
 *
 * No Playwright dependency — all hospital metadata is inline.
 *
 * Usage: pnpm import:hospitals
 */

import { PrismaClient, ClinicType, ProfessionalType } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// Types (mirrored from refinery types.ts, minus Playwright deps)
// ---------------------------------------------------------------------------

interface ScrapedDoctor {
  name: string;
  specialty: string | null;
  department: string | null;
  degree: string | null;
  photo_url: string | null;
  profile_url: string | null;
  hospital_key: string;
  scraped_at: string;
}

interface MatchResult {
  scraped: ScrapedDoctor;
  matched_professional_id: string | null;
  matched_name: string | null;
  matched_registration_number: string | null;
  similarity_score: number;
  match_status: "exact" | "fuzzy" | "possible" | "unmatched";
}

interface MatchReport {
  hospital_key: string;
  hospital_name: string;
  scraped_count: number;
  matched_count: number;
  possible_count: number;
  unmatched_count: number;
  results: MatchResult[];
  generated_at: string;
}

interface HospitalMeta {
  key: string;
  name: string;
  website: string;
  address: string | null;
  phone: string | null;
}

// ---------------------------------------------------------------------------
// Hospital metadata (extracted from refinery config.ts, no scraper imports)
// ---------------------------------------------------------------------------

const HOSPITALS: HospitalMeta[] = [
  {
    key: "bir-hospital",
    name: "Bir Hospital",
    website: "https://birhospital.gov.np",
    address: "Kathmandu, Nepal",
    phone: null,
  },
  {
    key: "tuth",
    name: "TU Teaching Hospital",
    website: "https://tuth.org.np",
    address: "Maharajgunj, Kathmandu, Nepal",
    phone: null,
  },
  {
    key: "grande-hospital",
    name: "Grande International Hospital",
    website: "https://grandehospital.com",
    address: "Tokha, Kathmandu, Nepal",
    phone: null,
  },
  {
    key: "norvic-hospital",
    name: "Norvic International Hospital",
    website: "https://norvichospital.com",
    address: "Thapathali, Kathmandu, Nepal",
    phone: null,
  },
  {
    key: "nepal-mediciti",
    name: "Nepal Mediciti Hospital",
    website: "https://nepalmediciti.com",
    address: "Bhaisepati, Lalitpur, Nepal",
    phone: null,
  },
  {
    key: "bb-hospital",
    name: "B&B Hospital",
    website: "https://bbhospital.com.np",
    address: "Gwarko, Lalitpur, Nepal",
    phone: null,
  },
  {
    key: "star-hospital",
    name: "Star Hospital",
    website: "https://starhospitallimited.com",
    address: "Kathmandu, Nepal",
    phone: null,
  },
  {
    key: "hams-hospital",
    name: "HAMS Hospital",
    website: "https://hamshospital.com",
    address: "Dhumbarahi, Kathmandu, Nepal",
    phone: null,
  },
  {
    key: "civil-service-hospital",
    name: "Civil Service Hospital",
    website: "https://csh.gov.np",
    address: "Min Bhawan, Kathmandu, Nepal",
    phone: null,
  },
  {
    key: "nepal-cancer-hospital",
    name: "Nepal Cancer Hospital & Research Center",
    website: "https://www.nch.com.np",
    address: "Harisiddhi, Lalitpur, Nepal",
    phone: null,
  },
  {
    key: "sgnhc",
    name: "Shahid Gangalal National Heart Centre",
    website: "https://www.sgnhc.org.np",
    address: "Bansbari, Kathmandu, Nepal",
    phone: null,
  },
  {
    key: "kantipur-hospital",
    name: "Kantipur Hospital",
    website: "https://www.kantipurhospital.com.np",
    address: "Tinkune, Koteshwor, Kathmandu, Nepal",
    phone: null,
  },
  {
    key: "alka-hospital",
    name: "Alka Hospital",
    website: "https://www.alkahospital.com",
    address: "Jawalakhel, Lalitpur, Nepal",
    phone: null,
  },
  {
    key: "medicare-hospital",
    name: "Medicare National Hospital & Research Center",
    website: "https://www.medicarehosp.com",
    address: "Chabahil, Kathmandu, Nepal",
    phone: null,
  },
  {
    key: "bharatpur-hospital",
    name: "Bharatpur Hospital",
    website: "https://www.bharatpurhospital.gov.np",
    address: "Bharatpur, Chitwan, Nepal",
    phone: null,
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  // Resolve match report path relative to this script's location
  const scriptDir = path.dirname(new URL(import.meta.url).pathname);
  const matchReportPath = path.resolve(
    scriptDir,
    "../../../data/hospital-scrapes/match-report-2026-02-05.json"
  );

  if (!fs.existsSync(matchReportPath)) {
    throw new Error(`Match report not found at: ${matchReportPath}`);
  }

  console.log(`Reading match report from: ${matchReportPath}`);
  const raw = fs.readFileSync(matchReportPath, "utf-8");
  const matchReports: MatchReport[] = JSON.parse(raw);

  console.log(`Found ${matchReports.length} hospital reports`);

  // Build lookup maps
  const reportMap = new Map<string, MatchReport>();
  for (const report of matchReports) {
    reportMap.set(report.hospital_key, report);
  }

  const hospitalMap = new Map<string, HospitalMeta>();
  for (const h of HOSPITALS) {
    hospitalMap.set(h.key, h);
  }

  const prisma = new PrismaClient();

  try {
    let totalLinked = 0;
    let totalPhotos = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    let clinicsCreated = 0;

    for (const report of matchReports) {
      const hospital = hospitalMap.get(report.hospital_key);
      if (!hospital) {
        console.warn(
          `[${report.hospital_key}] No metadata found in HOSPITALS array, skipping`
        );
        continue;
      }

      console.log(`\n[${hospital.name}] Processing...`);
      console.log(
        `  Scraped: ${report.scraped_count} | Matched: ${report.matched_count} | Possible: ${report.possible_count} | Unmatched: ${report.unmatched_count}`
      );

      // 1. Upsert Clinic record with verified=true
      const clinic = await prisma.clinic.upsert({
        where: { slug: hospital.key },
        create: {
          name: hospital.name,
          slug: hospital.key,
          type: ClinicType.HOSPITAL,
          website: hospital.website,
          address: hospital.address,
          phone: hospital.phone,
          verified: true,
          meta: {
            source: "scraper",
            scraped_at: report.generated_at,
          },
        },
        update: {
          name: hospital.name,
          website: hospital.website,
          address: hospital.address,
          phone: hospital.phone,
          verified: true,
          meta: {
            source: "scraper",
            scraped_at: report.generated_at,
          },
        },
      });

      clinicsCreated++;
      console.log(`  Clinic upserted: ${clinic.id} (${clinic.slug})`);

      // 2. Link matched doctors via ClinicDoctor (exact + fuzzy only)
      const matchedResults = report.results.filter(
        (r) => r.match_status === "exact" || r.match_status === "fuzzy"
      );

      let linked = 0;
      let photoUpdated = 0;
      let skipped = 0;
      let errors = 0;

      for (const result of matchedResults) {
        if (!result.matched_registration_number) continue;

        try {
          // Look up professional by registration number (stable across DBs)
          const professional = await prisma.professional.findUnique({
            where: {
              type_registration_number: {
                type: ProfessionalType.DOCTOR,
                registration_number: result.matched_registration_number,
              },
            },
            select: { id: true, photo_url: true },
          });

          if (!professional) {
            console.warn(
              `  Skipping ${result.matched_name}: registration_number ${result.matched_registration_number} not found in DB`
            );
            skipped++;
            continue;
          }

          // Upsert ClinicDoctor junction
          await prisma.clinicDoctor.upsert({
            where: {
              clinic_id_doctor_id: {
                clinic_id: clinic.id,
                doctor_id: professional.id,
              },
            },
            create: {
              clinic_id: clinic.id,
              doctor_id: professional.id,
              role: null,
            },
            update: {},
          });
          linked++;

          // 3. Update photo_url if scraped photo exists and doctor has none
          if (result.scraped.photo_url && !professional.photo_url) {
            await prisma.professional.update({
              where: { id: professional.id },
              data: { photo_url: result.scraped.photo_url },
            });
            photoUpdated++;
          }
        } catch (err) {
          errors++;
          const msg = err instanceof Error ? err.message : String(err);
          console.error(
            `  Error linking doctor ${result.matched_name ?? result.scraped.name}: ${msg}`
          );
        }
      }

      totalLinked += linked;
      totalPhotos += photoUpdated;
      totalSkipped += skipped;
      totalErrors += errors;

      console.log(
        `  Linked: ${linked} | Photos: ${photoUpdated} | Skipped: ${skipped} | Errors: ${errors}`
      );
    }

    console.log("\n========================================");
    console.log("IMPORT COMPLETE");
    console.log(`  Clinics upserted:  ${clinicsCreated}`);
    console.log(`  Doctors linked:    ${totalLinked}`);
    console.log(`  Photos updated:    ${totalPhotos}`);
    console.log(`  Skipped (not found): ${totalSkipped}`);
    console.log(`  Errors:            ${totalErrors}`);
    console.log("========================================\n");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Fatal error during hospital import:", err);
  process.exit(1);
});
