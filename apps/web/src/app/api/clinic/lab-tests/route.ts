import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@swasthya/database";

// Common lab tests database (for clinics that haven't set up their own)
const COMMON_LAB_TESTS = [
  // Hematology
  { name: "Complete Blood Count (CBC)", short_name: "CBC", category: "Hematology", sample_type: "Blood", normal_range: "See report", unit: "Various", price: 350 },
  { name: "Hemoglobin", short_name: "Hb", category: "Hematology", sample_type: "Blood", normal_range: "12-16 g/dL (F), 14-18 g/dL (M)", unit: "g/dL", price: 100 },
  { name: "Erythrocyte Sedimentation Rate", short_name: "ESR", category: "Hematology", sample_type: "Blood", normal_range: "0-20 mm/hr", unit: "mm/hr", price: 80 },
  { name: "Platelet Count", short_name: "PLT", category: "Hematology", sample_type: "Blood", normal_range: "150,000-400,000/µL", unit: "/µL", price: 150 },
  { name: "Prothrombin Time", short_name: "PT", category: "Hematology", sample_type: "Blood", normal_range: "11-13.5 sec", unit: "sec", price: 300 },
  { name: "Activated Partial Thromboplastin Time", short_name: "aPTT", category: "Hematology", sample_type: "Blood", normal_range: "25-35 sec", unit: "sec", price: 350 },

  // Biochemistry - Liver
  { name: "Liver Function Test", short_name: "LFT", category: "Biochemistry", sample_type: "Blood", normal_range: "See report", unit: "Various", price: 600 },
  { name: "Bilirubin (Total)", short_name: "T.Bili", category: "Biochemistry", sample_type: "Blood", normal_range: "0.3-1.2 mg/dL", unit: "mg/dL", price: 120 },
  { name: "SGPT (ALT)", short_name: "ALT", category: "Biochemistry", sample_type: "Blood", normal_range: "7-56 U/L", unit: "U/L", price: 150 },
  { name: "SGOT (AST)", short_name: "AST", category: "Biochemistry", sample_type: "Blood", normal_range: "10-40 U/L", unit: "U/L", price: 150 },
  { name: "Alkaline Phosphatase", short_name: "ALP", category: "Biochemistry", sample_type: "Blood", normal_range: "44-147 U/L", unit: "U/L", price: 180 },
  { name: "Albumin", short_name: "Alb", category: "Biochemistry", sample_type: "Blood", normal_range: "3.5-5.0 g/dL", unit: "g/dL", price: 120 },
  { name: "Total Protein", short_name: "TP", category: "Biochemistry", sample_type: "Blood", normal_range: "6.0-8.3 g/dL", unit: "g/dL", price: 120 },

  // Biochemistry - Kidney
  { name: "Renal Function Test", short_name: "RFT", category: "Biochemistry", sample_type: "Blood", normal_range: "See report", unit: "Various", price: 500 },
  { name: "Blood Urea Nitrogen", short_name: "BUN", category: "Biochemistry", sample_type: "Blood", normal_range: "7-20 mg/dL", unit: "mg/dL", price: 100 },
  { name: "Creatinine", short_name: "Cr", category: "Biochemistry", sample_type: "Blood", normal_range: "0.7-1.3 mg/dL", unit: "mg/dL", price: 100 },
  { name: "Uric Acid", short_name: "UA", category: "Biochemistry", sample_type: "Blood", normal_range: "3.5-7.2 mg/dL", unit: "mg/dL", price: 150 },
  { name: "eGFR", short_name: "eGFR", category: "Biochemistry", sample_type: "Blood", normal_range: ">90 mL/min/1.73m²", unit: "mL/min/1.73m²", price: 200 },

  // Biochemistry - Lipids
  { name: "Lipid Profile", short_name: "Lipid", category: "Biochemistry", sample_type: "Blood", normal_range: "See report", unit: "Various", price: 450 },
  { name: "Total Cholesterol", short_name: "TC", category: "Biochemistry", sample_type: "Blood", normal_range: "<200 mg/dL", unit: "mg/dL", price: 100 },
  { name: "HDL Cholesterol", short_name: "HDL", category: "Biochemistry", sample_type: "Blood", normal_range: ">40 mg/dL (M), >50 mg/dL (F)", unit: "mg/dL", price: 150 },
  { name: "LDL Cholesterol", short_name: "LDL", category: "Biochemistry", sample_type: "Blood", normal_range: "<100 mg/dL", unit: "mg/dL", price: 150 },
  { name: "Triglycerides", short_name: "TG", category: "Biochemistry", sample_type: "Blood", normal_range: "<150 mg/dL", unit: "mg/dL", price: 120 },

  // Biochemistry - Diabetes
  { name: "Fasting Blood Sugar", short_name: "FBS", category: "Biochemistry", sample_type: "Blood", normal_range: "70-100 mg/dL", unit: "mg/dL", price: 80 },
  { name: "Random Blood Sugar", short_name: "RBS", category: "Biochemistry", sample_type: "Blood", normal_range: "<140 mg/dL", unit: "mg/dL", price: 80 },
  { name: "Post Prandial Blood Sugar", short_name: "PPBS", category: "Biochemistry", sample_type: "Blood", normal_range: "<140 mg/dL", unit: "mg/dL", price: 80 },
  { name: "HbA1c", short_name: "HbA1c", category: "Biochemistry", sample_type: "Blood", normal_range: "<5.7%", unit: "%", price: 600 },
  { name: "Oral Glucose Tolerance Test", short_name: "OGTT", category: "Biochemistry", sample_type: "Blood", normal_range: "See report", unit: "mg/dL", price: 300 },

  // Thyroid
  { name: "Thyroid Profile (T3, T4, TSH)", short_name: "TFT", category: "Thyroid", sample_type: "Blood", normal_range: "See report", unit: "Various", price: 800 },
  { name: "TSH", short_name: "TSH", category: "Thyroid", sample_type: "Blood", normal_range: "0.4-4.0 mIU/L", unit: "mIU/L", price: 350 },
  { name: "Free T3", short_name: "FT3", category: "Thyroid", sample_type: "Blood", normal_range: "2.3-4.2 pg/mL", unit: "pg/mL", price: 400 },
  { name: "Free T4", short_name: "FT4", category: "Thyroid", sample_type: "Blood", normal_range: "0.8-1.8 ng/dL", unit: "ng/dL", price: 400 },

  // Urine
  { name: "Urine Routine & Microscopy", short_name: "Urine R/M", category: "Urine", sample_type: "Urine", normal_range: "See report", unit: "Various", price: 100 },
  { name: "Urine Culture & Sensitivity", short_name: "Urine C/S", category: "Microbiology", sample_type: "Urine", normal_range: "No growth", unit: "-", price: 400 },
  { name: "24-Hour Urine Protein", short_name: "24h Prot", category: "Urine", sample_type: "Urine (24hr)", normal_range: "<150 mg/24hr", unit: "mg/24hr", price: 200 },

  // Stool
  { name: "Stool Routine & Microscopy", short_name: "Stool R/M", category: "Stool", sample_type: "Stool", normal_range: "See report", unit: "-", price: 80 },
  { name: "Stool Occult Blood", short_name: "FOBT", category: "Stool", sample_type: "Stool", normal_range: "Negative", unit: "-", price: 100 },

  // Cardiac
  { name: "Troponin I", short_name: "TnI", category: "Cardiac", sample_type: "Blood", normal_range: "<0.04 ng/mL", unit: "ng/mL", price: 800 },
  { name: "CK-MB", short_name: "CK-MB", category: "Cardiac", sample_type: "Blood", normal_range: "0-25 U/L", unit: "U/L", price: 400 },
  { name: "BNP", short_name: "BNP", category: "Cardiac", sample_type: "Blood", normal_range: "<100 pg/mL", unit: "pg/mL", price: 1200 },

  // Electrolytes
  { name: "Electrolytes (Na, K, Cl)", short_name: "Elec", category: "Biochemistry", sample_type: "Blood", normal_range: "See report", unit: "Various", price: 350 },
  { name: "Sodium", short_name: "Na", category: "Biochemistry", sample_type: "Blood", normal_range: "136-145 mEq/L", unit: "mEq/L", price: 100 },
  { name: "Potassium", short_name: "K", category: "Biochemistry", sample_type: "Blood", normal_range: "3.5-5.0 mEq/L", unit: "mEq/L", price: 100 },
  { name: "Calcium", short_name: "Ca", category: "Biochemistry", sample_type: "Blood", normal_range: "8.5-10.5 mg/dL", unit: "mg/dL", price: 120 },
  { name: "Magnesium", short_name: "Mg", category: "Biochemistry", sample_type: "Blood", normal_range: "1.7-2.2 mg/dL", unit: "mg/dL", price: 150 },
  { name: "Phosphorus", short_name: "P", category: "Biochemistry", sample_type: "Blood", normal_range: "2.5-4.5 mg/dL", unit: "mg/dL", price: 120 },

  // Hormones
  { name: "Vitamin D (25-OH)", short_name: "Vit D", category: "Hormones", sample_type: "Blood", normal_range: "30-100 ng/mL", unit: "ng/mL", price: 1200 },
  { name: "Vitamin B12", short_name: "B12", category: "Hormones", sample_type: "Blood", normal_range: "200-900 pg/mL", unit: "pg/mL", price: 800 },
  { name: "Folic Acid", short_name: "Folate", category: "Hormones", sample_type: "Blood", normal_range: "3-17 ng/mL", unit: "ng/mL", price: 600 },
  { name: "Iron Studies", short_name: "Iron", category: "Hematology", sample_type: "Blood", normal_range: "See report", unit: "Various", price: 500 },
  { name: "Ferritin", short_name: "Ferr", category: "Hematology", sample_type: "Blood", normal_range: "12-150 ng/mL (F), 12-300 ng/mL (M)", unit: "ng/mL", price: 400 },

  // Serology
  { name: "HIV 1 & 2 Antibodies", short_name: "HIV", category: "Serology", sample_type: "Blood", normal_range: "Non-reactive", unit: "-", price: 300 },
  { name: "HBsAg", short_name: "HBsAg", category: "Serology", sample_type: "Blood", normal_range: "Non-reactive", unit: "-", price: 250 },
  { name: "Anti-HCV", short_name: "HCV", category: "Serology", sample_type: "Blood", normal_range: "Non-reactive", unit: "-", price: 400 },
  { name: "VDRL", short_name: "VDRL", category: "Serology", sample_type: "Blood", normal_range: "Non-reactive", unit: "-", price: 100 },
  { name: "Dengue NS1 Antigen", short_name: "Dengue NS1", category: "Serology", sample_type: "Blood", normal_range: "Negative", unit: "-", price: 600 },
  { name: "Widal Test", short_name: "Widal", category: "Serology", sample_type: "Blood", normal_range: "See report", unit: "-", price: 200 },
  { name: "RA Factor", short_name: "RA", category: "Serology", sample_type: "Blood", normal_range: "<14 IU/mL", unit: "IU/mL", price: 250 },
  { name: "CRP (C-Reactive Protein)", short_name: "CRP", category: "Serology", sample_type: "Blood", normal_range: "<6 mg/L", unit: "mg/L", price: 200 },
  { name: "ASO Titre", short_name: "ASO", category: "Serology", sample_type: "Blood", normal_range: "<200 IU/mL", unit: "IU/mL", price: 200 },

  // Microbiology
  { name: "Blood Culture & Sensitivity", short_name: "Blood C/S", category: "Microbiology", sample_type: "Blood", normal_range: "No growth", unit: "-", price: 600 },
  { name: "Throat Swab Culture", short_name: "Throat C/S", category: "Microbiology", sample_type: "Swab", normal_range: "Normal flora", unit: "-", price: 400 },
  { name: "Wound Swab Culture", short_name: "Wound C/S", category: "Microbiology", sample_type: "Swab", normal_range: "No growth", unit: "-", price: 400 },

  // Others
  { name: "Pregnancy Test (Urine)", short_name: "UPT", category: "Others", sample_type: "Urine", normal_range: "Negative/Positive", unit: "-", price: 100 },
  { name: "Pregnancy Test (Blood)", short_name: "β-hCG", category: "Hormones", sample_type: "Blood", normal_range: "See report", unit: "mIU/mL", price: 400 },
  { name: "PSA (Prostate Specific Antigen)", short_name: "PSA", category: "Tumor Markers", sample_type: "Blood", normal_range: "<4 ng/mL", unit: "ng/mL", price: 800 },
  { name: "ANA (Antinuclear Antibody)", short_name: "ANA", category: "Serology", sample_type: "Blood", normal_range: "Negative", unit: "-", price: 1200 },
  { name: "Anti-dsDNA", short_name: "dsDNA", category: "Serology", sample_type: "Blood", normal_range: "<30 IU/mL", unit: "IU/mL", price: 1000 },
];

