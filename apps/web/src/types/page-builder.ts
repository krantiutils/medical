// Page Builder type definitions
// All config stored at Clinic.meta.pageBuilder (Json field)

import type { StylePreset } from "@/components/page-builder/lib/style-presets";

export type SectionType =
  | "hero"
  | "text"
  | "services_grid"
  | "doctor_showcase"
  | "photo_gallery"
  | "contact_info"
  | "testimonials"
  | "faq"
  | "booking"
  | "opd_schedule"
  | "map_embed"
  | "divider"
  | "button"
  | "image";

export type DesignToken =
  | "white"
  | "background"
  | "primary-blue"
  | "primary-red"
  | "primary-yellow"
  | "foreground"
  | "muted";

export type PaddingSize = "none" | "sm" | "md" | "lg";
export type LayoutWidth = "full" | "contained" | "narrow";
export type DataSource = "auto" | "manual";

// --- Section Variant Types ---

export type HeroVariant = "centered" | "split" | "minimal";
export type TextVariant = "standard";
export type ServicesGridVariant = "cards" | "list" | "icons";
export type DoctorShowcaseVariant = "cards" | "list" | "compact";
export type PhotoGalleryVariant = "grid" | "carousel" | "masonry";
export type ContactInfoVariant = "list" | "card" | "two_column";
export type TestimonialsVariant = "cards" | "carousel" | "simple";
export type FAQVariant = "accordion" | "list" | "two_column";
export type BookingVariant = "standard" | "compact" | "prominent";
export type OPDScheduleVariant = "table" | "cards" | "timeline";
export type MapEmbedVariant = "standard" | "with_info" | "full_width";
export type DividerVariant = "line" | "dots" | "space";
export type ButtonVariant = "row" | "stack" | "spread";
export type ButtonStyle = "solid" | "outline" | "pill";
export type ImageVariant = "standard" | "rounded" | "shadow";
export type ButtonSize = "sm" | "md" | "lg";
export type Alignment = "left" | "center" | "right";
export type ButtonGap = "sm" | "md" | "lg";

export interface ButtonItem {
  id: string;
  label: string;
  labelNe: string;
  href: string;
  openInNewTab: boolean;
  color: DesignToken;
  style: ButtonStyle;
}

export interface VariantOption {
  value: string;
  label: string;
  labelNe: string;
  description: string;
}

