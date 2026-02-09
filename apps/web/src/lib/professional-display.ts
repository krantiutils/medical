/**
 * Display name logic for professionals.
 *
 * Database stores plain names (e.g. "Ram Sharma") without titles.
 * Doctors and dentists get "Dr." prefix at display time.
 * Pharmacists are shown as-is.
 */

type ProfessionalLike = {
  full_name: string;
  type: string;
};

export function getDisplayName(professional: ProfessionalLike): string {
  if (professional.type === "PHARMACIST") {
    return professional.full_name;
  }
  return `Dr. ${professional.full_name}`;
}
