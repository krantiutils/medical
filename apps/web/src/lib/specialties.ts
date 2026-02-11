export interface SpecialtyInfo {
  slug: string;
  nameEn: string;
  nameNe: string;
  descriptionEn: string;
  descriptionNe: string;
  /** Common symptoms that map to this specialty */
  symptoms: string[];
}

export interface LocationInfo {
  slug: string;
  nameEn: string;
  nameNe: string;
}

export const SPECIALTIES: SpecialtyInfo[] = [
  {
    slug: "general-medicine",
    nameEn: "General Medicine",
    nameNe: "सामान्य चिकित्सा",
    descriptionEn: "Find general medicine doctors across Nepal. Browse verified NMC-registered general practitioners.",
    descriptionNe: "नेपालभरका सामान्य चिकित्सा डाक्टरहरू खोज्नुहोस्।",
    symptoms: [
      "fever",
      "cough",
      "cold",
      "fatigue",
      "body-aches",
      "sore-throat",
      "runny-nose",
      "mild-headache",
      "loss-of-appetite",
      "general-weakness",
      "weight-loss-unexplained",
      "dizziness",
    ],
  },
  {
    slug: "internal-medicine",
    nameEn: "Internal Medicine",
    nameNe: "आन्तरिक चिकित्सा",
    descriptionEn: "Find internal medicine specialists in Nepal for complex medical conditions and systemic diseases.",
    descriptionNe: "जटिल चिकित्सा अवस्था र प्रणालीगत रोगहरूका लागि नेपालका आन्तरिक चिकित्सा विशेषज्ञहरू फेला पार्नुहोस्।",
    symptoms: [
      "fever",
      "fatigue",
      "weight-loss-unexplained",
      "diabetes-symptoms",
      "high-blood-pressure",
      "thyroid-problems",
      "anemia",
      "swollen-lymph-nodes",
      "chronic-fatigue",
      "night-sweats",
    ],
  },
  {
    slug: "cardiology",
    nameEn: "Cardiology",
    nameNe: "हृदय रोग",
    descriptionEn: "Find cardiologists across Nepal. Browse verified NMC-registered heart specialists.",
    descriptionNe: "नेपालभरका हृदय रोग विशेषज्ञहरू खोज्नुहोस्।",
    symptoms: [
      "chest-pain",
      "shortness-of-breath",
      "heart-palpitations",
      "high-blood-pressure",
      "swollen-legs",
      "dizziness",
      "fainting",
      "irregular-heartbeat",
    ],
  },
  {
    slug: "dermatology",
    nameEn: "Dermatology",
    nameNe: "छाला रोग",
    descriptionEn: "Find dermatologists across Nepal. Browse verified NMC-registered skin specialists.",
    descriptionNe: "नेपालभरका छाला रोग विशेषज्ञहरू खोज्नुहोस्।",
    symptoms: [
      "skin-rash",
      "itching",
      "acne",
      "hair-loss",
      "skin-discoloration",
      "eczema",
      "psoriasis",
      "fungal-infection",
      "warts",
      "skin-ulcer",
    ],
  },
  {
    slug: "orthopedics",
    nameEn: "Orthopedics",
    nameNe: "हड्डी रोग",
    descriptionEn: "Find orthopedic doctors across Nepal. Browse verified NMC-registered bone and joint specialists.",
    descriptionNe: "नेपालभरका हड्डी रोग विशेषज्ञहरू खोज्नुहोस्।",
    symptoms: [
      "joint-pain",
      "back-pain",
      "knee-pain",
      "fracture",
      "shoulder-pain",
      "neck-pain",
      "swollen-joints",
      "bone-pain",
      "muscle-weakness",
      "difficulty-walking",
      "sports-injury",
    ],
  },
  {
    slug: "gynecology",
    nameEn: "Gynecology",
    nameNe: "स्त्री रोग",
    descriptionEn: "Find gynecologists across Nepal. Browse verified NMC-registered women's health specialists.",
    descriptionNe: "नेपालभरका स्त्री रोग विशेषज्ञहरू खोज्नुहोस्।",
    symptoms: [
      "irregular-periods",
      "pelvic-pain",
      "pregnancy-concerns",
      "abnormal-bleeding",
      "menstrual-cramps",
      "breast-lump",
      "vaginal-discharge",
      "infertility",
      "menopause-symptoms",
    ],
  },
  {
    slug: "pediatrics",
    nameEn: "Pediatrics",
    nameNe: "बालरोग",
    descriptionEn: "Find pediatricians across Nepal. Browse verified NMC-registered child health specialists.",
    descriptionNe: "नेपालभरका बालरोग विशेषज्ञहरू खोज्नुहोस्।",
    symptoms: [
      "child-fever",
      "child-cough",
      "child-rash",
      "growth-concerns",
      "vaccination",
      "child-diarrhea",
      "child-vomiting",
      "developmental-delay",
      "child-ear-pain",
    ],
  },
  {
    slug: "neurology",
    nameEn: "Neurology",
    nameNe: "स्नायु रोग",
    descriptionEn: "Find neurologists across Nepal. Browse verified NMC-registered brain and nerve specialists.",
    descriptionNe: "नेपालभरका स्नायु रोग विशेषज्ञहरू खोज्नुहोस्।",
    symptoms: [
      "severe-headache",
      "migraine",
      "seizures",
      "numbness-tingling",
      "memory-loss",
      "tremors",
      "paralysis",
      "difficulty-speaking",
      "dizziness",
      "loss-of-balance",
    ],
  },
  {
    slug: "psychiatry",
    nameEn: "Psychiatry",
    nameNe: "मानसिक रोग",
    descriptionEn: "Find psychiatrists across Nepal. Browse verified NMC-registered mental health specialists.",
    descriptionNe: "नेपालभरका मानसिक रोग विशेषज्ञहरू खोज्नुहोस्।",
    symptoms: [
      "depression",
      "anxiety",
      "insomnia",
      "panic-attacks",
      "mood-swings",
      "hallucinations",
      "substance-abuse",
      "stress",
      "suicidal-thoughts",
    ],
  },
  {
    slug: "ent",
    nameEn: "ENT",
    nameNe: "कान नाक घाँटी",
    descriptionEn: "Find ENT specialists across Nepal. Browse verified NMC-registered ear, nose, and throat doctors.",
    descriptionNe: "नेपालभरका कान नाक घाँटी विशेषज्ञहरू खोज्नुहोस्।",
    symptoms: [
      "ear-pain",
      "hearing-loss",
      "tinnitus",
      "sinus-pain",
      "nasal-congestion",
      "nosebleed",
      "sore-throat",
      "difficulty-swallowing",
      "hoarse-voice",
      "snoring",
    ],
  },
  {
    slug: "ophthalmology",
    nameEn: "Ophthalmology",
    nameNe: "नेत्र रोग",
    descriptionEn: "Find ophthalmologists across Nepal. Browse verified NMC-registered eye specialists.",
    descriptionNe: "नेपालभरका नेत्र रोग विशेषज्ञहरू खोज्नुहोस्।",
    symptoms: [
      "blurred-vision",
      "eye-pain",
      "red-eyes",
      "watery-eyes",
      "double-vision",
      "eye-discharge",
      "vision-loss",
      "light-sensitivity",
      "eye-floaters",
    ],
  },
  {
    slug: "gastroenterology",
    nameEn: "Gastroenterology",
    nameNe: "पाचन तन्त्र रोग",
    descriptionEn: "Find gastroenterologists in Nepal for digestive system conditions, liver diseases, and GI disorders.",
    descriptionNe: "पाचन प्रणाली, कलेजो रोग र जठरआन्त्र सम्बन्धी समस्याका लागि नेपालका पाचन तन्त्र विशेषज्ञहरू फेला पार्नुहोस्।",
    symptoms: [
      "abdominal-pain",
      "nausea",
      "vomiting",
      "diarrhea",
      "constipation",
      "bloating",
      "heartburn",
      "blood-in-stool",
      "jaundice",
      "loss-of-appetite",
      "difficulty-swallowing",
    ],
  },
  {
    slug: "pulmonology",
    nameEn: "Pulmonology",
    nameNe: "श्वासप्रश्वास रोग",
    descriptionEn: "Find pulmonologists in Nepal for lung conditions, respiratory diseases, and breathing disorders.",
    descriptionNe: "फोक्सो रोग, श्वासप्रश्वास रोग र सास फेर्ने समस्याका लागि नेपालका श्वासप्रश्वास विशेषज्ञहरू फेला पार्नुहोस्।",
    symptoms: [
      "shortness-of-breath",
      "chronic-cough",
      "wheezing",
      "coughing-blood",
      "chest-tightness",
      "asthma",
      "sleep-apnea",
      "snoring",
    ],
  },
  {
    slug: "nephrology",
    nameEn: "Nephrology",
    nameNe: "मृगौला रोग",
    descriptionEn: "Find nephrologists in Nepal for kidney diseases, dialysis, and urinary system conditions.",
    descriptionNe: "मृगौला रोग, डायलिसिस र मूत्र प्रणाली सम्बन्धी समस्याका लागि नेपालका मृगौला रोग विशेषज्ञहरू फेला पार्नुहोस्।",
    symptoms: [
      "blood-in-urine",
      "painful-urination",
      "frequent-urination",
      "swollen-legs",
      "foamy-urine",
      "flank-pain",
      "high-blood-pressure",
    ],
  },
  {
    slug: "urology",
    nameEn: "Urology",
    nameNe: "मूत्र रोग",
    descriptionEn: "Find urologists in Nepal for urinary tract conditions, kidney stones, and male reproductive health.",
    descriptionNe: "मूत्रमार्ग सम्बन्धी समस्या, मृगौला पथरी र पुरुष प्रजनन स्वास्थ्यका लागि नेपालका मूत्र रोग विशेषज्ञहरू फेला पार्नुहोस्।",
    symptoms: [
      "painful-urination",
      "blood-in-urine",
      "frequent-urination",
      "kidney-stones",
      "urinary-incontinence",
      "erectile-dysfunction",
      "testicular-pain",
      "prostate-problems",
    ],
  },
  {
    slug: "endocrinology",
    nameEn: "Endocrinology",
    nameNe: "हर्मोन रोग",
    descriptionEn: "Find endocrinologists in Nepal for hormonal disorders, diabetes, and thyroid conditions.",
    descriptionNe: "हर्मोन विकार, मधुमेह र थाइरोइड सम्बन्धी समस्याका लागि नेपालका हर्मोन रोग विशेषज्ञहरू फेला पार्नुहोस्।",
    symptoms: [
      "diabetes-symptoms",
      "thyroid-problems",
      "weight-loss-unexplained",
      "weight-gain-unexplained",
      "excessive-thirst",
      "excessive-hunger",
      "hormonal-imbalance",
      "menopause-symptoms",
    ],
  },
  {
    slug: "oncology",
    nameEn: "Oncology",
    nameNe: "क्यान्सर रोग",
    descriptionEn: "Find oncologists in Nepal for cancer diagnosis, treatment, and management.",
    descriptionNe: "क्यान्सर निदान, उपचार र व्यवस्थापनका लागि नेपालका क्यान्सर विशेषज्ञहरू फेला पार्नुहोस्।",
    symptoms: [
      "unexplained-lump",
      "weight-loss-unexplained",
      "persistent-fatigue",
      "night-sweats",
      "blood-in-stool",
      "coughing-blood",
      "swollen-lymph-nodes",
    ],
  },
  {
    slug: "surgery",
    nameEn: "Surgery",
    nameNe: "शल्यचिकित्सा",
    descriptionEn: "Find surgeons across Nepal. Browse verified NMC-registered surgical specialists.",
    descriptionNe: "नेपालभरका शल्यचिकित्सा विशेषज्ञहरू खोज्नुहोस्।",
    symptoms: [
      "hernia",
      "appendicitis-pain",
      "gallbladder-pain",
      "unexplained-lump",
      "abdominal-pain",
      "wound-not-healing",
    ],
  },
  {
    slug: "neurosurgery",
    nameEn: "Neurosurgery",
    nameNe: "स्नायु शल्यक्रिया",
    descriptionEn: "Find neurosurgeons in Nepal for brain and spinal cord surgical conditions.",
    descriptionNe: "मस्तिष्क र मेरुदण्ड शल्यक्रियाका लागि नेपालका स्नायु शल्यचिकित्सकहरू फेला पार्नुहोस्।",
    symptoms: [
      "severe-headache",
      "back-pain",
      "neck-pain",
      "numbness-tingling",
      "paralysis",
      "seizures",
    ],
  },
  {
    slug: "radiology",
    nameEn: "Radiology",
    nameNe: "रेडियोलोजी",
    descriptionEn: "Find radiologists across Nepal. Browse verified NMC-registered imaging specialists.",
    descriptionNe: "नेपालभरका रेडियोलोजी विशेषज्ञहरू खोज्नुहोस्।",
    symptoms: [],
  },
  {
    slug: "anesthesiology",
    nameEn: "Anesthesiology",
    nameNe: "एनेस्थेसियोलोजी",
    descriptionEn: "Find anesthesiologists in Nepal for surgical anesthesia and pain management.",
    descriptionNe: "शल्यक्रियाको लागि एनेस्थेसिया र दुखाइ व्यवस्थापनका लागि नेपालका एनेस्थेसियोलोजिस्टहरू फेला पार्नुहोस्।",
    symptoms: [],
  },
  {
    slug: "pathology",
    nameEn: "Pathology",
    nameNe: "रोग विज्ञान",
    descriptionEn: "Find pathologists in Nepal for laboratory diagnostics and disease analysis.",
    descriptionNe: "प्रयोगशाला निदान र रोग विश्लेषणका लागि नेपालका रोग विज्ञान विशेषज्ञहरू फेला पार्नुहोस्।",
    symptoms: [],
  },
  {
    slug: "rheumatology",
    nameEn: "Rheumatology",
    nameNe: "बाथ रोग",
    descriptionEn: "Find rheumatologists in Nepal for arthritis, autoimmune disorders, and joint diseases.",
    descriptionNe: "बाथ रोग, स्वप्रतिरक्षा विकार र जोर्नी रोगहरूका लागि नेपालका बाथ रोग विशेषज्ञहरू फेला पार्नुहोस्।",
    symptoms: [
      "joint-pain",
      "swollen-joints",
      "morning-stiffness",
      "muscle-pain",
      "fatigue",
      "joint-swelling",
    ],
  },
  {
    slug: "emergency-medicine",
    nameEn: "Emergency Medicine",
    nameNe: "आकस्मिक चिकित्सा",
    descriptionEn: "Find emergency medicine physicians in Nepal for acute medical emergencies and trauma care.",
    descriptionNe: "तीव्र चिकित्सा आपतकालीन अवस्था र चोटपटकको उपचारका लागि नेपालका आकस्मिक चिकित्सा विशेषज्ञहरू फेला पार्नुहोस्।",
    symptoms: [
      "chest-pain",
      "difficulty-breathing",
      "severe-bleeding",
      "loss-of-consciousness",
      "severe-burns",
      "poisoning",
      "fracture",
    ],
  },
];

