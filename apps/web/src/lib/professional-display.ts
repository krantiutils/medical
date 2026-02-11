/**
 * Display name logic for professionals.
 *
 * Some database records already include "Dr." in full_name (from CSV seed data),
 * while others store plain names. This function safely adds the prefix only when
 * needed, preventing "Dr. Dr." double-prefix bugs.
 *
 * Doctors and dentists get "Dr." prefix at display time (if not already present).
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
  if (professional.full_name.startsWith("Dr.")) {
    return professional.full_name;
  }
  return `Dr. ${professional.full_name}`;
}
