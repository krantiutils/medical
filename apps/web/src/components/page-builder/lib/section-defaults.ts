import type {
  PageSection,
  SectionType,
  SectionStyle,
  HeroSection,
  TextSection,
  ServicesGridSection,
  DoctorShowcaseSection,
  PhotoGallerySection,
  ContactInfoSection,
  TestimonialsSection,
  FAQSection,
  BookingSection,
  OPDScheduleSection,
  MapEmbedSection,
  DividerSection,
  ButtonSection,
  ImageSection,
} from "@/types/page-builder";

let counter = 0;

function generateId(): string {
  counter++;
  return `section-${Date.now()}-${counter}-${Math.random().toString(36).substring(2, 6)}`;
}

function defaultStyle(overrides?: Partial<SectionStyle>): SectionStyle {
  return {
    bgColor: "white",
    textColor: "foreground",
    padding: "md",
    layout: "contained",
    bgImage: null,
    ...overrides,
  };
}

export function createHeroSection(overrides?: Partial<HeroSection["data"]>): HeroSection {
  const id = generateId();
  return {
    id,
    type: "hero",
    visible: true,
    anchorId: "hero",
    style: defaultStyle({ padding: "lg", layout: "full", bgColor: "primary-blue", textColor: "white" }),
    data: {
      variant: "centered",
      heading: "Welcome to Our Clinic",
      headingNe: "हाम्रो क्लिनिकमा स्वागत छ",
      subtitle: "Quality healthcare you can trust",
      subtitleNe: "विश्वसनीय गुणस्तरीय स्वास्थ्य सेवा",
      image: null,
      showLogo: true,
      ...overrides,
    },
  };
}

export function createTextSection(overrides?: Partial<TextSection["data"]>): TextSection {
  const id = generateId();
  return {
    id,
    type: "text",
    visible: true,
    anchorId: `text-${id.slice(-4)}`,
    style: defaultStyle(),
    data: {
      variant: "standard",
      heading: "About Us",
      headingNe: "हाम्रो बारेमा",
      body: "Tell your patients about your clinic, your mission, and what makes you different.",
      bodyNe: "आफ्नो क्लिनिक, आफ्नो मिशन, र तपाईंलाई फरक बनाउने कुराहरूको बारेमा बिरामीहरूलाई बताउनुहोस्।",
      ...overrides,
    },
  };
}

export function createServicesGridSection(overrides?: Partial<ServicesGridSection["data"]>): ServicesGridSection {
  const id = generateId();
  return {
    id,
    type: "services_grid",
    visible: true,
    anchorId: "services",
    style: defaultStyle({ bgColor: "background" }),
    data: {
      variant: "cards",
      heading: "Our Services",
      headingNe: "हाम्रा सेवाहरू",
      source: "auto",
      columns: 3,
      manualServices: [],
      ...overrides,
    },
  };
}

export function createDoctorShowcaseSection(overrides?: Partial<DoctorShowcaseSection["data"]>): DoctorShowcaseSection {
  const id = generateId();
  return {
    id,
    type: "doctor_showcase",
    visible: true,
    anchorId: "doctors",
    style: defaultStyle(),
    data: {
      variant: "cards",
      heading: "Our Medical Team",
      headingNe: "हाम्रो चिकित्सा टोली",
      source: "auto",
      columns: 3,
      showSpecialty: true,
      showDegree: true,
      showRole: true,
      ...overrides,
    },
  };
}

export function createPhotoGallerySection(overrides?: Partial<PhotoGallerySection["data"]>): PhotoGallerySection {
  const id = generateId();
  return {
    id,
    type: "photo_gallery",
    visible: true,
    anchorId: "gallery",
    style: defaultStyle({ bgColor: "background" }),
    data: {
      variant: "grid",
      heading: "Photo Gallery",
      headingNe: "फोटो ग्यालेरी",
      source: "auto",
      layout: "grid",
      columns: 3,
      manualPhotos: [],
      ...overrides,
    },
  };
}

export function createContactInfoSection(overrides?: Partial<ContactInfoSection["data"]>): ContactInfoSection {
  const id = generateId();
  return {
    id,
    type: "contact_info",
    visible: true,
    anchorId: "contact",
    style: defaultStyle(),
    data: {
      variant: "list",
      heading: "Contact Us",
      headingNe: "सम्पर्क गर्नुहोस्",
      source: "auto",
      showPhone: true,
      showEmail: true,
      showAddress: true,
      showWebsite: true,
      showHours: true,
      ...overrides,
    },
  };
}

