import type { PageBuilderConfig, BuilderPage, FooterConfig, PageSection } from "@/types/page-builder";
import {
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
} from "./section-defaults";

export interface Template {
  id: string;
  name: string;
  nameNe: string;
  description: string;
  descriptionNe: string;
  preview: string;
  createConfig: () => PageBuilderConfig;
}

function generatePageId(): string {
  return `page-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
}

function defaultNavbar(): PageBuilderConfig["navbar"] {
  return {
    logo: true,
    clinicName: true,
    links: [],
    style: { bgColor: "white", textColor: "foreground" },
  };
}

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

function makeHomePage(sections: PageSection[]): BuilderPage {
  return {
    id: generatePageId(),
    slug: "home",
    title: "Home",
    titleNe: "गृहपृष्ठ",
    sections,
    isHomePage: true,
    visible: true,
  };
}

export const TEMPLATES: Template[] = [
  {
    id: "classic",
    name: "Classic Clinic",
    nameNe: "क्लासिक क्लिनिक",
    description: "Hero, About, Services, Doctors, Booking, Contact",
    descriptionNe: "हिरो, बारेमा, सेवा, डाक्टर, बुकिंग, सम्पर्क",
    preview: "classic",
    createConfig: () => {
      const about = createTextSection({ heading: "About Us", headingNe: "हाम्रो बारेमा" });
      about.anchorId = "about";
      const homePage = makeHomePage([
        createHeroSection(),
        about,
        createServicesGridSection(),
        createDoctorShowcaseSection(),
        createBookingSection(),
        createContactInfoSection(),
      ]);
      return {
        version: 2,
        enabled: false,
        stylePreset: "bauhaus",
        navbar: {
          ...defaultNavbar(),
          links: [
            { id: "nav-1", label: "About", labelNe: "बारेमा", href: "#about", openInNewTab: false },
            { id: "nav-2", label: "Services", labelNe: "सेवा", href: "#services", openInNewTab: false },
            { id: "nav-3", label: "Doctors", labelNe: "डाक्टर", href: "#doctors", openInNewTab: false },
            { id: "nav-4", label: "Book", labelNe: "बुक", href: "#booking", openInNewTab: false },
            { id: "nav-5", label: "Contact", labelNe: "सम्पर्क", href: "#contact", openInNewTab: false },
          ],
        },
        footer: defaultFooter(),
        pages: [homePage],
        templateId: "classic",
        updatedAt: new Date().toISOString(),
      };
    },
  },
  {
    id: "minimal",
    name: "Minimal",
    nameNe: "न्यूनतम",
    description: "Hero, Contact, Booking — simple and clean",
    descriptionNe: "हिरो, सम्पर्क, बुकिंग — सरल र सफा",
    preview: "minimal",
    createConfig: () => {
      const homePage = makeHomePage([
        createHeroSection(),
        createContactInfoSection(),
        createBookingSection(),
      ]);
      return {
        version: 2,
        enabled: false,
        stylePreset: "minimal",
        navbar: {
          ...defaultNavbar(),
          links: [
            { id: "nav-1", label: "Contact", labelNe: "सम्पर्क", href: "#contact", openInNewTab: false },
            { id: "nav-2", label: "Book", labelNe: "बुक", href: "#booking", openInNewTab: false },
          ],
        },
        footer: defaultFooter(),
        pages: [homePage],
        templateId: "minimal",
        updatedAt: new Date().toISOString(),
      };
    },
  },
  {
    id: "full",
    name: "Complete Showcase",
    nameNe: "पूर्ण प्रदर्शनी",
    description: "Multi-page — Home, About, Gallery, FAQ",
    descriptionNe: "बहु-पृष्ठ — गृह, बारेमा, ग्यालेरी, FAQ",
    preview: "full",
    createConfig: () => {
      const homePageId = generatePageId();
      const aboutPageId = generatePageId();
      const galleryPageId = generatePageId();

      const about = createTextSection({ heading: "About Us", headingNe: "हाम्रो बारेमा" });
      about.anchorId = "about";

      return {
        version: 2,
        enabled: false,
        stylePreset: "modern",
        navbar: {
          ...defaultNavbar(),
          links: [
            { id: "nav-1", label: "Home", labelNe: "गृह", href: "#", openInNewTab: false },
            { id: "nav-2", label: "About", labelNe: "बारेमा", href: "about", openInNewTab: false },
            { id: "nav-3", label: "Gallery", labelNe: "ग्यालेरी", href: "gallery", openInNewTab: false },
            { id: "nav-4", label: "Services", labelNe: "सेवा", href: "#services", openInNewTab: false },
            { id: "nav-5", label: "Book", labelNe: "बुक", href: "#booking", openInNewTab: false },
            { id: "nav-6", label: "Contact", labelNe: "सम्पर्क", href: "#contact", openInNewTab: false },
          ],
        },
        footer: defaultFooter(),
        pages: [
          {
            id: homePageId,
            slug: "home",
            title: "Home",
            titleNe: "गृहपृष्ठ",
            sections: [
              createHeroSection(),
              createServicesGridSection(),
              createDoctorShowcaseSection(),
              createBookingSection(),
              createOPDScheduleSection(),
              createTestimonialsSection(),
              createMapEmbedSection(),
              createContactInfoSection(),
            ],
            isHomePage: true,
            visible: true,
          },
          {
            id: aboutPageId,
            slug: "about",
            title: "About",
            titleNe: "बारेमा",
            sections: [about, createFAQSection()],
            isHomePage: false,
            visible: true,
          },
          {
            id: galleryPageId,
            slug: "gallery",
            title: "Gallery",
            titleNe: "ग्यालेरी",
            sections: [createPhotoGallerySection()],
            isHomePage: false,
            visible: true,
          },
        ],
        templateId: "full",
        updatedAt: new Date().toISOString(),
      };
    },
  },
];
