import { describe, it, expect } from "vitest";
import { migrateV1toV2, ensureV2, createEmptyConfig } from "../lib/migrate";
import type { PageBuilderConfigV1, PageBuilderConfig, PageSection } from "@/types/page-builder";
import { createHeroSection, createTextSection } from "../lib/section-defaults";

function makeV1Config(overrides?: Partial<PageBuilderConfigV1>): PageBuilderConfigV1 {
  return {
    version: 1,
    enabled: true,
    navbar: {
      logo: true,
      clinicName: true,
      links: [
        { id: "nav-1", label: "About", labelNe: "बारेमा", href: "#about", openInNewTab: false },
      ],
      style: { bgColor: "white", textColor: "foreground" },
    },
    sections: [createHeroSection(), createTextSection()],
    templateId: "classic",
    updatedAt: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("migrateV1toV2", () => {
  it("converts v1 config to v2 with a single home page", () => {
    const v1 = makeV1Config();
    const v2 = migrateV1toV2(v1);

    expect(v2.version).toBe(2);
    expect(v2.enabled).toBe(v1.enabled);
    expect(v2.navbar).toEqual(v1.navbar);
    expect(v2.templateId).toBe(v1.templateId);
    expect(v2.updatedAt).toBe(v1.updatedAt);
    expect(v2.stylePreset).toBe("bauhaus");
  });

  it("wraps sections into a home page", () => {
    const v1 = makeV1Config();
    const v2 = migrateV1toV2(v1);

    expect(v2.pages).toHaveLength(1);
    const homePage = v2.pages[0];
    expect(homePage.slug).toBe("home");
    expect(homePage.isHomePage).toBe(true);
    expect(homePage.visible).toBe(true);
    expect(homePage.title).toBe("Home");
    expect(homePage.sections).toEqual(v1.sections);
  });

  it("creates a default footer", () => {
    const v1 = makeV1Config();
    const v2 = migrateV1toV2(v1);

    expect(v2.footer).toBeDefined();
    expect(v2.footer.enabled).toBe(true);
    expect(v2.footer.showClinicName).toBe(true);
    expect(v2.footer.showPhone).toBe(true);
    expect(v2.footer.style).toBeDefined();
  });

  it("handles empty sections array", () => {
    const v1 = makeV1Config({ sections: [] });
    const v2 = migrateV1toV2(v1);

    expect(v2.pages[0].sections).toEqual([]);
  });

  it("preserves enabled: false", () => {
    const v1 = makeV1Config({ enabled: false });
    const v2 = migrateV1toV2(v1);

    expect(v2.enabled).toBe(false);
  });
});

describe("ensureV2", () => {
  it("returns null for null input", () => {
    expect(ensureV2(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(ensureV2(undefined)).toBeNull();
  });

  it("returns v2 config as-is", () => {
    const v2: PageBuilderConfig = {
      version: 2,
      enabled: true,
      stylePreset: "modern",
      navbar: {
        logo: true,
        clinicName: true,
        links: [],
        style: { bgColor: "white", textColor: "foreground" },
      },
      footer: {
        enabled: true,
        showClinicName: true,
        showPhone: true,
        showEmail: true,
        showAddress: false,
        copyright: "",
        copyrightNe: "",
        style: { bgColor: "foreground", textColor: "white" },
      },
      pages: [
        {
          id: "page-1",
          slug: "home",
          title: "Home",
          titleNe: "गृहपृष्ठ",
          sections: [],
          isHomePage: true,
          visible: true,
        },
      ],
      templateId: null,
      updatedAt: "2025-01-01T00:00:00Z",
    };

    const result = ensureV2(v2);
    expect(result).toBe(v2); // Same reference
  });

  it("migrates v1 config to v2", () => {
    const v1 = makeV1Config();
    const result = ensureV2(v1);

    expect(result).not.toBeNull();
    expect(result!.version).toBe(2);
    expect(result!.pages).toHaveLength(1);
    expect(result!.pages[0].sections).toEqual(v1.sections);
  });

  it("handles pre-versioned configs with sections array (best-effort fallback)", () => {
    // A config that has sections but no version field
    const raw = {
      enabled: true,
      navbar: {
        logo: true,
        clinicName: true,
        links: [],
        style: { bgColor: "white" as const, textColor: "foreground" as const },
      },
      sections: [createHeroSection()],
      templateId: null,
      updatedAt: "2025-01-01T00:00:00Z",
    };

    const result = ensureV2(raw as any);
    expect(result).not.toBeNull();
    expect(result!.version).toBe(2);
  });
});

describe("createEmptyConfig", () => {
  it("creates a valid v2 config", () => {
    const config = createEmptyConfig();

    expect(config.version).toBe(2);
    expect(config.enabled).toBe(false);
    expect(config.stylePreset).toBe("bauhaus");
    expect(config.templateId).toBeNull();
    expect(config.updatedAt).toBeTruthy();
  });

  it("has a single empty home page", () => {
    const config = createEmptyConfig();

    expect(config.pages).toHaveLength(1);
    const home = config.pages[0];
    expect(home.slug).toBe("home");
    expect(home.isHomePage).toBe(true);
    expect(home.visible).toBe(true);
    expect(home.sections).toEqual([]);
  });

  it("has a navbar with defaults", () => {
    const config = createEmptyConfig();

    expect(config.navbar.logo).toBe(true);
    expect(config.navbar.clinicName).toBe(true);
    expect(config.navbar.links).toEqual([]);
  });

  it("has a footer with defaults", () => {
    const config = createEmptyConfig();

    expect(config.footer.enabled).toBe(true);
    expect(config.footer.showClinicName).toBe(true);
  });

  it("generates unique page IDs on each call", () => {
    const c1 = createEmptyConfig();
    const c2 = createEmptyConfig();

    expect(c1.pages[0].id).not.toBe(c2.pages[0].id);
  });
});