export const SECTION_VARIANTS: Record<SectionType, VariantOption[]> = {
  hero: [
    { value: "centered", label: "Centered", labelNe: "केन्द्रित", description: "Centered text with image behind" },
    { value: "split", label: "Split", labelNe: "विभाजित", description: "Text left, image right" },
    { value: "minimal", label: "Minimal", labelNe: "न्यूनतम", description: "Text only, no image" },
  ],
  text: [
    { value: "standard", label: "Standard", labelNe: "मानक", description: "Single column text" },
  ],
  services_grid: [
    { value: "cards", label: "Cards", labelNe: "कार्डहरू", description: "Service cards in a grid" },
    { value: "list", label: "List", labelNe: "सूची", description: "Single column rows" },
    { value: "icons", label: "Icons", labelNe: "आइकन", description: "Icon-centered grid" },
  ],
  doctor_showcase: [
    { value: "cards", label: "Cards", labelNe: "कार्डहरू", description: "Doctor cards with details" },
    { value: "list", label: "List", labelNe: "सूची", description: "Full-width rows" },
    { value: "compact", label: "Compact", labelNe: "सम्पक्ट", description: "Small cards, photo + name only" },
  ],
  photo_gallery: [
    { value: "grid", label: "Grid", labelNe: "ग्रिड", description: "Standard photo grid" },
    { value: "carousel", label: "Carousel", labelNe: "क्यारोसेल", description: "Sliding carousel" },
    { value: "masonry", label: "Masonry", labelNe: "मेसन्री", description: "Staggered column layout" },
  ],
  contact_info: [
    { value: "list", label: "List", labelNe: "सूची", description: "Vertical list of info" },
    { value: "card", label: "Card", labelNe: "कार्ड", description: "All info in a card" },
    { value: "two_column", label: "Two Column", labelNe: "दुई स्तम्भ", description: "Contact left, hours right" },
  ],
  testimonials: [
    { value: "cards", label: "Cards", labelNe: "कार्डहरू", description: "Review cards" },
    { value: "carousel", label: "Carousel", labelNe: "क्यारोसेल", description: "Sliding reviews" },
    { value: "simple", label: "Simple", labelNe: "सरल", description: "Blockquote style" },
  ],
  faq: [
    { value: "accordion", label: "Accordion", labelNe: "एकोर्डियन", description: "Click to expand answers" },
    { value: "list", label: "List", labelNe: "सूची", description: "All answers visible" },
    { value: "two_column", label: "Two Column", labelNe: "दुई स्तम्भ", description: "Questions in two columns" },
  ],
  booking: [
    { value: "standard", label: "Standard", labelNe: "मानक", description: "Default booking widget" },
    { value: "compact", label: "Compact", labelNe: "सम्पक्ट", description: "Small inline CTA" },
    { value: "prominent", label: "Prominent", labelNe: "प्रमुख", description: "Full-width hero-like CTA" },
  ],
  opd_schedule: [
    { value: "table", label: "Table", labelNe: "तालिका", description: "Table layout" },
    { value: "cards", label: "Cards", labelNe: "कार्डहरू", description: "Day cards" },
    { value: "timeline", label: "Timeline", labelNe: "टाइमलाइन", description: "Visual timeline" },
  ],
  map_embed: [
    { value: "standard", label: "Standard", labelNe: "मानक", description: "Map in container" },
    { value: "with_info", label: "With Info", labelNe: "जानकारीसहित", description: "Map + address side by side" },
    { value: "full_width", label: "Full Width", labelNe: "पूर्ण चौडाइ", description: "Edge-to-edge map" },
  ],
  divider: [
    { value: "line", label: "Line", labelNe: "रेखा", description: "Horizontal line" },
    { value: "dots", label: "Dots", labelNe: "बिन्दु", description: "Three centered dots" },
    { value: "space", label: "Space", labelNe: "खाली", description: "Vertical spacing only" },
  ],
  button: [
    { value: "row", label: "Row", labelNe: "पङ्क्ति", description: "Buttons side by side" },
    { value: "stack", label: "Stack", labelNe: "स्ट्याक", description: "Buttons stacked vertically" },
    { value: "spread", label: "Spread", labelNe: "फैलाउ", description: "Buttons spread apart" },
  ],
  image: [
    { value: "standard", label: "Standard", labelNe: "मानक", description: "Standard image display" },
    { value: "rounded", label: "Rounded", labelNe: "गोलाकार", description: "Rounded corners" },
    { value: "shadow", label: "Shadow", labelNe: "छाया", description: "Drop shadow effect" },
  ],
};

// Re-export StylePreset for convenience
export type { StylePreset };

// --- Navbar ---

export interface NavLink {
  id: string;
  label: string;
  labelNe: string;
  href: string;
  openInNewTab: boolean;
}

export interface NavbarConfig {
  logo: boolean;
  clinicName: boolean;
  links: NavLink[];
  style: {
    bgColor: DesignToken;
    textColor: DesignToken;
  };
}

// --- Footer ---

export interface FooterConfig {
  enabled: boolean;
  showClinicName: boolean;
  showPhone: boolean;
  showEmail: boolean;
  showAddress: boolean;
  copyright: string;
  copyrightNe: string;
  style: {
    bgColor: DesignToken;
    textColor: DesignToken;
  };
}

// --- Section Base ---

export interface SectionStyle {
  bgColor: DesignToken;
  textColor: DesignToken;
  padding: PaddingSize;
  layout: LayoutWidth;
  bgImage: string | null;
}

export interface SectionBase {
  id: string;
  type: SectionType;
  visible: boolean;
  anchorId: string;
  style: SectionStyle;
}

// --- Section-Specific Data ---

export interface HeroSection extends SectionBase {
  type: "hero";
  data: {
    variant: HeroVariant;
    heading: string;
    headingNe: string;
    subtitle: string;
    subtitleNe: string;
    image: string | null;
    showLogo: boolean;
  };
}

export interface TextSection extends SectionBase {
  type: "text";
  data: {
    variant: TextVariant;
    heading: string;
    headingNe: string;
    body: string;
    bodyNe: string;
  };
}