export const LOCATIONS: LocationInfo[] = [
  { slug: "kathmandu", nameEn: "Kathmandu", nameNe: "काठमाडौं" },
  { slug: "pokhara", nameEn: "Pokhara", nameNe: "पोखरा" },
  { slug: "lalitpur", nameEn: "Lalitpur", nameNe: "ललितपुर" },
  { slug: "bhaktapur", nameEn: "Bhaktapur", nameNe: "भक्तपुर" },
  { slug: "biratnagar", nameEn: "Biratnagar", nameNe: "विराटनगर" },
  { slug: "birgunj", nameEn: "Birgunj", nameNe: "वीरगञ्ज" },
  { slug: "dharan", nameEn: "Dharan", nameNe: "धरान" },
  { slug: "butwal", nameEn: "Butwal", nameNe: "बुटवल" },
  { slug: "hetauda", nameEn: "Hetauda", nameNe: "हेटौडा" },
  { slug: "nepalgunj", nameEn: "Nepalgunj", nameNe: "नेपालगञ्ज" },
  { slug: "chitwan", nameEn: "Chitwan", nameNe: "चितवन" },
  { slug: "dhangadhi", nameEn: "Dhangadhi", nameNe: "धनगढी" },
];

export function getSpecialtyBySlug(slug: string): SpecialtyInfo | null {
  return SPECIALTIES.find((s) => s.slug === slug) ?? null;
}

