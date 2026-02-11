import type { OPDScheduleSection as OPDSectionType } from "@/types/page-builder";
import { DESIGN_TOKEN_BG, DESIGN_TOKEN_TEXT, PADDING_SIZE, LAYOUT_WIDTH } from "@/types/page-builder";
import type { StylePresetClasses } from "../lib/style-presets";

interface OPDScheduleRendererProps {
  section: OPDSectionType;
  lang: string;
  isBuilder?: boolean;
  preset?: StylePresetClasses;
}

export function OPDScheduleRenderer({ section, lang, isBuilder, preset }: OPDScheduleRendererProps) {
  const isNe = lang === "ne";
  const { data, style } = section;
  const heading = isNe ? data.headingNe || data.heading : data.heading;
  const variant = data.variant || "table";

  const headingWeight = preset?.headingWeight || "font-bold";
  const divider = preset?.sectionDivider || "border-t-2 border-current/20";
  const radius = preset?.radius || "";
  const cardClass = preset?.cardClass || "border-4 border-foreground bg-white shadow-[4px_4px_0_0_#121212]";

  const headingEl = heading ? (
    <>
      <h2 className={`text-3xl ${headingWeight} mb-4`}>{heading}</h2>
      <div className={`${divider} mb-6`} />
    </>
  ) : null;

  const placeholderLabel = variant === "cards"
    ? (isNe ? "OPD कार्डहरू" : "OPD Day Cards")
    : variant === "timeline"
    ? (isNe ? "OPD टाइमलाइन" : "OPD Timeline")
    : (isNe ? "OPD तालिका" : "OPD Schedule");

  if (isBuilder) {
    if (variant === "cards") {
      return (
        <div className={`${DESIGN_TOKEN_BG[style.bgColor]} ${DESIGN_TOKEN_TEXT[style.textColor]} ${PADDING_SIZE[style.padding]}`}>
          <div className={LAYOUT_WIDTH[style.layout]}>
            {headingEl}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className={`${cardClass} p-3 text-center`}>
                  <span className={`text-sm ${headingWeight}`}>{day}</span>
                  <p className="text-xs opacity-40 mt-1">{isNe ? "OPD समय" : "OPD times"}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (variant === "timeline") {
      return (
        <div className={`${DESIGN_TOKEN_BG[style.bgColor]} ${DESIGN_TOKEN_TEXT[style.textColor]} ${PADDING_SIZE[style.padding]}`}>
          <div className={LAYOUT_WIDTH[style.layout]}>
            {headingEl}
            <div className="relative pl-8 space-y-4">
              <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-foreground/20" />
              {["Morning", "Afternoon", "Evening"].map((slot) => (
                <div key={slot} className="relative">
                  <div className="absolute -left-5 top-1 w-3 h-3 rounded-full bg-primary-blue border-2 border-white" />
                  <div className={`${cardClass} p-3`}>
                    <span className={`text-sm ${headingWeight}`}>{slot}</span>
                    <p className="text-xs opacity-40">{isNe ? "समय स्लट" : "Time slot details"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Default: table placeholder
    return (
      <div className={`${DESIGN_TOKEN_BG[style.bgColor]} ${DESIGN_TOKEN_TEXT[style.textColor]} ${PADDING_SIZE[style.padding]}`}>
        <div className={LAYOUT_WIDTH[style.layout]}>
          {headingEl}
          <div className={`text-center py-8 border-4 border-dashed border-foreground/20 bg-foreground/5 ${radius}`}>
            <p className={`text-lg ${headingWeight} opacity-60`}>{placeholderLabel}</p>
            <p className="text-sm opacity-40 mt-1">{isNe ? "सार्वजनिक पृष्ठमा देखिनेछ" : "Will appear on public page"}</p>
          </div>
        </div>
      </div>
    );
  }

  // Public page — all variants load dynamically
  return (
    <div className={`${DESIGN_TOKEN_BG[style.bgColor]} ${DESIGN_TOKEN_TEXT[style.textColor]} ${PADDING_SIZE[style.padding]}`}>
      <div className={LAYOUT_WIDTH[style.layout]}>
        {headingEl}
        <div className="text-center py-8 opacity-60">
          <p>{isNe ? "OPD तालिका लोड हुँदैछ..." : "OPD schedule loading..."}</p>
        </div>
      </div>
    </div>
  );
}
