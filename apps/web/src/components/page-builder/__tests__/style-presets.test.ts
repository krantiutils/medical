import { describe, it, expect } from "vitest";
import { STYLE_PRESETS, STYLE_PRESET_INFO } from "../lib/style-presets";
import type { StylePreset, StylePresetClasses } from "../lib/style-presets";

const ALL_PRESETS: StylePreset[] = ["bauhaus", "modern", "minimal", "warm"];

describe("style-presets", () => {
  describe("STYLE_PRESETS", () => {
    it("defines all four presets", () => {
      expect(Object.keys(STYLE_PRESETS)).toEqual(expect.arrayContaining(ALL_PRESETS));
      expect(Object.keys(STYLE_PRESETS)).toHaveLength(4);
    });

    it.each(ALL_PRESETS)("%s preset has all required keys", (name) => {
      const preset = STYLE_PRESETS[name];
      const requiredKeys: (keyof StylePresetClasses)[] = [
        "border",
        "shadow",
        "radius",
        "hoverShadow",
        "cardClass",
        "headingWeight",
        "sectionDivider",
        "navBorder",
        "ctaClass",
        "ctaHover",
      ];

      for (const key of requiredKeys) {
        expect(preset).toHaveProperty(key);
        // All values should be strings (including empty string for minimal)
        expect(typeof preset[key]).toBe("string");
      }
    });

    it("bauhaus preset uses hard shadows and thick borders", () => {
      const p = STYLE_PRESETS.bauhaus;
      expect(p.border).toContain("border-4");
      expect(p.shadow).toContain("shadow-[");
      expect(p.radius).toBe("");
      expect(p.headingWeight).toBe("font-bold");
    });

    it("modern preset uses rounded corners and soft shadows", () => {
      const p = STYLE_PRESETS.modern;
      expect(p.radius).toContain("rounded");
      expect(p.shadow).toContain("shadow-lg");
      expect(p.headingWeight).toBe("font-semibold");
    });

    it("minimal preset has no borders or shadows", () => {
      const p = STYLE_PRESETS.minimal;
      expect(p.border).toBe("");
      expect(p.shadow).toBe("");
      expect(p.hoverShadow).toBe("");
      expect(p.headingWeight).toBe("font-medium");
    });

    it("warm preset uses amber color palette", () => {
      const p = STYLE_PRESETS.warm;
      expect(p.border).toContain("amber");
      expect(p.shadow).toContain("amber");
      expect(p.radius).toContain("rounded");
    });
  });

  describe("STYLE_PRESET_INFO", () => {
    it("has info entries for all presets", () => {
      expect(STYLE_PRESET_INFO).toHaveLength(4);
      const values = STYLE_PRESET_INFO.map((info) => info.value);
      expect(values).toEqual(expect.arrayContaining(ALL_PRESETS));
    });

    it("each info entry has required display fields", () => {
      for (const info of STYLE_PRESET_INFO) {
        expect(info.label).toBeTruthy();
        expect(info.labelNe).toBeTruthy();
        expect(info.description).toBeTruthy();
        expect(ALL_PRESETS).toContain(info.value);
      }
    });
  });
});