export function getLocationBySlug(slug: string): LocationInfo | null {
  return LOCATIONS.find((l) => l.slug === slug) ?? null;
}

/** Symptom definition with display labels and body area grouping */
export interface SymptomDefinition {
  id: string;
  nameEn: string;
  nameNe: string;
  bodyArea: string;
}

/** Body area grouping for symptom selection UI */
export interface BodyArea {
  id: string;
  nameEn: string;
  nameNe: string;
}

export const BODY_AREAS: BodyArea[] = [
  { id: "head", nameEn: "Head & Brain", nameNe: "टाउको र मस्तिष्क" },
  { id: "eyes", nameEn: "Eyes", nameNe: "आँखा" },
  { id: "ear-nose-throat", nameEn: "Ear, Nose & Throat", nameNe: "कान, नाक र घाँटी" },
  { id: "chest", nameEn: "Chest & Heart", nameNe: "छाती र हृदय" },
  { id: "respiratory", nameEn: "Breathing & Lungs", nameNe: "श्वासप्रश्वास र फोक्सो" },
  { id: "abdomen", nameEn: "Stomach & Digestion", nameNe: "पेट र पाचन" },
  { id: "musculoskeletal", nameEn: "Bones, Joints & Muscles", nameNe: "हाड, जोर्नी र मांसपेशी" },
  { id: "skin", nameEn: "Skin & Hair", nameNe: "छाला र कपाल" },
  { id: "urinary", nameEn: "Urinary & Kidney", nameNe: "मूत्र र मृगौला" },
  { id: "reproductive", nameEn: "Reproductive Health", nameNe: "प्रजनन स्वास्थ्य" },
  { id: "mental", nameEn: "Mental Health", nameNe: "मानसिक स्वास्थ्य" },
  { id: "general", nameEn: "General / Whole Body", nameNe: "सामान्य / पूरा शरीर" },
  { id: "child", nameEn: "Child Health", nameNe: "बाल स्वास्थ्य" },
];