export interface ServicesGridSection extends SectionBase {
  type: "services_grid";
  data: {
    variant: ServicesGridVariant;
    heading: string;
    headingNe: string;
    source: DataSource;
    columns: 2 | 3 | 4;
    manualServices: Array<{
      id: string;
      name: string;
      nameNe: string;
      description: string;
      descriptionNe: string;
      icon: string;
    }>;
  };
}

export interface DoctorShowcaseSection extends SectionBase {
  type: "doctor_showcase";
  data: {
    variant: DoctorShowcaseVariant;
    heading: string;
    headingNe: string;
    source: DataSource;
    columns: 2 | 3 | 4;
    showSpecialty: boolean;
    showDegree: boolean;
    showRole: boolean;
  };
}

export interface PhotoGallerySection extends SectionBase {
  type: "photo_gallery";
  data: {
    variant: PhotoGalleryVariant;
    heading: string;
    headingNe: string;
    source: DataSource;
    layout: "grid" | "carousel"; // legacy, mapped to variant
    columns: 2 | 3 | 4; // only used when variant === "grid"
    manualPhotos: Array<{
      id: string;
      url: string;
      caption: string;
      captionNe: string;
    }>;
  };
}

export interface ContactInfoSection extends SectionBase {
  type: "contact_info";
  data: {
    variant: ContactInfoVariant;
    heading: string;
    headingNe: string;
    source: DataSource;
    showPhone: boolean;
    showEmail: boolean;
    showAddress: boolean;
    showWebsite: boolean;
    showHours: boolean;
  };
}

export interface TestimonialsSection extends SectionBase {
  type: "testimonials";
  data: {
    variant: TestimonialsVariant;
    heading: string;
    headingNe: string;
    source: DataSource;
    maxCount: number;
  };
}

export interface FAQSection extends SectionBase {
  type: "faq";
  data: {
    variant: FAQVariant;
    heading: string;
    headingNe: string;
    items: Array<{
      id: string;
      question: string;
      questionNe: string;
      answer: string;
      answerNe: string;
    }>;
  };
}

export interface BookingSection extends SectionBase {
  type: "booking";
  data: {
    variant: BookingVariant;
    heading: string;
    headingNe: string;
  };
}

export interface OPDScheduleSection extends SectionBase {
  type: "opd_schedule";
  data: {
    variant: OPDScheduleVariant;
    heading: string;
    headingNe: string;
  };
}

export interface MapEmbedSection extends SectionBase {
  type: "map_embed";
  data: {
    variant: MapEmbedVariant;
    heading: string;
    headingNe: string;
    source: DataSource;
    manualLat: number | null;
    manualLng: number | null;
    zoom: number;
    height: number;
  };
}

export interface DividerSection extends SectionBase {
  type: "divider";
  data: {
    variant: DividerVariant;
    thickness: 1 | 2 | 4;
    color: DesignToken;
    width: "full" | "half" | "third";
  };
}

export interface ButtonSection extends SectionBase {
  type: "button";
  data: {
    variant: ButtonVariant;
    size: ButtonSize;
    alignment: Alignment;
    gap: ButtonGap;
    buttons: ButtonItem[];
  };
}

export interface ImageSection extends SectionBase {
  type: "image";
  data: {
    variant: ImageVariant;
    src: string | null;
    alt: string;
    altNe: string;
    caption: string;
    captionNe: string;
    href: string;
  };
}

// Union type of all sections
export type PageSection =
  | HeroSection
  | TextSection
  | ServicesGridSection
  | DoctorShowcaseSection
  | PhotoGallerySection
  | ContactInfoSection
  | TestimonialsSection
  | FAQSection
  | BookingSection
  | OPDScheduleSection
  | MapEmbedSection
  | DividerSection
  | ButtonSection
  | ImageSection;

// --- Builder Page (multi-page) ---

export interface BuilderPage {
  id: string;
  slug: string;        // "home", "about", "booking", "gallery", etc.
  title: string;
  titleNe: string;
  sections: PageSection[];
  isHomePage: boolean;
  visible: boolean;
}

// --- Page Builder Configs ---

// V1 config (legacy, flat sections array)
export interface PageBuilderConfigV1 {
  version: 1;
  enabled: boolean;
  navbar: NavbarConfig;
  sections: PageSection[];
  templateId: string | null;
  updatedAt: string;
}

