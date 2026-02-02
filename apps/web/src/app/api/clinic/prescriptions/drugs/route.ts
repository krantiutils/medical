import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@swasthya/database";

// Common medications database (subset for prescription writing)
// In production, this could be loaded from a separate database or API
const COMMON_MEDICATIONS = [
  // Antibiotics
  { name: "Amoxicillin", generic_name: "Amoxicillin", category: "Antibiotic", strengths: ["250mg", "500mg"] },
  { name: "Azithromycin", generic_name: "Azithromycin", category: "Antibiotic", strengths: ["250mg", "500mg"] },
  { name: "Ciprofloxacin", generic_name: "Ciprofloxacin", category: "Antibiotic", strengths: ["250mg", "500mg"] },
  { name: "Metronidazole", generic_name: "Metronidazole", category: "Antibiotic", strengths: ["200mg", "400mg"] },
  { name: "Cephalexin", generic_name: "Cephalexin", category: "Antibiotic", strengths: ["250mg", "500mg"] },
  { name: "Doxycycline", generic_name: "Doxycycline", category: "Antibiotic", strengths: ["100mg"] },

  // Pain & Fever
  { name: "Paracetamol", generic_name: "Acetaminophen", category: "Analgesic", strengths: ["500mg", "650mg"] },
  { name: "Ibuprofen", generic_name: "Ibuprofen", category: "NSAID", strengths: ["200mg", "400mg"] },
  { name: "Diclofenac", generic_name: "Diclofenac", category: "NSAID", strengths: ["50mg", "100mg"] },
  { name: "Naproxen", generic_name: "Naproxen", category: "NSAID", strengths: ["250mg", "500mg"] },
  { name: "Tramadol", generic_name: "Tramadol", category: "Opioid Analgesic", strengths: ["50mg", "100mg"] },

  // Gastrointestinal
  { name: "Omeprazole", generic_name: "Omeprazole", category: "PPI", strengths: ["20mg", "40mg"] },
  { name: "Pantoprazole", generic_name: "Pantoprazole", category: "PPI", strengths: ["20mg", "40mg"] },
  { name: "Ranitidine", generic_name: "Ranitidine", category: "H2 Blocker", strengths: ["150mg", "300mg"] },
  { name: "Domperidone", generic_name: "Domperidone", category: "Antiemetic", strengths: ["10mg"] },
  { name: "Ondansetron", generic_name: "Ondansetron", category: "Antiemetic", strengths: ["4mg", "8mg"] },
  { name: "Loperamide", generic_name: "Loperamide", category: "Antidiarrheal", strengths: ["2mg"] },
  { name: "Lactulose", generic_name: "Lactulose", category: "Laxative", strengths: ["10g/15ml"] },

  // Cardiovascular
  { name: "Amlodipine", generic_name: "Amlodipine", category: "Antihypertensive", strengths: ["2.5mg", "5mg", "10mg"] },
  { name: "Atenolol", generic_name: "Atenolol", category: "Beta Blocker", strengths: ["25mg", "50mg", "100mg"] },
  { name: "Losartan", generic_name: "Losartan", category: "ARB", strengths: ["25mg", "50mg", "100mg"] },
  { name: "Enalapril", generic_name: "Enalapril", category: "ACE Inhibitor", strengths: ["5mg", "10mg", "20mg"] },
  { name: "Furosemide", generic_name: "Furosemide", category: "Diuretic", strengths: ["20mg", "40mg"] },
  { name: "Aspirin", generic_name: "Aspirin", category: "Antiplatelet", strengths: ["75mg", "150mg", "325mg"] },
  { name: "Atorvastatin", generic_name: "Atorvastatin", category: "Statin", strengths: ["10mg", "20mg", "40mg"] },

  // Diabetes
  { name: "Metformin", generic_name: "Metformin", category: "Antidiabetic", strengths: ["500mg", "850mg", "1000mg"] },
  { name: "Glimepiride", generic_name: "Glimepiride", category: "Sulfonylurea", strengths: ["1mg", "2mg", "4mg"] },
  { name: "Sitagliptin", generic_name: "Sitagliptin", category: "DPP-4 Inhibitor", strengths: ["25mg", "50mg", "100mg"] },

  // Respiratory
  { name: "Salbutamol", generic_name: "Albuterol", category: "Bronchodilator", strengths: ["2mg", "4mg", "100mcg/puff"] },
  { name: "Montelukast", generic_name: "Montelukast", category: "Leukotriene Inhibitor", strengths: ["4mg", "5mg", "10mg"] },
  { name: "Cetirizine", generic_name: "Cetirizine", category: "Antihistamine", strengths: ["5mg", "10mg"] },
  { name: "Loratadine", generic_name: "Loratadine", category: "Antihistamine", strengths: ["10mg"] },
  { name: "Budesonide", generic_name: "Budesonide", category: "Corticosteroid", strengths: ["200mcg", "400mcg"] },

  // Neurological
  { name: "Gabapentin", generic_name: "Gabapentin", category: "Anticonvulsant", strengths: ["100mg", "300mg", "600mg"] },
  { name: "Pregabalin", generic_name: "Pregabalin", category: "Anticonvulsant", strengths: ["75mg", "150mg", "300mg"] },
  { name: "Levetiracetam", generic_name: "Levetiracetam", category: "Anticonvulsant", strengths: ["250mg", "500mg", "1000mg"] },

  // Mental Health
  { name: "Sertraline", generic_name: "Sertraline", category: "SSRI", strengths: ["25mg", "50mg", "100mg"] },
  { name: "Escitalopram", generic_name: "Escitalopram", category: "SSRI", strengths: ["5mg", "10mg", "20mg"] },
  { name: "Amitriptyline", generic_name: "Amitriptyline", category: "TCA", strengths: ["10mg", "25mg", "50mg"] },

  // Vitamins & Supplements
  { name: "Vitamin D3", generic_name: "Cholecalciferol", category: "Vitamin", strengths: ["1000IU", "2000IU", "60000IU"] },
  { name: "Vitamin B12", generic_name: "Cyanocobalamin", category: "Vitamin", strengths: ["500mcg", "1000mcg", "1500mcg"] },
  { name: "Iron + Folic Acid", generic_name: "Ferrous Sulfate + Folic Acid", category: "Supplement", strengths: ["100mg+0.5mg"] },
  { name: "Calcium + Vitamin D", generic_name: "Calcium Carbonate + Cholecalciferol", category: "Supplement", strengths: ["500mg+250IU"] },

  // Dermatological
  { name: "Fluconazole", generic_name: "Fluconazole", category: "Antifungal", strengths: ["50mg", "150mg", "200mg"] },
  { name: "Clotrimazole", generic_name: "Clotrimazole", category: "Antifungal", strengths: ["1% cream"] },
  { name: "Hydrocortisone", generic_name: "Hydrocortisone", category: "Corticosteroid", strengths: ["1% cream", "2.5% cream"] },

  // Eye/ENT
  { name: "Ciprofloxacin Eye Drops", generic_name: "Ciprofloxacin", category: "Ophthalmic Antibiotic", strengths: ["0.3%"] },
  { name: "Ofloxacin Eye Drops", generic_name: "Ofloxacin", category: "Ophthalmic Antibiotic", strengths: ["0.3%"] },
  { name: "Artificial Tears", generic_name: "Carboxymethylcellulose", category: "Ophthalmic Lubricant", strengths: ["0.5%"] },
];