export function createTestimonialsSection(overrides?: Partial<TestimonialsSection["data"]>): TestimonialsSection {
  const id = generateId();
  return {
    id,
    type: "testimonials",
    visible: true,
    anchorId: "reviews",
    style: defaultStyle({ bgColor: "background" }),
    data: {
      variant: "cards",
      heading: "Patient Reviews",
      headingNe: "बिरामी समीक्षाहरू",
      source: "auto",
      maxCount: 6,
      ...overrides,
    },
  };
}

export function createFAQSection(overrides?: Partial<FAQSection["data"]>): FAQSection {
  const id = generateId();
  return {
    id,
    type: "faq",
    visible: true,
    anchorId: "faq",
    style: defaultStyle(),
    data: {
      variant: "accordion",
      heading: "Frequently Asked Questions",
      headingNe: "बारम्बार सोधिने प्रश्नहरू",
      items: [
        {
          id: generateId(),
          question: "What are your opening hours?",
          questionNe: "तपाईंको खुल्ने समय के हो?",
          answer: "Please check our contact section for detailed operating hours.",
          answerNe: "कृपया विस्तृत खुल्ने समयको लागि हाम्रो सम्पर्क खण्ड हेर्नुहोस्।",
        },
      ],
      ...overrides,
    },
  };
}

export function createBookingSection(overrides?: Partial<BookingSection["data"]>): BookingSection {
  const id = generateId();
  return {
    id,
    type: "booking",
    visible: true,
    anchorId: "booking",
    style: defaultStyle(),
    data: {
      variant: "standard",
      heading: "Book an Appointment",
      headingNe: "अपोइन्टमेन्ट बुक गर्नुहोस्",
      ...overrides,
    },
  };
}

export function createOPDScheduleSection(overrides?: Partial<OPDScheduleSection["data"]>): OPDScheduleSection {
  const id = generateId();
  return {
    id,
    type: "opd_schedule",
    visible: true,
    anchorId: "opd-schedule",
    style: defaultStyle({ bgColor: "background" }),
    data: {
      variant: "table",
      heading: "OPD Schedule",
      headingNe: "OPD तालिका",
      ...overrides,
    },
  };
}

export function createMapEmbedSection(overrides?: Partial<MapEmbedSection["data"]>): MapEmbedSection {
  const id = generateId();
  return {
    id,
    type: "map_embed",
    visible: true,
    anchorId: "map",
    style: defaultStyle(),
    data: {
      variant: "standard",
      heading: "Find Us",
      headingNe: "हामीलाई खोज्नुहोस्",
      source: "auto",
      manualLat: null,
      manualLng: null,
      zoom: 15,
      height: 400,
      ...overrides,
    },
  };
}

export function createDividerSection(): DividerSection {
  const id = generateId();
  return {
    id,
    type: "divider",
    visible: true,
    anchorId: `divider-${id.slice(-4)}`,
    style: defaultStyle({ padding: "sm" }),
    data: {
      variant: "line",
      thickness: 2,
      color: "foreground",
      width: "full",
    },
  };
}

export function createButtonSection(overrides?: Partial<ButtonSection["data"]>): ButtonSection {
  const id = generateId();
  return {
    id,
    type: "button",
    visible: true,
    anchorId: `button-${id.slice(-4)}`,
    style: defaultStyle({ padding: "sm" }),
    data: {
      variant: "row",
      size: "md",
      alignment: "center",
      gap: "md",
      buttons: [
        {
          id: generateId(),
          label: "Click Here",
          labelNe: "यहाँ क्लिक गर्नुहोस्",
          href: "#",
          openInNewTab: false,
          color: "primary-blue",
          style: "solid",
        },
      ],
      ...overrides,
    },
  };
}

export function createImageSection(overrides?: Partial<ImageSection["data"]>): ImageSection {
  const id = generateId();
  return {
    id,
    type: "image",
    visible: true,
    anchorId: `image-${id.slice(-4)}`,
    style: defaultStyle(),
    data: {
      variant: "standard",
      src: null,
      alt: "",
      altNe: "",
      caption: "",
      captionNe: "",
      href: "",
      ...overrides,
    },
  };
}

// Factory function that dispatches by section type
export function createSection(type: SectionType): PageSection {
  switch (type) {
    case "hero": return createHeroSection();
    case "text": return createTextSection();
    case "services_grid": return createServicesGridSection();
    case "doctor_showcase": return createDoctorShowcaseSection();
    case "photo_gallery": return createPhotoGallerySection();
    case "contact_info": return createContactInfoSection();
    case "testimonials": return createTestimonialsSection();
    case "faq": return createFAQSection();
    case "booking": return createBookingSection();
    case "opd_schedule": return createOPDScheduleSection();
    case "map_embed": return createMapEmbedSection();
    case "divider": return createDividerSection();
    case "button": return createButtonSection();
    case "image": return createImageSection();
  }
}
