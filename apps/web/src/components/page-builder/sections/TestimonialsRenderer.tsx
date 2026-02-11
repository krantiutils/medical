import type { TestimonialsSection } from "@/types/page-builder";
import { DESIGN_TOKEN_BG, DESIGN_TOKEN_TEXT, PADDING_SIZE, LAYOUT_WIDTH } from "@/types/page-builder";
import type { StylePresetClasses } from "../lib/style-presets";

interface TestimonialsRendererProps {
  section: TestimonialsSection;
  lang: string;
  clinicId?: string;
  clinicSlug?: string;
  preset?: StylePresetClasses;
}

export function TestimonialsRenderer({ section, lang, preset }: TestimonialsRendererProps) {
  const isNe = lang === "ne";
  const { data, style } = section;
  const heading = isNe ? data.headingNe || data.heading : data.heading;
  const variant = data.variant || "cards";

  const headingWeight = preset?.headingWeight || "font-bold";
  const divider = preset?.sectionDivider || "border-t-2 border-current/20";

  const headingEl = heading ? (
    <>
      <h2 className={`text-3xl ${headingWeight} mb-4`}>{heading}</h2>
      <div className={`${divider} mb-6`} />
    </>
  ) : null;

  // In the public page, the ReviewsSection component handles its own data fetching.
  // In the builder preview, we show a placeholder.

  if (variant === "carousel") {
    return (
      <div className={`${DESIGN_TOKEN_BG[style.bgColor]} ${DESIGN_TOKEN_TEXT[style.textColor]} ${PADDING_SIZE[style.padding]}`}>
        <div className={LAYOUT_WIDTH[style.layout]}>
          {headingEl}
          <div className="text-center py-8 opacity-60">
            <p className="text-lg">{isNe ? "समीक्षा क्यारोसेल यहाँ देखिनेछ" : "Reviews carousel will appear here"}</p>
            <p className="text-sm mt-1">{isNe ? `अधिकतम ${data.maxCount} समीक्षाहरू` : `Up to ${data.maxCount} reviews, sliding`}</p>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "simple") {
    return (
      <div className={`${DESIGN_TOKEN_BG[style.bgColor]} ${DESIGN_TOKEN_TEXT[style.textColor]} ${PADDING_SIZE[style.padding]}`}>
        <div className={LAYOUT_WIDTH[style.layout]}>
          {headingEl}
          <div className="text-center py-8 opacity-60">
            <p className="text-lg">{isNe ? "सरल समीक्षाहरू यहाँ देखिनेछन्" : "Simple blockquote reviews will appear here"}</p>
            <p className="text-sm mt-1">{isNe ? `अधिकतम ${data.maxCount} समीक्षाहरू` : `Up to ${data.maxCount} reviews shown`}</p>
          </div>
        </div>
      </div>
    );
  }

  // Default: cards
  return (
    <div className={`${DESIGN_TOKEN_BG[style.bgColor]} ${DESIGN_TOKEN_TEXT[style.textColor]} ${PADDING_SIZE[style.padding]}`}>
      <div className={LAYOUT_WIDTH[style.layout]}>
        {headingEl}
        <div className="text-center py-8 opacity-60">
          <p className="text-lg">{isNe ? "बिरामी समीक्षाहरू यहाँ देखिनेछन्" : "Patient reviews will appear here"}</p>
          <p className="text-sm mt-1">{isNe ? `अधिकतम ${data.maxCount} समीक्षाहरू` : `Up to ${data.maxCount} reviews shown`}</p>
        </div>
      </div>
    </div>
  );
}
