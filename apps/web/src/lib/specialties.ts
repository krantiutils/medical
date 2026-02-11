export interface SpecialtyInfo {
  slug: string;
  nameEn: string;
  nameNe: string;
  descriptionEn: string;
  descriptionNe: string;
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
  },
  {
    slug: "cardiology",
    nameEn: "Cardiology",
    nameNe: "हृदय रोग",
    descriptionEn: "Find cardiologists across Nepal. Browse verified NMC-registered heart specialists.",
    descriptionNe: "नेपालभरका हृदय रोग विशेषज्ञहरू खोज्नुहोस्।",
  },
  {
    slug: "orthopedics",
    nameEn: "Orthopedics",
    nameNe: "हड्डी रोग",
    descriptionEn: "Find orthopedic doctors across Nepal. Browse verified NMC-registered bone and joint specialists.",
    descriptionNe: "नेपालभरका हड्डी रोग विशेषज्ञहरू खोज्नुहोस्।",
  },
  {
    slug: "pediatrics",
    nameEn: "Pediatrics",
    nameNe: "बालरोग",
    descriptionEn: "Find pediatricians across Nepal. Browse verified NMC-registered child health specialists.",
    descriptionNe: "नेपालभरका बालरोग विशेषज्ञहरू खोज्नुहोस्।",
  },
  {
    slug: "gynecology",
    nameEn: "Gynecology",
    nameNe: "स्त्री रोग",
    descriptionEn: "Find gynecologists across Nepal. Browse verified NMC-registered women's health specialists.",
    descriptionNe: "नेपालभरका स्त्री रोग विशेषज्ञहरू खोज्नुहोस्।",
  },
  {
    slug: "dermatology",
    nameEn: "Dermatology",
    nameNe: "छाला रोग",
    descriptionEn: "Find dermatologists across Nepal. Browse verified NMC-registered skin specialists.",
    descriptionNe: "नेपालभरका छाला रोग विशेषज्ञहरू खोज्नुहोस्।",
  },
  {
    slug: "neurology",
    nameEn: "Neurology",
    nameNe: "स्नायु रोग",
    descriptionEn: "Find neurologists across Nepal. Browse verified NMC-registered brain and nerve specialists.",
    descriptionNe: "नेपालभरका स्नायु रोग विशेषज्ञहरू खोज्नुहोस्।",
  },
  {
    slug: "ophthalmology",
    nameEn: "Ophthalmology",
    nameNe: "नेत्र रोग",
    descriptionEn: "Find ophthalmologists across Nepal. Browse verified NMC-registered eye specialists.",
    descriptionNe: "नेपालभरका नेत्र रोग विशेषज्ञहरू खोज्नुहोस्।",
  },
  {
    slug: "ent",
    nameEn: "ENT",
    nameNe: "कान नाक घाँटी",
    descriptionEn: "Find ENT specialists across Nepal. Browse verified NMC-registered ear, nose, and throat doctors.",
    descriptionNe: "नेपालभरका कान नाक घाँटी विशेषज्ञहरू खोज्नुहोस्।",
  },
  {
    slug: "surgery",
    nameEn: "Surgery",
    nameNe: "शल्यचिकित्सा",
    descriptionEn: "Find surgeons across Nepal. Browse verified NMC-registered surgical specialists.",
    descriptionNe: "नेपालभरका शल्यचिकित्सा विशेषज्ञहरू खोज्नुहोस्।",
  },
  {
    slug: "psychiatry",
    nameEn: "Psychiatry",
    nameNe: "मानसिक रोग",
    descriptionEn: "Find psychiatrists across Nepal. Browse verified NMC-registered mental health specialists.",
    descriptionNe: "नेपालभरका मानसिक रोग विशेषज्ञहरू खोज्नुहोस्।",
  },
  {
    slug: "radiology",
    nameEn: "Radiology",
    nameNe: "रेडियोलोजी",
    descriptionEn: "Find radiologists across Nepal. Browse verified NMC-registered imaging specialists.",
    descriptionNe: "नेपालभरका रेडियोलोजी विशेषज्ञहरू खोज्नुहोस्।",
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