export const SYMPTOMS: SymptomDefinition[] = [
  // Head & Brain
  { id: "severe-headache", nameEn: "Severe headache", nameNe: "तीव्र टाउको दुखाइ", bodyArea: "head" },
  { id: "mild-headache", nameEn: "Mild headache", nameNe: "हल्का टाउको दुखाइ", bodyArea: "head" },
  { id: "migraine", nameEn: "Migraine", nameNe: "माइग्रेन", bodyArea: "head" },
  { id: "seizures", nameEn: "Seizures / fits", nameNe: "खिचोट / दौरा", bodyArea: "head" },
  { id: "memory-loss", nameEn: "Memory loss", nameNe: "स्मरणशक्ति ह्रास", bodyArea: "head" },
  { id: "dizziness", nameEn: "Dizziness", nameNe: "रिंगटा लाग्ने", bodyArea: "head" },
  { id: "fainting", nameEn: "Fainting", nameNe: "मूर्छा", bodyArea: "head" },
  { id: "tremors", nameEn: "Tremors / shaking", nameNe: "कम्पन", bodyArea: "head" },
  { id: "numbness-tingling", nameEn: "Numbness or tingling", nameNe: "सुन्निने वा झनझनाउने", bodyArea: "head" },
  { id: "difficulty-speaking", nameEn: "Difficulty speaking", nameNe: "बोल्न कठिनाई", bodyArea: "head" },
  { id: "loss-of-balance", nameEn: "Loss of balance", nameNe: "सन्तुलन गुम्ने", bodyArea: "head" },
  { id: "paralysis", nameEn: "Paralysis / weakness on one side", nameNe: "पक्षाघात / एकातिर कमजोरी", bodyArea: "head" },

  // Eyes
  { id: "blurred-vision", nameEn: "Blurred vision", nameNe: "धमिलो दृष्टि", bodyArea: "eyes" },
  { id: "eye-pain", nameEn: "Eye pain", nameNe: "आँखा दुखाइ", bodyArea: "eyes" },
  { id: "red-eyes", nameEn: "Red eyes", nameNe: "आँखा रातो हुने", bodyArea: "eyes" },
  { id: "watery-eyes", nameEn: "Watery eyes", nameNe: "आँखाबाट पानी आउने", bodyArea: "eyes" },
  { id: "double-vision", nameEn: "Double vision", nameNe: "दोहोरो दृष्टि", bodyArea: "eyes" },
  { id: "eye-discharge", nameEn: "Eye discharge", nameNe: "आँखाबाट पिप आउने", bodyArea: "eyes" },
  { id: "vision-loss", nameEn: "Vision loss", nameNe: "दृष्टि गुम्ने", bodyArea: "eyes" },
  { id: "light-sensitivity", nameEn: "Light sensitivity", nameNe: "प्रकाश सहन नसक्ने", bodyArea: "eyes" },
  { id: "eye-floaters", nameEn: "Floaters in vision", nameNe: "आँखामा धब्बा देखिने", bodyArea: "eyes" },

  // Ear, Nose & Throat
  { id: "ear-pain", nameEn: "Ear pain", nameNe: "कान दुखाइ", bodyArea: "ear-nose-throat" },
  { id: "hearing-loss", nameEn: "Hearing loss", nameNe: "सुन्ने शक्ति कम हुने", bodyArea: "ear-nose-throat" },
  { id: "tinnitus", nameEn: "Ringing in ears", nameNe: "कानमा घन्घनाउने", bodyArea: "ear-nose-throat" },
  { id: "sinus-pain", nameEn: "Sinus pain / pressure", nameNe: "साइनस दुखाइ", bodyArea: "ear-nose-throat" },
  { id: "nasal-congestion", nameEn: "Nasal congestion", nameNe: "नाक बन्द हुने", bodyArea: "ear-nose-throat" },
  { id: "nosebleed", nameEn: "Nosebleed", nameNe: "नाकबाट रगत आउने", bodyArea: "ear-nose-throat" },
  { id: "sore-throat", nameEn: "Sore throat", nameNe: "घाँटी दुखाइ", bodyArea: "ear-nose-throat" },
  { id: "difficulty-swallowing", nameEn: "Difficulty swallowing", nameNe: "निल्न कठिनाई", bodyArea: "ear-nose-throat" },
  { id: "hoarse-voice", nameEn: "Hoarse voice", nameNe: "आवाज बस्ने", bodyArea: "ear-nose-throat" },
  { id: "snoring", nameEn: "Snoring", nameNe: "घुर्ने", bodyArea: "ear-nose-throat" },
  { id: "runny-nose", nameEn: "Runny nose", nameNe: "नाक बग्ने", bodyArea: "ear-nose-throat" },

  // Chest & Heart
  { id: "chest-pain", nameEn: "Chest pain", nameNe: "छातीमा दुखाइ", bodyArea: "chest" },
  { id: "heart-palpitations", nameEn: "Heart palpitations", nameNe: "मुटु ढक्‌ढक् हुने", bodyArea: "chest" },
  { id: "irregular-heartbeat", nameEn: "Irregular heartbeat", nameNe: "अनियमित मुटुको धड्कन", bodyArea: "chest" },
  { id: "high-blood-pressure", nameEn: "High blood pressure", nameNe: "उच्च रक्तचाप", bodyArea: "chest" },
  { id: "chest-tightness", nameEn: "Chest tightness", nameNe: "छाती कसिने", bodyArea: "chest" },

  // Breathing & Lungs
  { id: "shortness-of-breath", nameEn: "Shortness of breath", nameNe: "सास फेर्न गाह्रो", bodyArea: "respiratory" },
  { id: "cough", nameEn: "Cough", nameNe: "खोकी", bodyArea: "respiratory" },
  { id: "chronic-cough", nameEn: "Chronic cough (>3 weeks)", nameNe: "दीर्घकालीन खोकी (३ हप्ताभन्दा बढी)", bodyArea: "respiratory" },
  { id: "wheezing", nameEn: "Wheezing", nameNe: "सिट्ठी बजाउँदै सास फेर्ने", bodyArea: "respiratory" },
  { id: "coughing-blood", nameEn: "Coughing blood", nameNe: "खोक्दा रगत आउने", bodyArea: "respiratory" },
  { id: "asthma", nameEn: "Asthma symptoms", nameNe: "दमको लक्षण", bodyArea: "respiratory" },
  { id: "sleep-apnea", nameEn: "Sleep apnea", nameNe: "सुत्दा सास रोकिने", bodyArea: "respiratory" },
  { id: "difficulty-breathing", nameEn: "Difficulty breathing", nameNe: "सास फेर्न कठिनाई", bodyArea: "respiratory" },

  // Stomach & Digestion
  { id: "abdominal-pain", nameEn: "Abdominal pain", nameNe: "पेट दुखाइ", bodyArea: "abdomen" },
  { id: "nausea", nameEn: "Nausea", nameNe: "वाकवाकी", bodyArea: "abdomen" },
  { id: "vomiting", nameEn: "Vomiting", nameNe: "बान्ता", bodyArea: "abdomen" },
  { id: "diarrhea", nameEn: "Diarrhea", nameNe: "दिसा", bodyArea: "abdomen" },
  { id: "constipation", nameEn: "Constipation", nameNe: "कब्जियत", bodyArea: "abdomen" },
  { id: "bloating", nameEn: "Bloating", nameNe: "पेट फुल्ने", bodyArea: "abdomen" },
  { id: "heartburn", nameEn: "Heartburn / acid reflux", nameNe: "छातीमा जलन / एसिडिटी", bodyArea: "abdomen" },
  { id: "blood-in-stool", nameEn: "Blood in stool", nameNe: "दिसामा रगत", bodyArea: "abdomen" },
  { id: "jaundice", nameEn: "Jaundice (yellowing)", nameNe: "जण्डिस (पहेँलो हुने)", bodyArea: "abdomen" },
  { id: "loss-of-appetite", nameEn: "Loss of appetite", nameNe: "भोक नलाग्ने", bodyArea: "abdomen" },
  { id: "appendicitis-pain", nameEn: "Right lower abdominal pain", nameNe: "तल दायाँ पेटमा दुखाइ", bodyArea: "abdomen" },
  { id: "gallbladder-pain", nameEn: "Upper right abdominal pain", nameNe: "माथि दायाँ पेटमा दुखाइ", bodyArea: "abdomen" },

  // Bones, Joints & Muscles
  { id: "joint-pain", nameEn: "Joint pain", nameNe: "जोर्नी दुखाइ", bodyArea: "musculoskeletal" },
  { id: "back-pain", nameEn: "Back pain", nameNe: "ढाड दुखाइ", bodyArea: "musculoskeletal" },
  { id: "knee-pain", nameEn: "Knee pain", nameNe: "घुँडा दुखाइ", bodyArea: "musculoskeletal" },
  { id: "shoulder-pain", nameEn: "Shoulder pain", nameNe: "काँध दुखाइ", bodyArea: "musculoskeletal" },
  { id: "neck-pain", nameEn: "Neck pain", nameNe: "घाँटी दुखाइ", bodyArea: "musculoskeletal" },
  { id: "fracture", nameEn: "Suspected fracture", nameNe: "हाड भाँचिएको शंका", bodyArea: "musculoskeletal" },
  { id: "swollen-joints", nameEn: "Swollen joints", nameNe: "जोर्नी सुन्निने", bodyArea: "musculoskeletal" },
  { id: "joint-swelling", nameEn: "Joint swelling with stiffness", nameNe: "जोर्नी सुन्निने र अकडिने", bodyArea: "musculoskeletal" },
  { id: "bone-pain", nameEn: "Bone pain", nameNe: "हाड दुखाइ", bodyArea: "musculoskeletal" },
  { id: "muscle-weakness", nameEn: "Muscle weakness", nameNe: "मांसपेशी कमजोरी", bodyArea: "musculoskeletal" },
  { id: "muscle-pain", nameEn: "Muscle pain", nameNe: "मांसपेशी दुखाइ", bodyArea: "musculoskeletal" },
  { id: "morning-stiffness", nameEn: "Morning stiffness", nameNe: "बिहान अकड्ने", bodyArea: "musculoskeletal" },
  { id: "difficulty-walking", nameEn: "Difficulty walking", nameNe: "हिँड्न गाह्रो", bodyArea: "musculoskeletal" },
  { id: "sports-injury", nameEn: "Sports / exercise injury", nameNe: "खेलकुद / व्यायामको चोट", bodyArea: "musculoskeletal" },

  // Skin & Hair
  { id: "skin-rash", nameEn: "Skin rash", nameNe: "छालामा दाद", bodyArea: "skin" },
  { id: "itching", nameEn: "Itching", nameNe: "चिलाउने", bodyArea: "skin" },
  { id: "acne", nameEn: "Acne / pimples", nameNe: "डण्डिफोर", bodyArea: "skin" },
  { id: "hair-loss", nameEn: "Hair loss", nameNe: "कपाल झर्ने", bodyArea: "skin" },
  { id: "skin-discoloration", nameEn: "Skin discoloration", nameNe: "छालाको रंग परिवर्तन", bodyArea: "skin" },
  { id: "eczema", nameEn: "Eczema", nameNe: "एक्जिमा", bodyArea: "skin" },
  { id: "psoriasis", nameEn: "Psoriasis", nameNe: "सोरायसिस", bodyArea: "skin" },
  { id: "fungal-infection", nameEn: "Fungal infection", nameNe: "ढुसी संक्रमण", bodyArea: "skin" },
  { id: "warts", nameEn: "Warts", nameNe: "मस्सा", bodyArea: "skin" },
  { id: "skin-ulcer", nameEn: "Skin ulcer / non-healing wound", nameNe: "छालामा घाउ / ननिको घाउ", bodyArea: "skin" },
  { id: "wound-not-healing", nameEn: "Wound not healing", nameNe: "घाउ ननिको", bodyArea: "skin" },

  // Urinary & Kidney
  { id: "painful-urination", nameEn: "Painful urination", nameNe: "पिसाब गर्दा दुखाइ", bodyArea: "urinary" },
  { id: "blood-in-urine", nameEn: "Blood in urine", nameNe: "पिसाबमा रगत", bodyArea: "urinary" },
  { id: "frequent-urination", nameEn: "Frequent urination", nameNe: "बारम्बार पिसाब लाग्ने", bodyArea: "urinary" },
  { id: "kidney-stones", nameEn: "Kidney stone symptoms", nameNe: "मृगौलामा पथरीको लक्षण", bodyArea: "urinary" },
  { id: "foamy-urine", nameEn: "Foamy urine", nameNe: "फेन आउने पिसाब", bodyArea: "urinary" },
  { id: "flank-pain", nameEn: "Flank / side pain", nameNe: "कम्मरमा दुखाइ", bodyArea: "urinary" },
  { id: "urinary-incontinence", nameEn: "Urinary incontinence", nameNe: "पिसाब चुहिने", bodyArea: "urinary" },
  { id: "swollen-legs", nameEn: "Swollen legs / ankles", nameNe: "खुट्टा सुन्निने", bodyArea: "urinary" },

  // Reproductive Health
  { id: "irregular-periods", nameEn: "Irregular periods", nameNe: "अनियमित महिनावारी", bodyArea: "reproductive" },
  { id: "pelvic-pain", nameEn: "Pelvic pain", nameNe: "श्रोणिमा दुखाइ", bodyArea: "reproductive" },
  { id: "pregnancy-concerns", nameEn: "Pregnancy concerns", nameNe: "गर्भावस्था सम्बन्धी चिन्ता", bodyArea: "reproductive" },
  { id: "abnormal-bleeding", nameEn: "Abnormal vaginal bleeding", nameNe: "असामान्य योनि रक्तस्राव", bodyArea: "reproductive" },
  { id: "menstrual-cramps", nameEn: "Severe menstrual cramps", nameNe: "तीव्र महिनावारी दुखाइ", bodyArea: "reproductive" },
  { id: "breast-lump", nameEn: "Breast lump", nameNe: "स्तनमा गाँठो", bodyArea: "reproductive" },
  { id: "vaginal-discharge", nameEn: "Abnormal vaginal discharge", nameNe: "असामान्य योनि स्राव", bodyArea: "reproductive" },
  { id: "infertility", nameEn: "Infertility concerns", nameNe: "बाँझोपनको चिन्ता", bodyArea: "reproductive" },
  { id: "menopause-symptoms", nameEn: "Menopause symptoms", nameNe: "रजोनिवृत्तिको लक्षण", bodyArea: "reproductive" },
  { id: "erectile-dysfunction", nameEn: "Erectile dysfunction", nameNe: "स्तम्भन दोष", bodyArea: "reproductive" },
  { id: "testicular-pain", nameEn: "Testicular pain / swelling", nameNe: "अण्डकोषमा दुखाइ / सुन्निने", bodyArea: "reproductive" },
  { id: "prostate-problems", nameEn: "Prostate problems", nameNe: "प्रोस्टेट समस्या", bodyArea: "reproductive" },

  // Mental Health
  { id: "depression", nameEn: "Depression", nameNe: "अवसाद", bodyArea: "mental" },
  { id: "anxiety", nameEn: "Anxiety", nameNe: "चिन्ता", bodyArea: "mental" },
  { id: "insomnia", nameEn: "Insomnia / sleep problems", nameNe: "निद्रा नलाग्ने", bodyArea: "mental" },
  { id: "panic-attacks", nameEn: "Panic attacks", nameNe: "आतंक आक्रमण", bodyArea: "mental" },
  { id: "mood-swings", nameEn: "Mood swings", nameNe: "मनोदशा परिवर्तन", bodyArea: "mental" },
  { id: "hallucinations", nameEn: "Hallucinations", nameNe: "भ्रम", bodyArea: "mental" },
  { id: "substance-abuse", nameEn: "Substance abuse", nameNe: "मादक पदार्थ दुरुपयोग", bodyArea: "mental" },
  { id: "stress", nameEn: "Excessive stress", nameNe: "अत्यधिक तनाव", bodyArea: "mental" },
  { id: "suicidal-thoughts", nameEn: "Suicidal thoughts", nameNe: "आत्महत्याको विचार", bodyArea: "mental" },

  // General / Whole Body
  { id: "fever", nameEn: "Fever", nameNe: "ज्वरो", bodyArea: "general" },
  { id: "cold", nameEn: "Common cold", nameNe: "रुघा", bodyArea: "general" },
  { id: "fatigue", nameEn: "Fatigue / tiredness", nameNe: "थकान", bodyArea: "general" },
  { id: "chronic-fatigue", nameEn: "Chronic fatigue", nameNe: "दीर्घकालीन थकान", bodyArea: "general" },
  { id: "persistent-fatigue", nameEn: "Persistent unexplained fatigue", nameNe: "लगातार अस्पष्ट थकान", bodyArea: "general" },
  { id: "body-aches", nameEn: "Body aches", nameNe: "शरीर दुखाइ", bodyArea: "general" },
  { id: "weight-loss-unexplained", nameEn: "Unexplained weight loss", nameNe: "अस्पष्ट तौल घट्ने", bodyArea: "general" },
  { id: "weight-gain-unexplained", nameEn: "Unexplained weight gain", nameNe: "अस्पष्ट तौल बढ्ने", bodyArea: "general" },
  { id: "general-weakness", nameEn: "General weakness", nameNe: "सामान्य कमजोरी", bodyArea: "general" },
  { id: "night-sweats", nameEn: "Night sweats", nameNe: "रातको पसिना", bodyArea: "general" },
  { id: "swollen-lymph-nodes", nameEn: "Swollen lymph nodes", nameNe: "लिम्फ नोड सुन्निने", bodyArea: "general" },
  { id: "unexplained-lump", nameEn: "Unexplained lump", nameNe: "अस्पष्ट गाँठो", bodyArea: "general" },
  { id: "excessive-thirst", nameEn: "Excessive thirst", nameNe: "अत्यधिक तिर्खा", bodyArea: "general" },
  { id: "excessive-hunger", nameEn: "Excessive hunger", nameNe: "अत्यधिक भोक", bodyArea: "general" },
  { id: "diabetes-symptoms", nameEn: "Diabetes symptoms", nameNe: "मधुमेहको लक्षण", bodyArea: "general" },
  { id: "thyroid-problems", nameEn: "Thyroid problems", nameNe: "थाइरोइड समस्या", bodyArea: "general" },
  { id: "hormonal-imbalance", nameEn: "Hormonal imbalance", nameNe: "हर्मोन असन्तुलन", bodyArea: "general" },
  { id: "anemia", nameEn: "Anemia symptoms", nameNe: "रक्तअल्पताको लक्षण", bodyArea: "general" },
  { id: "hernia", nameEn: "Hernia", nameNe: "हर्निया", bodyArea: "general" },
  { id: "severe-bleeding", nameEn: "Severe bleeding", nameNe: "भारी रक्तस्राव", bodyArea: "general" },
  { id: "loss-of-consciousness", nameEn: "Loss of consciousness", nameNe: "होस गुम्ने", bodyArea: "general" },
  { id: "severe-burns", nameEn: "Severe burns", nameNe: "गम्भीर पोलेको", bodyArea: "general" },
  { id: "poisoning", nameEn: "Poisoning / toxic exposure", nameNe: "विषाक्तता", bodyArea: "general" },

  // Child Health
  { id: "child-fever", nameEn: "Child: Fever", nameNe: "बच्चा: ज्वरो", bodyArea: "child" },
  { id: "child-cough", nameEn: "Child: Cough / cold", nameNe: "बच्चा: खोकी / रुघा", bodyArea: "child" },
  { id: "child-rash", nameEn: "Child: Skin rash", nameNe: "बच्चा: छालामा दाद", bodyArea: "child" },
  { id: "growth-concerns", nameEn: "Child: Growth concerns", nameNe: "बच्चा: वृद्धि सम्बन्धी चिन्ता", bodyArea: "child" },
  { id: "vaccination", nameEn: "Child: Vaccination", nameNe: "बच्चा: खोप", bodyArea: "child" },
  { id: "child-diarrhea", nameEn: "Child: Diarrhea", nameNe: "बच्चा: दिसा", bodyArea: "child" },
  { id: "child-vomiting", nameEn: "Child: Vomiting", nameNe: "बच्चा: बान्ता", bodyArea: "child" },
  { id: "developmental-delay", nameEn: "Child: Developmental delay", nameNe: "बच्चा: विकास ढिलाइ", bodyArea: "child" },
  { id: "child-ear-pain", nameEn: "Child: Ear pain", nameNe: "बच्चा: कान दुखाइ", bodyArea: "child" },
];

/** Given a list of selected symptom IDs, returns specialties ranked by match count */
export function matchSymptomsToSpecialties(
  selectedSymptomIds: string[]
): { specialty: SpecialtyInfo; matchCount: number; matchedSymptoms: string[] }[] {
  if (selectedSymptomIds.length === 0) return [];

  const results = SPECIALTIES.filter((s) => s.symptoms.length > 0)
    .map((specialty) => {
      const matchedSymptoms = specialty.symptoms.filter((sym) =>
        selectedSymptomIds.includes(sym)
      );
      return {
        specialty,
        matchCount: matchedSymptoms.length,
        matchedSymptoms,
      };
    })
    .filter((r) => r.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount);

  return results;
}
