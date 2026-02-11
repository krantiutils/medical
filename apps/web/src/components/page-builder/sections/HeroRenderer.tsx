import type { HeroSection } from "@/types/page-builder";
import { DESIGN_TOKEN_BG, DESIGN_TOKEN_TEXT, PADDING_SIZE } from "@/types/page-builder";
import type { StylePresetClasses } from "../lib/style-presets";

interface HeroRendererProps {
  section: HeroSection;
  lang: string;
  clinicLogo?: string | null;
  clinicName?: string;
  preset?: StylePresetClasses;
}

export function HeroRenderer({ section, lang, clinicLogo, clinicName, preset }: HeroRendererProps) {
  const isNe = lang === "ne";
  const { data, style } = section;
  const heading = isNe ? data.headingNe || data.heading : data.heading;
  const subtitle = isNe ? data.subtitleNe || data.subtitle : data.subtitle;
  const variant = data.variant || "centered";

  const cardBorder = preset?.border || "border-4 border-current";
  const logoRadius = preset?.radius || "";

  const bgStyle = style.bgImage
    ? { backgroundImage: `url(${style.bgImage})`, backgroundSize: "cover", backgroundPosition: "center" }
    : undefined;

  const logoEl = data.showLogo && clinicLogo ? (
    <img
      src={clinicLogo}
      alt={clinicName || ""}
      className={`w-24 h-24 object-cover ${cardBorder} mx-auto mb-4 ${logoRadius}`}
    />
  ) : data.showLogo && !clinicLogo && clinicName ? (
    <div className={`w-24 h-24 ${cardBorder} mx-auto mb-4 flex items-center justify-center ${logoRadius}`}>
      <span className="text-3xl font-bold">{clinicName.charAt(0)}</span>
    </div>
  ) : null;

  if (variant === "split") {
    return (
      <div
        className={`relative ${DESIGN_TOKEN_BG[style.bgColor]} ${DESIGN_TOKEN_TEXT[style.textColor]} ${PADDING_SIZE[style.padding]}`}
        style={bgStyle}
      >
        {style.bgImage && <div className="absolute inset-0 bg-foreground/50" />}
        <div className="relative max-w-4xl mx-auto px-4 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-[3] text-left">
            {logoEl && <div className="[&>*]:mx-0">{logoEl}</div>}
            <h1 className={`text-4xl sm:text-5xl ${preset?.headingWeight || "font-bold"} mb-4`}>{heading}</h1>
            {subtitle && <p className="text-lg sm:text-xl opacity-90">{subtitle}</p>}
          </div>
          {data.image && (
            <div className="flex-[2]">
              <img
                src={data.image}
                alt={heading}
                className={`w-full h-auto object-cover ${cardBorder} ${logoRadius}`}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (variant === "minimal") {
    return (
      <div
        className={`relative ${DESIGN_TOKEN_BG[style.bgColor]} ${DESIGN_TOKEN_TEXT[style.textColor]} ${PADDING_SIZE[style.padding]}`}
        style={bgStyle}
      >
        {style.bgImage && <div className="absolute inset-0 bg-foreground/50" />}
        <div className="relative max-w-2xl mx-auto px-4 text-center">
          <h1 className={`text-4xl sm:text-5xl ${preset?.headingWeight || "font-bold"} mb-4`}>{heading}</h1>
          {subtitle && <p className="text-lg sm:text-xl opacity-90">{subtitle}</p>}
        </div>
      </div>
    );
  }

  // Default: centered
  return (
    <div
      className={`relative ${DESIGN_TOKEN_BG[style.bgColor]} ${DESIGN_TOKEN_TEXT[style.textColor]} ${PADDING_SIZE[style.padding]}`}
      style={bgStyle}
    >
      {style.bgImage && <div className="absolute inset-0 bg-foreground/50" />}
      <div className="relative max-w-4xl mx-auto px-4 text-center">
        {logoEl}
        <h1 className={`text-4xl sm:text-5xl ${preset?.headingWeight || "font-bold"} mb-4`}>{heading}</h1>
        {subtitle && (
          <p className="text-lg sm:text-xl opacity-90 max-w-2xl mx-auto">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