// V2 config (multi-page, footer, style presets)
export interface PageBuilderConfig {
  version: 2;
  enabled: boolean;
  stylePreset: StylePreset;
  navbar: NavbarConfig;
  footer: FooterConfig;
  pages: BuilderPage[];
  templateId: string | null;
  updatedAt: string;
}

// Type alias for any version
export type AnyPageBuilderConfig = PageBuilderConfigV1 | PageBuilderConfig;

// --- Section metadata for the add panel ---

export interface SectionTypeInfo {
  type: SectionType;
  label: string;
  labelNe: string;
  description: string;
  icon: string;
}

export const SECTION_TYPE_INFO: SectionTypeInfo[] = [
  { type: "hero", label: "Hero", labelNe: "हिरो", description: "Large banner with heading and image", icon: "🏔" },
  { type: "text", label: "Text", labelNe: "पाठ", description: "Rich text content with markdown", icon: "📝" },
  { type: "services_grid", label: "Services", labelNe: "सेवा", description: "Grid of clinic services", icon: "🏥" },
  { type: "doctor_showcase", label: "Doctors", labelNe: "डाक्टर", description: "Show affiliated doctors", icon: "👨‍⚕" },
  { type: "photo_gallery", label: "Gallery", labelNe: "ग्यालेरी", description: "Photo gallery grid", icon: "📸" },
  { type: "contact_info", label: "Contact", labelNe: "सम्पर्क", description: "Contact details and hours", icon: "📞" },
  { type: "testimonials", label: "Reviews", labelNe: "समीक्षा", description: "Patient reviews and ratings", icon: "⭐" },
  { type: "faq", label: "FAQ", labelNe: "FAQ", description: "Frequently asked questions", icon: "❓" },
  { type: "booking", label: "Booking", labelNe: "बुकिंग", description: "Appointment booking widget", icon: "📅" },
  { type: "opd_schedule", label: "OPD", labelNe: "OPD", description: "OPD schedule display", icon: "🕐" },
  { type: "map_embed", label: "Map", labelNe: "नक्सा", description: "Embedded location map", icon: "📍" },
  { type: "divider", label: "Divider", labelNe: "विभाजक", description: "Visual separator line", icon: "➖" },
  { type: "button", label: "Button", labelNe: "बटन", description: "Standalone CTA button", icon: "🔘" },
  { type: "image", label: "Image", labelNe: "तस्बिर", description: "Standalone image display", icon: "🖼" },
];

// Preset page templates for the "Add Page" dropdown
export const PAGE_TEMPLATES: Array<{ slug: string; title: string; titleNe: string }> = [
  { slug: "about", title: "About", titleNe: "बारेमा" },
  { slug: "booking", title: "Booking", titleNe: "बुकिंग" },
  { slug: "gallery", title: "Gallery", titleNe: "ग्यालेरी" },
  { slug: "contact", title: "Contact", titleNe: "सम्पर्क" },
  { slug: "doctors", title: "Our Team", titleNe: "हाम्रो टोली" },
  { slug: "faq", title: "FAQ", titleNe: "FAQ" },
];

// Design token to Tailwind CSS class mapping
export const DESIGN_TOKEN_BG: Record<DesignToken, string> = {
  "white": "bg-white",
  "background": "bg-background",
  "primary-blue": "bg-primary-blue",
  "primary-red": "bg-primary-red",
  "primary-yellow": "bg-primary-yellow",
  "foreground": "bg-foreground",
  "muted": "bg-muted",
};

export const DESIGN_TOKEN_TEXT: Record<DesignToken, string> = {
  "white": "text-white",
  "background": "text-background",
  "primary-blue": "text-primary-blue",
  "primary-red": "text-primary-red",
  "primary-yellow": "text-primary-yellow",
  "foreground": "text-foreground",
  "muted": "text-muted",
};

export const PADDING_SIZE: Record<PaddingSize, string> = {
  "none": "py-0",
  "sm": "py-4",
  "md": "py-8",
  "lg": "py-16",
};

export const LAYOUT_WIDTH: Record<LayoutWidth, string> = {
  "full": "w-full",
  "contained": "max-w-4xl mx-auto px-4",
  "narrow": "max-w-2xl mx-auto px-4",
};
