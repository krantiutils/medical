/**
 * Display name logic for professionals.
 *
 * Some database records already include "Dr." / "Dr " / "DR." in full_name
 * (from CSV seed data), while others store plain names. This function:
 * 1. Strips any existing "Dr." / "Dr " / "DR." prefix to normalize
 * 2. Title-cases ALL CAPS names for readability
 * 3. Re-adds "Dr." prefix for doctors and dentists
 * Pharmacists are shown as-is (with title-casing if needed).
 */

type ProfessionalLike = {
  full_name: string;
  type: string;
};

/** Strip any variant of "Dr" prefix: "Dr.", "Dr ", "DR.", "Dr," etc. */
function stripDrPrefix(name: string): string {
  return name.replace(/^dr[.,]?\s*/i, "").trim();
}

/** Convert ALL CAPS name to Title Case: "AABHARNA REGMI" → "Aabharna Regmi" */
function toTitleCase(name: string): string {
  // Only convert if the name is mostly uppercase (allow short words like "K.C")
  const words = name.split(/\s+/);
  const upperCount = words.filter(w => w.length > 2 && w === w.toUpperCase()).length;
  if (upperCount < words.length / 2) return name;

  return words
    .map((word) => {
      // Preserve abbreviations like "K.C", "G.M", "MD"
      if (/^[A-Z]\./.test(word) || (word.length <= 3 && word === word.toUpperCase())) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

export function getDisplayName(professional: ProfessionalLike): string {
  let name = stripDrPrefix(professional.full_name);
  name = toTitleCase(name);

  if (professional.type === "PHARMACIST") {
    return name;
  }
  return `Dr. ${name}`;
}