// Common frequency options
export const FREQUENCY_OPTIONS = [
  { value: "OD", label: "Once daily (OD)" },
  { value: "BD", label: "Twice daily (BD)" },
  { value: "TDS", label: "Three times daily (TDS)" },
  { value: "QID", label: "Four times daily (QID)" },
  { value: "HS", label: "At bedtime (HS)" },
  { value: "SOS", label: "As needed (SOS)" },
  { value: "STAT", label: "Immediately (STAT)" },
  { value: "Q4H", label: "Every 4 hours (Q4H)" },
  { value: "Q6H", label: "Every 6 hours (Q6H)" },
  { value: "Q8H", label: "Every 8 hours (Q8H)" },
  { value: "Q12H", label: "Every 12 hours (Q12H)" },
  { value: "WEEKLY", label: "Once weekly" },
  { value: "ALTERNATE_DAYS", label: "Alternate days" },
];

// Common duration units
export const DURATION_UNITS = [
  { value: "days", label: "Days" },
  { value: "weeks", label: "Weeks" },
  { value: "months", label: "Months" },
];

// GET /api/clinic/prescriptions/drugs - Search medications for prescription
export async function GET(request: NextRequest) {
  try {
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

    // Get search query
    const searchParams = request.nextUrl.searchParams;
    const query = (searchParams.get("q") || "").toLowerCase().trim();

    if (!query) {
      // Return frequency and duration options for empty query
      return NextResponse.json({
        drugs: [],
        frequencyOptions: FREQUENCY_OPTIONS,
        durationUnits: DURATION_UNITS,
      });
    }

    // Search clinic's pharmacy products first
    const pharmacyProducts = await prisma.product.findMany({
      where: {
        clinic_id: clinic.id,
        is_active: true,
        category: "MEDICINE",
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { generic_name: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        generic_name: true,
        category: true,
        unit: true,
        pack_size: true,
      },
      orderBy: { name: "asc" },
      take: 10,
    });

    // Map pharmacy products to drug format
    const pharmacyDrugs = pharmacyProducts.map((product) => ({
      id: product.id,
      name: product.name,
      generic_name: product.generic_name,
      category: product.category,
      strengths: [product.pack_size || product.unit || ""].filter(Boolean),
      source: "pharmacy" as const,
    }));

    // Search common medications
    const commonDrugs = COMMON_MEDICATIONS
      .filter(
        (med) =>
          med.name.toLowerCase().includes(query) ||
          med.generic_name.toLowerCase().includes(query) ||
          med.category.toLowerCase().includes(query)
      )
      .map((med) => ({
        id: null,
        name: med.name,
        generic_name: med.generic_name,
        category: med.category,
        strengths: med.strengths,
        source: "common" as const,
      }))
      .slice(0, 15);

    // Combine and deduplicate (prefer pharmacy products)
    const pharmacyNames = new Set(pharmacyDrugs.map((d) => d.name.toLowerCase()));
    const uniqueCommonDrugs = commonDrugs.filter(
      (d) => !pharmacyNames.has(d.name.toLowerCase())
    );

    const drugs = [...pharmacyDrugs, ...uniqueCommonDrugs].slice(0, 20);

    return NextResponse.json({
      drugs,
      frequencyOptions: FREQUENCY_OPTIONS,
      durationUnits: DURATION_UNITS,
    });
  } catch (error) {
    console.error("Error searching drugs:", error);
    return NextResponse.json(
      { error: "Failed to search drugs" },
      { status: 500 }
    );
  }
}
