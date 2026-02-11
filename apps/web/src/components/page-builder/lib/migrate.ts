import type {
  PageBuilderConfig,
  PageBuilderConfigV1,
  AnyPageBuilderConfig,
  BuilderPage,
  FooterConfig,
  PageSection,
  PhotoGallerySection,
} from "@/types/page-builder";

function defaultFooter(): FooterConfig {
  return {
    enabled: true,
    showClinicName: true,
    showPhone: true,
    showEmail: true,
    showAddress: false,
    copyright: "",
    copyrightNe: "",
    style: { bgColor: "foreground", textColor: "white" },
  };
}

function generatePageId(): string {
  return `page-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
}

/**
 * Migrate a v1 config (flat sections[]) to v2 (pages[], footer, stylePreset).
 * Wraps existing sections into a single "Home" page.
 */
export function migrateV1toV2(v1: PageBuilderConfigV1): PageBuilderConfig {
  const homePage: BuilderPage = {
    id: generatePageId(),
    slug: "home",
    title: "Home",
    titleNe: "गृहपृष्ठ",
    sections: v1.sections || [],
    isHomePage: true,
    visible: true,
  };

  return {
    version: 2,
    enabled: v1.enabled,
    stylePreset: "bauhaus",
    navbar: v1.navbar,
    footer: defaultFooter(),
    pages: [homePage],
    templateId: v1.templateId,
    updatedAt: v1.updatedAt,
  };
}

/** Default variant per section type — must match the type defaults */
const DEFAULT_VARIANTS: Record<string, string> = {
  hero: "centered",
  text: "standard",
  services_grid: "cards",
  doctor_showcase: "cards",
  photo_gallery: "grid",
  contact_info: "list",
  testimonials: "cards",
  faq: "accordion",
  booking: "standard",
  opd_schedule: "table",
  map_embed: "standard",
  divider: "line",
  button: "row",
  image: "standard",
};

/**
 * Backfill section-level fields added after initial release.
 * Mutates sections in-place for convenience (called on freshly parsed JSON).
 */
function backfillSections(sections: PageSection[]): void {
  for (const section of sections) {
    const data = section.data as Record<string, unknown>;

    // Backfill variant for all section types
    if (!data.variant) {
      // For photo_gallery, map legacy layout field to variant
      if (section.type === "photo_gallery") {
        const galleryData = data as PhotoGallerySection["data"];
        data.variant = galleryData.layout || "grid";
        if (!galleryData.layout) {
          galleryData.layout = "grid";
        }
      } else {
        data.variant = DEFAULT_VARIANTS[section.type] || "standard";
      }
    }

    // Legacy backfill: photo_gallery layout field
    if (section.type === "photo_gallery") {
      const galleryData = data as PhotoGallerySection["data"];
      if (!galleryData.layout) {
        galleryData.layout = "grid";
      }
    }
  }
}

/**
 * Ensure a config is at the latest version (v2).
 * If already v2, returns as-is. If v1, migrates.
 * If null/undefined, returns null.
 */
export function ensureV2(raw: AnyPageBuilderConfig | null | undefined): PageBuilderConfig | null {
  if (!raw) return null;

  let config: PageBuilderConfig | null = null;

  if (raw.version === 2) {
    config = raw as PageBuilderConfig;
  } else if (raw.version === 1) {
    config = migrateV1toV2(raw as PageBuilderConfigV1);
  } else if ("sections" in raw && Array.isArray((raw as PageBuilderConfigV1).sections)) {
    // Unknown version — attempt v1 migration as best-effort fallback
    config = migrateV1toV2(raw as PageBuilderConfigV1);
  }

  if (!config) return null;

  // Backfill any missing fields in all pages' sections
  for (const page of config.pages) {
    backfillSections(page.sections);
  }

  return config;
}

/**
 * Create an empty v2 config.
 */
export function createEmptyConfig(): PageBuilderConfig {
  return {
    version: 2,
    enabled: false,
    stylePreset: "bauhaus",
    navbar: {
      logo: true,
      clinicName: true,
      links: [],
      style: { bgColor: "white", textColor: "foreground" },
    },
    footer: defaultFooter(),
    pages: [
      {
        id: generatePageId(),
        slug: "home",
        title: "Home",
        titleNe: "गृहपृष्ठ",
        sections: [],
        isHomePage: true,
        visible: true,
      },
    ],
    templateId: null,
    updatedAt: new Date().toISOString(),
  };
}
