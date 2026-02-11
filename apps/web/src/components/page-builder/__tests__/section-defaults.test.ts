import { describe, it, expect } from "vitest";
import {
  createSection,
  createHeroSection,
  createTextSection,
  createServicesGridSection,
  createDoctorShowcaseSection,
  createPhotoGallerySection,
  createContactInfoSection,
  createTestimonialsSection,
  createFAQSection,
  createBookingSection,
  createOPDScheduleSection,
  createMapEmbedSection,
  createDividerSection,
} from "../lib/section-defaults";
import type { SectionType } from "@/types/page-builder";

const ALL_SECTION_TYPES: SectionType[] = [
  "hero",
  "text",
  "services_grid",
  "doctor_showcase",
  "photo_gallery",
  "contact_info",
  "testimonials",
  "faq",
  "booking",
  "opd_schedule",
  "map_embed",
  "divider",
];

describe("section-defaults", () => {
  describe("createSection factory", () => {
    it.each(ALL_SECTION_TYPES)("creates a valid %s section", (type) => {
      const section = createSection(type);
      expect(section).toBeDefined();
      expect(section.type).toBe(type);
      expect(section.id).toBeTruthy();
      expect(section.visible).toBe(true);
      expect(section.anchorId).toBeTruthy();
      expect(section.style).toBeDefined();
      expect(section.style.bgColor).toBeTruthy();
      expect(section.style.textColor).toBeTruthy();
      expect(section.style.padding).toBeTruthy();
      expect(section.style.layout).toBeTruthy();
    });

    it("generates unique IDs for each section", () => {
      const ids = ALL_SECTION_TYPES.map((type) => createSection(type).id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe("createHeroSection", () => {
    it("produces default hero with correct structure", () => {
      const hero = createHeroSection();
      expect(hero.type).toBe("hero");
      expect(hero.data.heading).toBeTruthy();
      expect(hero.data.headingNe).toBeTruthy();
      expect(hero.data.subtitle).toBeTruthy();
      expect(hero.data.showLogo).toBe(true);
      expect(hero.data.image).toBeNull();
      expect(hero.style.padding).toBe("lg");
      expect(hero.style.layout).toBe("full");
      expect(hero.style.bgColor).toBe("primary-blue");
    });

    it("accepts overrides", () => {
      const hero = createHeroSection({ heading: "Custom Heading", showLogo: false });
      expect(hero.data.heading).toBe("Custom Heading");
      expect(hero.data.showLogo).toBe(false);
      // Non-overridden values remain default
      expect(hero.data.subtitle).toBeTruthy();
    });
  });

  describe("createTextSection", () => {
    it("produces default text section", () => {
      const text = createTextSection();
      expect(text.type).toBe("text");
      expect(text.data.heading).toBe("About Us");
      expect(text.data.body).toBeTruthy();
      expect(text.data.bodyNe).toBeTruthy();
    });
  });

  describe("createServicesGridSection", () => {
    it("defaults to auto source with 3 columns", () => {
      const svc = createServicesGridSection();
      expect(svc.data.source).toBe("auto");
      expect(svc.data.columns).toBe(3);
      expect(svc.data.manualServices).toEqual([]);
    });
  });

  describe("createDoctorShowcaseSection", () => {
    it("defaults to show all display options", () => {
      const doc = createDoctorShowcaseSection();
      expect(doc.data.showSpecialty).toBe(true);
      expect(doc.data.showDegree).toBe(true);
      expect(doc.data.showRole).toBe(true);
      expect(doc.data.source).toBe("auto");
    });
  });

  describe("createPhotoGallerySection", () => {
    it("defaults to auto source", () => {
      const gallery = createPhotoGallerySection();
      expect(gallery.data.source).toBe("auto");
      expect(gallery.data.manualPhotos).toEqual([]);
    });
  });

  describe("createContactInfoSection", () => {
    it("shows all contact fields by default", () => {
      const contact = createContactInfoSection();
      expect(contact.data.showPhone).toBe(true);
      expect(contact.data.showEmail).toBe(true);
      expect(contact.data.showAddress).toBe(true);
      expect(contact.data.showWebsite).toBe(true);
      expect(contact.data.showHours).toBe(true);
    });
  });

  describe("createFAQSection", () => {
    it("comes with a default FAQ item", () => {
      const faq = createFAQSection();
      expect(faq.data.items.length).toBeGreaterThan(0);
      const item = faq.data.items[0];
      expect(item.id).toBeTruthy();
      expect(item.question).toBeTruthy();
      expect(item.answer).toBeTruthy();
    });
  });

  describe("createMapEmbedSection", () => {
    it("defaults to auto source with null manual coords", () => {
      const map = createMapEmbedSection();
      expect(map.data.source).toBe("auto");
      expect(map.data.manualLat).toBeNull();
      expect(map.data.manualLng).toBeNull();
      expect(map.data.height).toBe(400);
      expect(map.data.zoom).toBe(15);
    });
  });

  describe("createDividerSection", () => {
    it("produces a divider with default thickness", () => {
      const divider = createDividerSection();
      expect(divider.type).toBe("divider");
      expect(divider.data.thickness).toBe(2);
      expect(divider.data.color).toBe("foreground");
      expect(divider.data.width).toBe("full");
    });
  });

  describe("createBookingSection", () => {
    it("produces a booking section with heading", () => {
      const booking = createBookingSection();
      expect(booking.type).toBe("booking");
      expect(booking.data.heading).toBeTruthy();
      expect(booking.data.headingNe).toBeTruthy();
    });
  });

  describe("createOPDScheduleSection", () => {
    it("produces an OPD section with heading", () => {
      const opd = createOPDScheduleSection();
      expect(opd.type).toBe("opd_schedule");
      expect(opd.data.heading).toBeTruthy();
    });
  });

  describe("createTestimonialsSection", () => {
    it("defaults to max 6 reviews", () => {
      const testimonials = createTestimonialsSection();
      expect(testimonials.data.maxCount).toBe(6);
      expect(testimonials.data.source).toBe("auto");
    });
  });
});
