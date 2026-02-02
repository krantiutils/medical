import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Common ICD-10 codes frequently used in primary care and general practice
// This is a simplified dataset for demonstration - in production, you would use
// a complete ICD-10 database or an external API
const ICD10_CODES = [
  // Common Infections
  { code: "J06.9", description: "Acute upper respiratory infection, unspecified", category: "Infections" },
  { code: "J00", description: "Acute nasopharyngitis (common cold)", category: "Infections" },
  { code: "J02.9", description: "Acute pharyngitis, unspecified", category: "Infections" },
  { code: "J03.9", description: "Acute tonsillitis, unspecified", category: "Infections" },
  { code: "J20.9", description: "Acute bronchitis, unspecified", category: "Infections" },
  { code: "J18.9", description: "Pneumonia, unspecified organism", category: "Infections" },
  { code: "A09", description: "Infectious gastroenteritis and colitis, unspecified", category: "Infections" },
  { code: "B34.9", description: "Viral infection, unspecified", category: "Infections" },
  { code: "N39.0", description: "Urinary tract infection, site not specified", category: "Infections" },
  { code: "L02.9", description: "Cutaneous abscess, furuncle and carbuncle, unspecified", category: "Infections" },

  // Respiratory
  { code: "J45.9", description: "Asthma, unspecified", category: "Respiratory" },
  { code: "J44.9", description: "Chronic obstructive pulmonary disease, unspecified", category: "Respiratory" },
  { code: "J30.9", description: "Allergic rhinitis, unspecified", category: "Respiratory" },
  { code: "J04.0", description: "Acute laryngitis", category: "Respiratory" },
  { code: "J35.0", description: "Chronic tonsillitis", category: "Respiratory" },
  { code: "J31.0", description: "Chronic rhinitis", category: "Respiratory" },

  // Cardiovascular
  { code: "I10", description: "Essential (primary) hypertension", category: "Cardiovascular" },
  { code: "I25.10", description: "Atherosclerotic heart disease", category: "Cardiovascular" },
  { code: "I50.9", description: "Heart failure, unspecified", category: "Cardiovascular" },
  { code: "I48.91", description: "Atrial fibrillation, unspecified", category: "Cardiovascular" },
  { code: "I63.9", description: "Cerebral infarction, unspecified", category: "Cardiovascular" },
  { code: "I83.90", description: "Varicose veins of lower extremities", category: "Cardiovascular" },

  // Endocrine/Metabolic
  { code: "E11.9", description: "Type 2 diabetes mellitus without complications", category: "Endocrine" },
  { code: "E10.9", description: "Type 1 diabetes mellitus without complications", category: "Endocrine" },
  { code: "E78.5", description: "Hyperlipidemia, unspecified", category: "Endocrine" },
  { code: "E03.9", description: "Hypothyroidism, unspecified", category: "Endocrine" },
  { code: "E05.9", description: "Thyrotoxicosis, unspecified", category: "Endocrine" },
  { code: "E66.9", description: "Obesity, unspecified", category: "Endocrine" },
  { code: "E55.9", description: "Vitamin D deficiency, unspecified", category: "Endocrine" },
  { code: "D50.9", description: "Iron deficiency anemia, unspecified", category: "Endocrine" },

  // Gastrointestinal
  { code: "K21.0", description: "Gastroesophageal reflux disease with esophagitis", category: "Gastrointestinal" },
  { code: "K29.7", description: "Gastritis, unspecified", category: "Gastrointestinal" },
  { code: "K30", description: "Functional dyspepsia", category: "Gastrointestinal" },
  { code: "K59.0", description: "Constipation", category: "Gastrointestinal" },
  { code: "K58.9", description: "Irritable bowel syndrome without diarrhea", category: "Gastrointestinal" },
  { code: "K76.0", description: "Fatty liver, not elsewhere classified", category: "Gastrointestinal" },
  { code: "K80.20", description: "Gallstones without cholecystitis", category: "Gastrointestinal" },

  // Musculoskeletal
  { code: "M54.5", description: "Low back pain", category: "Musculoskeletal" },
  { code: "M54.2", description: "Cervicalgia (neck pain)", category: "Musculoskeletal" },
  { code: "M79.3", description: "Panniculitis, unspecified", category: "Musculoskeletal" },
  { code: "M25.50", description: "Pain in unspecified joint", category: "Musculoskeletal" },
  { code: "M17.9", description: "Osteoarthritis of knee, unspecified", category: "Musculoskeletal" },
  { code: "M15.9", description: "Polyosteoarthritis, unspecified", category: "Musculoskeletal" },
  { code: "M79.1", description: "Myalgia", category: "Musculoskeletal" },
  { code: "M62.838", description: "Other muscle spasm", category: "Musculoskeletal" },

  // Neurological
  { code: "G43.9", description: "Migraine, unspecified", category: "Neurological" },
  { code: "G44.1", description: "Vascular headache", category: "Neurological" },
  { code: "R51", description: "Headache", category: "Neurological" },
  { code: "G40.9", description: "Epilepsy, unspecified", category: "Neurological" },
  { code: "G47.00", description: "Insomnia, unspecified", category: "Neurological" },
  { code: "R42", description: "Dizziness and giddiness", category: "Neurological" },

  // Mental Health
  { code: "F32.9", description: "Major depressive disorder, single episode, unspecified", category: "Mental Health" },
  { code: "F41.9", description: "Anxiety disorder, unspecified", category: "Mental Health" },
  { code: "F41.1", description: "Generalized anxiety disorder", category: "Mental Health" },
  { code: "F43.10", description: "Post-traumatic stress disorder, unspecified", category: "Mental Health" },
  { code: "F51.0", description: "Insomnia not due to a substance or known physiological condition", category: "Mental Health" },

  // Dermatology
  { code: "L20.9", description: "Atopic dermatitis, unspecified", category: "Dermatology" },
  { code: "L30.9", description: "Dermatitis, unspecified", category: "Dermatology" },
  { code: "L50.9", description: "Urticaria, unspecified", category: "Dermatology" },
  { code: "L70.0", description: "Acne vulgaris", category: "Dermatology" },
  { code: "B35.9", description: "Dermatophytosis, unspecified", category: "Dermatology" },
  { code: "B35.1", description: "Tinea unguium (fungal nail infection)", category: "Dermatology" },
  { code: "L40.9", description: "Psoriasis, unspecified", category: "Dermatology" },

  // Genitourinary
  { code: "N40.0", description: "Benign prostatic hyperplasia without obstruction", category: "Genitourinary" },
  { code: "N95.1", description: "Menopausal and female climacteric states", category: "Genitourinary" },
  { code: "N92.0", description: "Excessive and frequent menstruation", category: "Genitourinary" },
  { code: "N89.8", description: "Other specified noninflammatory disorders of vagina", category: "Genitourinary" },

  // Ophthalmology
  { code: "H10.9", description: "Unspecified conjunctivitis", category: "Ophthalmology" },
  { code: "H40.9", description: "Unspecified glaucoma", category: "Ophthalmology" },
  { code: "H25.9", description: "Unspecified age-related cataract", category: "Ophthalmology" },
  { code: "H52.1", description: "Myopia", category: "Ophthalmology" },

  // ENT
  { code: "H66.90", description: "Otitis media, unspecified", category: "ENT" },
  { code: "H65.90", description: "Unspecified nonsuppurative otitis media", category: "ENT" },
  { code: "H61.20", description: "Impacted cerumen", category: "ENT" },
  { code: "J32.9", description: "Chronic sinusitis, unspecified", category: "ENT" },

  // Trauma/Injury
  { code: "S93.40", description: "Sprain of ankle, unspecified", category: "Trauma" },
  { code: "S63.50", description: "Sprain of wrist, unspecified", category: "Trauma" },
  { code: "S00.93", description: "Unspecified superficial injury of head", category: "Trauma" },
  { code: "T14.90", description: "Injury, unspecified", category: "Trauma" },
  { code: "S06.0", description: "Concussion", category: "Trauma" },

  // General/Symptoms
  { code: "R53.83", description: "Other fatigue", category: "Symptoms" },
  { code: "R50.9", description: "Fever, unspecified", category: "Symptoms" },
  { code: "R05", description: "Cough", category: "Symptoms" },
  { code: "R10.9", description: "Unspecified abdominal pain", category: "Symptoms" },
  { code: "R11.0", description: "Nausea", category: "Symptoms" },
  { code: "R11.10", description: "Vomiting, unspecified", category: "Symptoms" },
  { code: "R19.7", description: "Diarrhea, unspecified", category: "Symptoms" },
  { code: "R00.0", description: "Tachycardia, unspecified", category: "Symptoms" },
  { code: "R06.0", description: "Dyspnea", category: "Symptoms" },
  { code: "R21", description: "Rash and other nonspecific skin eruption", category: "Symptoms" },

  // Preventive Care
  { code: "Z00.00", description: "Encounter for general adult medical examination", category: "Preventive" },
  { code: "Z23", description: "Encounter for immunization", category: "Preventive" },
  { code: "Z01.00", description: "Encounter for examination of eyes and vision", category: "Preventive" },
  { code: "Z12.31", description: "Encounter for screening mammogram", category: "Preventive" },
  { code: "Z13.1", description: "Encounter for screening for diabetes mellitus", category: "Preventive" },
];

