"use client";

import type { ReactNode } from "react";
import type { PageBuilderConfig, PageSection, BuilderPage } from "@/types/page-builder";
import { DESIGN_TOKEN_BG, DESIGN_TOKEN_TEXT, PADDING_SIZE, LAYOUT_WIDTH } from "@/types/page-builder";
import { STYLE_PRESETS } from "./lib/style-presets";
import type { ClinicData } from "./sections/PublicSectionRenderer";
import { HeroRenderer } from "./sections/HeroRenderer";
import { TextRenderer } from "./sections/TextRenderer";
import { ServicesGridRenderer } from "./sections/ServicesGridRenderer";
import { DoctorShowcaseRenderer } from "./sections/DoctorShowcaseRenderer";
import { PhotoGalleryRenderer } from "./sections/PhotoGalleryRenderer";
import { ContactInfoRenderer } from "./sections/ContactInfoRenderer";
import { FAQRenderer } from "./sections/FAQRenderer";
import { MapEmbedRenderer } from "./sections/MapEmbedRenderer";
import { DividerRenderer } from "./sections/DividerRenderer";

import type { StylePresetClasses } from "./lib/style-presets";

interface CustomClinicPageProps {
  config: PageBuilderConfig;
  page: BuilderPage;
  clinic: ClinicData;
  lang: string;
  bookingSection: ReactNode;
  opdSection: ReactNode;
  reviewsSection: ReactNode;
  /** When on a clinic subdomain, set to the subdomain slug to rewrite internal links */
  subdomain?: string | null;
}

/**
 * On a subdomain, resolve internal clinic links to clean paths.
 * e.g. /en/clinic/cityhealth/about → /about
 *      /ne/clinic/cityhealth       → /ne
 */
function resolveClinicLink(href: string, clinicSlug: string, subdomain: string | null | undefined): string {
  if (!subdomain) return href;

  // Match paths like /{lang}/clinic/{slug} or /{lang}/clinic/{slug}/{pageSlug}
  const regex = new RegExp(`^/(?:en|ne)/clinic/${clinicSlug}(/.*)?$`);
  const match = href.match(regex);
  if (!match) return href;

  const remainder = match[1] || ""; // e.g. "" or "/about"
  return remainder || "/";
}

function renderSection(
  section: PageSection,
  lang: string,
  clinic: ClinicData,
  preset: StylePresetClasses,
  bookingSection: ReactNode,
  opdSection: ReactNode,
  reviewsSection: ReactNode,
) {
  if (!section.visible) return null;

  switch (section.type) {
    case "hero":
      return <HeroRenderer section={section} lang={lang} clinicLogo={clinic.logo_url} clinicName={clinic.name} preset={preset} />;
    case "text":
      return <TextRenderer section={section} lang={lang} preset={preset} />;
    case "services_grid":
      return <ServicesGridRenderer section={section} lang={lang} clinicServices={clinic.services} preset={preset} />;
    case "doctor_showcase":
      return <DoctorShowcaseRenderer section={section} lang={lang} doctors={clinic.doctors} preset={preset} />;
    case "photo_gallery":
      return <PhotoGalleryRenderer section={section} lang={lang} clinicPhotos={clinic.photos} preset={preset} />;
    case "contact_info":
      return (
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
      );
    case "testimonials": {
      const isNe = lang === "ne";
      const heading = isNe ? section.data.headingNe || section.data.heading : section.data.heading;
      return (
        <div className={`${DESIGN_TOKEN_BG[section.style.bgColor]} ${DESIGN_TOKEN_TEXT[section.style.textColor]} ${PADDING_SIZE[section.style.padding]}`}>
          <div className={LAYOUT_WIDTH[section.style.layout]}>
            {heading && (
              <>
                <h2 className={`text-3xl ${preset.headingWeight} mb-4`}>{heading}</h2>
                <div className={`${preset.sectionDivider} mb-6`} />
              </>
            )}
            {reviewsSection}
          </div>
        </div>
      );
    }
    case "faq":
      return <FAQRenderer section={section} lang={lang} preset={preset} />;
    case "booking": {
      const isNe = lang === "ne";
      const heading = isNe ? section.data.headingNe || section.data.heading : section.data.heading;
      return (
        <div className={`${DESIGN_TOKEN_BG[section.style.bgColor]} ${DESIGN_TOKEN_TEXT[section.style.textColor]} ${PADDING_SIZE[section.style.padding]}`}>
          <div className={LAYOUT_WIDTH[section.style.layout]}>
            {heading && (
              <>
                <h2 className={`text-3xl ${preset.headingWeight} mb-4`}>{heading}</h2>
                <div className={`${preset.sectionDivider} mb-6`} />
              </>
            )}
            {bookingSection}
          </div>
        </div>
      );
    }
    case "opd_schedule": {
      const isNe = lang === "ne";
      const heading = isNe ? section.data.headingNe || section.data.heading : section.data.heading;
      return (
        <div className={`${DESIGN_TOKEN_BG[section.style.bgColor]} ${DESIGN_TOKEN_TEXT[section.style.textColor]} ${PADDING_SIZE[section.style.padding]}`}>
          <div className={LAYOUT_WIDTH[section.style.layout]}>
            {heading && (
              <>
                <h2 className={`text-3xl ${preset.headingWeight} mb-4`}>{heading}</h2>
                <div className={`${preset.sectionDivider} mb-6`} />
              </>
            )}
            {opdSection}
          </div>
        </div>
      );
    }
    case "map_embed":
      return <MapEmbedRenderer section={section} lang={lang} clinicLat={clinic.location_lat} clinicLng={clinic.location_lng} preset={preset} />;
    case "divider":
      return <DividerRenderer section={section} />;
    default:
      return null;
  }
}