// GET /api/clinic/lab-tests - Get lab tests
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find user's verified clinic
  const clinic = await prisma.clinic.findFirst({
    where: {
      claimed_by_id: session.user.id,
      verified: true,
    },
  });

  if (!clinic) {
    return NextResponse.json(
      { error: "No verified clinic found", code: "NO_CLINIC" },
      { status: 404 }
    );
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const category = searchParams.get("category");

  try {
    // First try to get clinic's own lab tests
    const clinicTests = await prisma.labTest.findMany({
      where: {
        clinic_id: clinic.id,
        is_active: true,
        ...(query && {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { short_name: { contains: query, mode: "insensitive" } },
            { code: { contains: query, mode: "insensitive" } },
          ],
        }),
        ...(category && { category }),
      },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    // Get categories from clinic's tests
    const clinicCategories = await prisma.labTest.findMany({
      where: {
        clinic_id: clinic.id,
        is_active: true,
      },
      select: {
        category: true,
      },
      distinct: ["category"],
    });

    // If clinic has tests, use those
    if (clinicTests.length > 0 || clinicCategories.length > 0) {
      return NextResponse.json({
        tests: clinicTests,
        categories: clinicCategories.map((c) => c.category).filter(Boolean).sort(),
        source: "clinic",
      });
    }

    // Otherwise, use common tests database
    let filteredTests = COMMON_LAB_TESTS;

    if (query) {
      const lowerQuery = query.toLowerCase();
      filteredTests = filteredTests.filter(
        (t) =>
          t.name.toLowerCase().includes(lowerQuery) ||
          t.short_name.toLowerCase().includes(lowerQuery)
      );
    }

    if (category) {
      filteredTests = filteredTests.filter((t) => t.category === category);
    }

    const categories = [...new Set(COMMON_LAB_TESTS.map((t) => t.category))].sort();

    return NextResponse.json({
      tests: filteredTests.map((t, idx) => ({
        id: `common-${idx}`,
        ...t,
        code: t.short_name,
        description: null,
        instructions: null,
        turnaround_hrs: null,
        is_active: true,
        meta: null,
        clinic_id: clinic.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })),
      categories,
      source: "common",
    });
  } catch (error) {
    console.error("Error fetching lab tests:", error);
    return NextResponse.json(
      { error: "Failed to fetch lab tests" },
      { status: 500 }
    );
  }
}

// POST /api/clinic/lab-tests - Create a clinic-specific lab test
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find user's verified clinic
  const clinic = await prisma.clinic.findFirst({
    where: {
      claimed_by_id: session.user.id,
      verified: true,
    },
  });

  if (!clinic) {
    return NextResponse.json(
      { error: "No verified clinic found", code: "NO_CLINIC" },
      { status: 404 }
    );
  }

  try {
    const body = await request.json();
    const {
      name,
      short_name,
      code,
      category,
      description,
      sample_type,
      instructions,
      normal_range,
      unit,
      price,
      turnaround_hrs,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Test name is required" },
        { status: 400 }
      );
    }

    const labTest = await prisma.labTest.create({
      data: {
        name,
        short_name: short_name || null,
        code: code || null,
        category: category || null,
        description: description || null,
        sample_type: sample_type || null,
        instructions: instructions || null,
        normal_range: normal_range || null,
        unit: unit || null,
        price: price || 0,
        turnaround_hrs: turnaround_hrs || null,
        clinic_id: clinic.id,
      },
    });

    return NextResponse.json({ labTest }, { status: 201 });
  } catch (error) {
    console.error("Error creating lab test:", error);
    return NextResponse.json(
      { error: "Failed to create lab test" },
      { status: 500 }
    );
  }
}
