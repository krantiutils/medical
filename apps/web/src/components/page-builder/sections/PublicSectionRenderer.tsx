"use client";

import type { PageSection } from "@/types/page-builder";
import type { StylePreset } from "@/components/page-builder/lib/style-presets";
import { STYLE_PRESETS } from "@/components/page-builder/lib/style-presets";
import { HeroRenderer } from "./HeroRenderer";
import { TextRenderer } from "./TextRenderer";
import { ServicesGridRenderer } from "./ServicesGridRenderer";
import { DoctorShowcaseRenderer } from "./DoctorShowcaseRenderer";
import { PhotoGalleryRenderer } from "./PhotoGalleryRenderer";
import { ContactInfoRenderer } from "./ContactInfoRenderer";
import { TestimonialsRenderer } from "./TestimonialsRenderer";
import { FAQRenderer } from "./FAQRenderer";
import { BookingRenderer } from "./BookingRenderer";
import { OPDScheduleRenderer } from "./OPDScheduleRenderer";
import { MapEmbedRenderer } from "./MapEmbedRenderer";
import { DividerRenderer } from "./DividerRenderer";
import { ButtonRenderer } from "./ButtonRenderer";
import { ImageRenderer } from "./ImageRenderer";

export interface ClinicData {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  website: string | null;
  services: string[];
  photos: string[];
  timings: Record<string, { isOpen: boolean; openTime: string; closeTime: string }> | null;
  location_lat: number | null;
  location_lng: number | null;
  doctors: Array<{
    id: string;
    full_name: string;
    type: string;
    photo_url: string | null;
    specialties: string[];
    degree: string | null;
    role: string | null;
  }>;
}

interface PublicSectionRendererProps {
  section: PageSection;
  lang: string;
  clinic: ClinicData;
  stylePreset?: StylePreset;
  isBuilder?: boolean;
}

export function PublicSectionRenderer({ section, lang, clinic, stylePreset, isBuilder }: PublicSectionRendererProps) {
  if (!section.visible) return null;

  const anchorProps = { id: section.anchorId };
  const preset = stylePreset ? STYLE_PRESETS[stylePreset] : undefined;

  switch (section.type) {
    case "hero":
      return (
        <div {...anchorProps}>
          <HeroRenderer section={section} lang={lang} clinicLogo={clinic.logo_url} clinicName={clinic.name} preset={preset} />
        </div>
      );
    case "text":
      return (
        <div {...anchorProps}>
          <TextRenderer section={section} lang={lang} preset={preset} />
        </div>
      );
    case "services_grid":
      return (
        <div {...anchorProps}>
          <ServicesGridRenderer section={section} lang={lang} clinicServices={clinic.services} preset={preset} />
        </div>
      );
    case "doctor_showcase":
      return (
        <div {...anchorProps}>
          <DoctorShowcaseRenderer section={section} lang={lang} doctors={clinic.doctors} preset={preset} />
        </div>
      );
    case "photo_gallery":
      return (
        <div {...anchorProps}>
          <PhotoGalleryRenderer section={section} lang={lang} clinicPhotos={clinic.photos} preset={preset} />
        </div>
      );
    case "contact_info":
      return (
        <div {...anchorProps}>
          <ContactInfoRenderer
            section={section}
            lang={lang}
            clinic={{
              phone: clinic.phone,
              email: clinic.email,
              address: clinic.address,
              website: clinic.website,
              timings: clinic.timings,
            }}
            preset={preset}
          />
        </div>
      );
    case "testimonials":
      return (
        <div {...anchorProps}>
          <TestimonialsRenderer section={section} lang={lang} clinicId={clinic.id} clinicSlug={clinic.slug} preset={preset} />
        </div>
      );
    case "faq":
      return (
        <div {...anchorProps}>
          <FAQRenderer section={section} lang={lang} preset={preset} />
        </div>
      );
    case "booking":
      return (
        <div {...anchorProps}>
          <BookingRenderer section={section} lang={lang} isBuilder={isBuilder} preset={preset} />
        </div>
      );
    case "opd_schedule":
      return (
        <div {...anchorProps}>
          <OPDScheduleRenderer section={section} lang={lang} isBuilder={isBuilder} preset={preset} />
        </div>
      );
    case "map_embed":
      return (
        <div {...anchorProps}>
          <MapEmbedRenderer section={section} lang={lang} clinicLat={clinic.location_lat} clinicLng={clinic.location_lng} clinicAddress={clinic.address} clinicPhone={clinic.phone} preset={preset} />
        </div>
      );
    case "divider":
      return (
        <div {...anchorProps}>
          <DividerRenderer section={section} />
        </div>
      );
    case "button":
      return (
        <div {...anchorProps}>
          <ButtonRenderer section={section} lang={lang} preset={preset} />
        </div>
      );
    case "image":
      return (
        <div {...anchorProps}>
          <ImageRenderer section={section} lang={lang} preset={preset} />
        </div>
      );
    default:
      return null;
  }
}
