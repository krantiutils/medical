import type { MapEmbedSection } from "@/types/page-builder";
import { DESIGN_TOKEN_BG, DESIGN_TOKEN_TEXT, PADDING_SIZE, LAYOUT_WIDTH } from "@/types/page-builder";
import type { StylePresetClasses } from "../lib/style-presets";

interface MapEmbedRendererProps {
  section: MapEmbedSection;
  lang: string;
  clinicLat?: number | null;
  clinicLng?: number | null;
  clinicAddress?: string | null;
  clinicPhone?: string | null;
  preset?: StylePresetClasses;
}

export function MapEmbedRenderer({ section, lang, clinicLat, clinicLng, clinicAddress, clinicPhone, preset }: MapEmbedRendererProps) {
  const isNe = lang === "ne";
  const { data, style } = section;
  const heading = isNe ? data.headingNe || data.heading : data.heading;
  const variant = data.variant || "standard";

  const lat = data.source === "auto" ? clinicLat : data.manualLat;
  const lng = data.source === "auto" ? clinicLng : data.manualLng;

  const hasCoords = lat != null && lng != null;

  // Use OpenStreetMap embed (no API key required)
  const mapSrc = hasCoords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lng}`
    : null;

  const cardBorder = preset?.border || "border-4 border-foreground";
  const cardShadow = preset?.shadow || "shadow-[4px_4px_0_0_#121212]";
  const headingWeight = preset?.headingWeight || "font-bold";
  const divider = preset?.sectionDivider || "border-t-2 border-current/20";
  const radius = preset?.radius || "";

  const headingEl = heading ? (
    <>
      <h2 className={`text-3xl ${headingWeight} mb-4`}>{heading}</h2>
      <div className={`${divider} mb-6`} />
    </>
  ) : null;

  const noMapEl = (
    <div className={`text-center py-8 border-4 border-dashed border-foreground/20 bg-foreground/5 ${radius}`}>
      <p className="text-lg opacity-60">{isNe ? "नक्सा उपलब्ध छैन" : "Map not available"}</p>
      <p className="text-sm opacity-40 mt-1">{isNe ? "स्थान निर्देशांक सेट गरिएको छैन" : "Location coordinates not set"}</p>
    </div>
  );

  if (variant === "full_width") {
    return (
      <div className={`${DESIGN_TOKEN_BG[style.bgColor]} ${DESIGN_TOKEN_TEXT[style.textColor]}`}>
        {heading && (
          <div className={`${PADDING_SIZE[style.padding]} pb-0`}>
            <div className={LAYOUT_WIDTH[style.layout]}>
              {headingEl}
            </div>
          </div>
        )}
        {mapSrc ? (
          <iframe
            src={mapSrc}
            width="100%"
            height={data.height}
            style={{ border: 0 }}
            loading="lazy"
            title={isNe ? "नक्सा" : "Map"}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="px-4 py-4">{noMapEl}</div>
        )}
      </div>
    );
  }

  if (variant === "with_info") {
    return (
      <div className={`${DESIGN_TOKEN_BG[style.bgColor]} ${DESIGN_TOKEN_TEXT[style.textColor]} ${PADDING_SIZE[style.padding]}`}>
        <div className={LAYOUT_WIDTH[style.layout]}>
          {headingEl}
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-[3]">
              {mapSrc ? (
                <div className={`${cardBorder} ${cardShadow} ${radius} overflow-hidden`}>
                  <iframe
                    src={mapSrc}
                    width="100%"
                    height={data.height}
                    style={{ border: 0 }}
                    loading="lazy"
                    title={isNe ? "नक्सा" : "Map"}
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : noMapEl}
            </div>
            <div className="flex-[2] space-y-4">
              {clinicAddress && (
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 bg-primary-yellow ${radius || "rounded-full"} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <svg className="w-4 h-4 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <span>{clinicAddress}</span>
                </div>
              )}
              {clinicPhone && (
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 bg-primary-red ${radius || "rounded-full"} flex items-center justify-center flex-shrink-0`}>
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <a href={`tel:${clinicPhone}`} className="hover:text-primary-blue transition-colors">{clinicPhone}</a>
                </div>
              )}
              {!clinicAddress && !clinicPhone && (
                <p className="text-sm opacity-60">{isNe ? "सम्पर्क जानकारी उपलब्ध छैन" : "No contact info available"}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default: standard
  return (
    <div className={`${DESIGN_TOKEN_BG[style.bgColor]} ${DESIGN_TOKEN_TEXT[style.textColor]} ${PADDING_SIZE[style.padding]}`}>
      <div className={LAYOUT_WIDTH[style.layout]}>
        {headingEl}
        {mapSrc ? (
          <div className={`${cardBorder} ${cardShadow} ${radius} overflow-hidden`}>
            <iframe
              src={mapSrc}
              width="100%"
              height={data.height}
              style={{ border: 0 }}
              loading="lazy"
              title={isNe ? "नक्सा" : "Map"}
              referrerPolicy="no-referrer"
            />
          </div>
        ) : noMapEl}
      </div>
    </div>
  );
}