export function CustomClinicPage({ config, page, clinic, lang, bookingSection, opdSection, reviewsSection, subdomain }: CustomClinicPageProps) {
  const isNe = lang === "ne";
  const { navbar, footer } = config;
  const preset = STYLE_PRESETS[config.stylePreset] || STYLE_PRESETS.bauhaus;

  return (
    <>
      {/* Custom Navbar */}
      {(navbar.logo || navbar.clinicName || navbar.links.length > 0) && (
        <nav className={`${DESIGN_TOKEN_BG[navbar.style.bgColor]} ${DESIGN_TOKEN_TEXT[navbar.style.textColor]} ${preset.navBorder}`}>
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4 flex-wrap">
            {navbar.logo && clinic.logo_url && (
              <img src={clinic.logo_url} alt={clinic.name} className={`w-10 h-10 object-cover ${preset.border ? "border-2 border-current" : ""} ${preset.radius}`} />
            )}
            {navbar.clinicName && (
              <span className={`${preset.headingWeight} text-lg`}>{clinic.name}</span>
            )}
            <div className="flex-1" />
            <div className="flex items-center gap-3 flex-wrap">
              {navbar.links.map((link) => (
                <a
                  key={link.id}
                  href={resolveClinicLink(link.href, clinic.slug, subdomain)}
                  target={link.openInNewTab ? "_blank" : undefined}
                  rel={link.openInNewTab ? "noopener noreferrer" : undefined}
                  className={`text-sm ${preset.headingWeight} uppercase tracking-wider hover:opacity-70 transition-opacity`}
                >
                  {isNe ? link.labelNe || link.label : link.label}
                </a>
              ))}
            </div>
          </div>
        </nav>
      )}

      {/* Sections for the current page */}
      {page.sections.map((section) => (
        <div key={section.id} id={section.anchorId}>
          {renderSection(section, lang, clinic, preset, bookingSection, opdSection, reviewsSection)}
        </div>
      ))}

      {/* Footer */}
      {footer.enabled && (
        <footer className={`${DESIGN_TOKEN_BG[footer.style.bgColor]} ${DESIGN_TOKEN_TEXT[footer.style.textColor]} ${preset.navBorder}`}>
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {footer.showClinicName && (
                  <span className={`${preset.headingWeight}`}>{clinic.name}</span>
                )}
                {footer.showPhone && clinic.phone && (
                  <a href={`tel:${clinic.phone}`} className="text-sm opacity-80 hover:opacity-100 transition-opacity">
                    {clinic.phone}
                  </a>
                )}
                {footer.showEmail && clinic.email && (
                  <a href={`mailto:${clinic.email}`} className="text-sm opacity-80 hover:opacity-100 transition-opacity">
                    {clinic.email}
                  </a>
                )}
                {footer.showAddress && clinic.address && (
                  <span className="text-sm opacity-80">{clinic.address}</span>
                )}
              </div>
              {(footer.copyright || footer.copyrightNe) && (
                <p className="text-sm opacity-60">
                  {isNe ? footer.copyrightNe || footer.copyright : footer.copyright}
                </p>
              )}
            </div>
          </div>
        </footer>
      )}
    </>
  );
}
