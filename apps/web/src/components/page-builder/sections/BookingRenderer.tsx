import type { BookingSection as BookingSectionType } from "@/types/page-builder";
import { DESIGN_TOKEN_BG, DESIGN_TOKEN_TEXT, PADDING_SIZE, LAYOUT_WIDTH } from "@/types/page-builder";
import type { StylePresetClasses } from "../lib/style-presets";

interface BookingRendererProps {
  section: BookingSectionType;
  lang: string;
  isBuilder?: boolean;
  preset?: StylePresetClasses;
}

export function BookingRenderer({ section, lang, isBuilder, preset }: BookingRendererProps) {
  const isNe = lang === "ne";
  const { data, style } = section;
  const heading = isNe ? data.headingNe || data.heading : data.heading;
  const variant = data.variant || "standard";

  const headingWeight = preset?.headingWeight || "font-bold";
  const divider = preset?.sectionDivider || "border-t-2 border-current/20";
  const radius = preset?.radius || "";
  const ctaClass = preset
    ? `${preset.ctaClass} ${preset.ctaHover}`
    : "border-4 border-foreground shadow-[4px_4px_0_0_#121212] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#121212]";

  if (variant === "compact") {
    return (
      <div className={`${DESIGN_TOKEN_BG[style.bgColor]} ${DESIGN_TOKEN_TEXT[style.textColor]} ${PADDING_SIZE[style.padding]}`}>
        <div className={LAYOUT_WIDTH[style.layout]}>
          <div className="flex items-center justify-between gap-4">
            {heading && <h2 className={`text-xl ${headingWeight}`}>{heading}</h2>}
            {isBuilder ? (
              <span className={`px-4 py-2 text-sm font-bold bg-foreground/10 ${radius}`}>
                {isNe ? "बुकिंग बटन" : "Booking Button"}
              </span>
            ) : (
              <span className="text-sm opacity-60">{isNe ? "बुकिंग विजेट" : "Booking widget"}</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === "prominent") {
    return (
      <div className={`${DESIGN_TOKEN_BG[style.bgColor]} ${DESIGN_TOKEN_TEXT[style.textColor]} py-16`}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          {heading && <h2 className={`text-4xl ${headingWeight} mb-4`}>{heading}</h2>}
          {isBuilder ? (
            <div className={`inline-block px-8 py-3 bg-white text-foreground font-bold ${ctaClass} transition-all ${radius}`}>
              {isNe ? "अपोइन्टमेन्ट बुक गर्नुहोस्" : "Book Now"}
            </div>
          ) : (
            <div className="py-4 opacity-60">
              <p>{isNe ? "बुकिंग सेक्सन लोड हुँदैछ..." : "Booking section loading..."}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default: standard
  return (
    <div className={`${DESIGN_TOKEN_BG[style.bgColor]} ${DESIGN_TOKEN_TEXT[style.textColor]} ${PADDING_SIZE[style.padding]}`}>
      <div className={LAYOUT_WIDTH[style.layout]}>
        {heading && (
          <>
            <h2 className={`text-3xl ${headingWeight} mb-4`}>{heading}</h2>
            <div className={`${divider} mb-6`} />
          </>
        )}
        {isBuilder ? (
          <div className={`text-center py-8 border-4 border-dashed border-foreground/20 bg-foreground/5 ${radius}`}>
            <p className="text-lg font-bold opacity-60">{isNe ? "बुकिंग विजेट" : "Booking Widget"}</p>
            <p className="text-sm opacity-40 mt-1">{isNe ? "सार्वजनिक पृष्ठमा देखिनेछ" : "Will appear on public page"}</p>
          </div>
        ) : (
          <div className="text-center py-8 opacity-60">
            <p>{isNe ? "बुकिंग सेक्सन लोड हुँदैछ..." : "Booking section loading..."}</p>
          </div>
        )}
      </div>
    </div>
  );
}
