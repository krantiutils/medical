/**
 * Formats a professional's name with the appropriate prefix.
 * Strips any existing "Dr." prefix before adding it to prevent doubling
 * (e.g., "Dr. Dr. Smith" when the database already stores "Dr. Smith").
 */
export function formatDoctorName(fullName: string): string {
  const stripped = fullName.replace(/^Dr\.?\s*/i, "").trim();
  return `Dr. ${stripped}`;
}

/**
 * Formats a professional's display name based on their type.
 * Pharmacists get their plain name; doctors and dentists get "Dr." prefix.
 */
export function formatProfessionalName(
  fullName: string,
  type: string,
): string {
  if (type === "PHARMACIST") {
    return fullName;
  }
  return formatDoctorName(fullName);
}
