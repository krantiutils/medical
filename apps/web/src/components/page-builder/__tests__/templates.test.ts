import { describe, it, expect } from "vitest";
import { TEMPLATES } from "../lib/templates";
import type { PageBuilderConfig } from "@/types/page-builder";

describe("templates", () => {
  it("defines at least 3 templates", () => {
    expect(TEMPLATES.length).toBeGreaterThanOrEqual(3);
  });

  it.each(TEMPLATES.map((t) => [t.id, t] as const))("template %s produces valid v2 config", (_id, template) => {
    const config = template.createConfig();

    expect(config.version).toBe(2);
    expect(typeof config.enabled).toBe("boolean");
    expect(config.navbar).toBeDefined();
    expect(config.footer).toBeDefined();
    expect(config.pages).toBeDefined();
    expect(config.pages.length).toBeGreaterThanOrEqual(1);
    expect(config.templateId).toBe(template.id);
    expect(config.updatedAt).toBeTruthy();
    expect(["bauhaus", "modern", "minimal", "warm"]).toContain(config.stylePreset);
  });

  it.each(TEMPLATES.map((t) => [t.id, t] as const))("template %s has at least one home page", (_id, template) => {
    const config = template.createConfig();
    const homePages = config.pages.filter((p) => p.isHomePage);
    expect(homePages).toHaveLength(1);
  });

  it.each(TEMPLATES.map((t) => [t.id, t] as const))("template %s pages have unique IDs", (_id, template) => {
    const config = template.createConfig();
    const ids = config.pages.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(TEMPLATES.map((t) => [t.id, t] as const))("template %s pages have unique slugs", (_id, template) => {
    const config = template.createConfig();
    const slugs = config.pages.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it.each(TEMPLATES.map((t) => [t.id, t] as const))("template %s sections all have valid type and id", (_id, template) => {
    const config = template.createConfig();
    const validTypes = [
      "hero", "text", "services_grid", "doctor_showcase", "photo_gallery",
      "contact_info", "testimonials", "faq", "booking", "opd_schedule",
      "map_embed", "divider",
    ];

    for (const page of config.pages) {
      for (const section of page.sections) {
        expect(validTypes).toContain(section.type);
        expect(section.id).toBeTruthy();
        expect(section.style).toBeDefined();
      }
    }
  });

  describe("template display info", () => {
    it.each(TEMPLATES.map((t) => [t.id, t] as const))("template %s has display metadata", (_id, template) => {
      expect(template.name).toBeTruthy();
      expect(template.nameNe).toBeTruthy();
      expect(template.description).toBeTruthy();
      expect(template.descriptionNe).toBeTruthy();
      expect(template.preview).toBeTruthy();
    });
  });

  describe("classic template", () => {
    it("creates hero, about, services, doctors, booking, contact sections", () => {
      const classic = TEMPLATES.find((t) => t.id === "classic")!;
      const config = classic.createConfig();
      const homePage = config.pages.find((p) => p.isHomePage)!;
      const types = homePage.sections.map((s) => s.type);

      expect(types).toContain("hero");
      expect(types).toContain("text"); // about
      expect(types).toContain("services_grid");
      expect(types).toContain("doctor_showcase");
      expect(types).toContain("booking");
      expect(types).toContain("contact_info");
    });

    it("has nav links", () => {
      const classic = TEMPLATES.find((t) => t.id === "classic")!;
      const config = classic.createConfig();
      expect(config.navbar.links.length).toBeGreaterThan(0);
    });
  });

  describe("full template", () => {
    it("creates multiple pages", () => {
      const full = TEMPLATES.find((t) => t.id === "full")!;
      const config = full.createConfig();
      expect(config.pages.length).toBeGreaterThan(1);
    });

    it("uses modern style preset", () => {
      const full = TEMPLATES.find((t) => t.id === "full")!;
      const config = full.createConfig();
      expect(config.stylePreset).toBe("modern");
    });
  });

  describe("minimal template", () => {
    it("uses minimal style preset", () => {
      const minimal = TEMPLATES.find((t) => t.id === "minimal")!;
      const config = minimal.createConfig();
      expect(config.stylePreset).toBe("minimal");
    });

    it("has fewer sections than classic", () => {
      const minimal = TEMPLATES.find((t) => t.id === "minimal")!;
      const classic = TEMPLATES.find((t) => t.id === "classic")!;

      const minSections = minimal.createConfig().pages[0].sections.length;
      const classSections = classic.createConfig().pages[0].sections.length;

      expect(minSections).toBeLessThan(classSections);
    });
  });
});