// GET /api/clinic/icd10?q=search_term - Search ICD-10 codes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.toLowerCase().trim() || "";
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "20");

    let results = ICD10_CODES;

    // Filter by category if specified
    if (category) {
      results = results.filter((code) =>
        code.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Filter by search query (searches both code and description)
    if (query) {
      results = results.filter((code) =>
        code.code.toLowerCase().includes(query) ||
        code.description.toLowerCase().includes(query)
      );
    }

    // Sort by relevance (exact code match first, then by code)
    results = results.sort((a, b) => {
      if (query) {
        // Exact code match gets highest priority
        if (a.code.toLowerCase() === query) return -1;
        if (b.code.toLowerCase() === query) return 1;
        // Code starts with query gets second priority
        if (a.code.toLowerCase().startsWith(query) && !b.code.toLowerCase().startsWith(query)) return -1;
        if (b.code.toLowerCase().startsWith(query) && !a.code.toLowerCase().startsWith(query)) return 1;
      }
      return a.code.localeCompare(b.code);
    });

    // Limit results
    results = results.slice(0, limit);

    // Get unique categories for filtering
    const categories = [...new Set(ICD10_CODES.map((c) => c.category))].sort();

    return NextResponse.json({ codes: results, categories });
  } catch (error) {
    console.error("Error searching ICD-10 codes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
