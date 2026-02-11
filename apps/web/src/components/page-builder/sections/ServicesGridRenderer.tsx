import type { ServicesGridSection } from "@/types/page-builder";
import { DESIGN_TOKEN_BG, DESIGN_TOKEN_TEXT, PADDING_SIZE, LAYOUT_WIDTH } from "@/types/page-builder";
import type { StylePresetClasses } from "../lib/style-presets";

const PREDEFINED_SERVICES: Record<string, { en: string; ne: string }> = {
  general: { en: "General Consultation", ne: "सामान्य परामर्श" },
  specialist: { en: "Specialist Consultation", ne: "विशेषज्ञ परामर्श" },
  lab: { en: "Lab Tests", ne: "प्रयोगशाला परीक्षण" },
  xray: { en: "X-Ray", ne: "एक्स-रे" },
  pharmacy: { en: "Pharmacy", ne: "औषधि पसल" },
  emergency: { en: "Emergency", ne: "आकस्मिक" },
  surgery: { en: "Surgery", ne: "शल्यक्रिया" },
};

interface ServicesGridRendererProps {
  section: ServicesGridSection;
  lang: string;
  clinicServices?: string[];
  preset?: StylePresetClasses;
}

export function ServicesGridRenderer({ section, lang, clinicServices, preset }: ServicesGridRendererProps) {
  const isNe = lang === "ne";
  const { data, style } = section;
  const heading = isNe ? data.headingNe || data.heading : data.heading;
  const variant = data.variant || "cards";

  const services = data.source === "auto"
    ? (clinicServices || []).map((svc, i) => ({
        id: `auto-${i}`,
        name: PREDEFINED_SERVICES[svc]?.en || svc,
        nameNe: PREDEFINED_SERVICES[svc]?.ne || svc,
        description: "",
        descriptionNe: "",
        icon: "",
      }))
    : data.manualServices;

  const cardClass = preset?.cardClass || "border-4 border-foreground bg-white shadow-[4px_4px_0_0_#121212]";
  const headingWeight = preset?.headingWeight || "font-bold";
  const divider = preset?.sectionDivider || "border-t-2 border-current/20";

  const headingEl = heading ? (
    <>
      <h2 className={`text-3xl ${headingWeight} mb-4`}>{heading}</h2>
      <div className={`${divider} mb-6`} />
    </>
  ) : null;

  if (services.length === 0) {
    return (
      <div className={`${DESIGN_TOKEN_BG[style.bgColor]} ${DESIGN_TOKEN_TEXT[style.textColor]} ${PADDING_SIZE[style.padding]}`}>
        <div className={LAYOUT_WIDTH[style.layout]}>
          {headingEl}
          <p className="text-center opacity-60 py-8">{isNe ? "कुनै सेवा थपिएको छैन" : "No services added yet"}</p>
        </div>
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className={`${DESIGN_TOKEN_BG[style.bgColor]} ${DESIGN_TOKEN_TEXT[style.textColor]} ${PADDING_SIZE[style.padding]}`}>
        <div className={LAYOUT_WIDTH[style.layout]}>
          {headingEl}
          <div className="space-y-3">
            {services.map((svc) => (
              <div key={svc.id} className={`${cardClass} p-4 flex items-center gap-4`}>
                <h3 className="font-bold text-foreground flex-shrink-0">
                  {isNe ? svc.nameNe || svc.name : svc.name}
                </h3>
                {(isNe ? svc.descriptionNe || svc.description : svc.description) && (
                  <p className="text-sm text-foreground/70">
                    {isNe ? svc.descriptionNe || svc.description : svc.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (variant === "icons") {
    return (
      <div className={`${DESIGN_TOKEN_BG[style.bgColor]} ${DESIGN_TOKEN_TEXT[style.textColor]} ${PADDING_SIZE[style.padding]}`}>
        <div className={LAYOUT_WIDTH[style.layout]}>
          {headingEl}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {services.map((svc) => (
              <div key={svc.id} className="flex flex-col items-center text-center gap-2">
                <div className="w-14 h-14 rounded-full bg-primary-blue/10 border-2 border-primary-blue flex items-center justify-center">
                  <span className="text-xl">{svc.icon || "🏥"}</span>
                </div>
                <span className="font-bold text-sm text-foreground">
                  {isNe ? svc.nameNe || svc.name : svc.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Default: cards
  const colsClass = data.columns === 2 ? "grid-cols-1 sm:grid-cols-2" :
                     data.columns === 4 ? "grid-cols-2 sm:grid-cols-4" :
                     "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div className={`${DESIGN_TOKEN_BG[style.bgColor]} ${DESIGN_TOKEN_TEXT[style.textColor]} ${PADDING_SIZE[style.padding]}`}>
      <div className={LAYOUT_WIDTH[style.layout]}>
        {headingEl}
        <div className={`grid ${colsClass} gap-4`}>
          {services.map((svc) => (
            <div key={svc.id} className={`${cardClass} p-4`}>
              <h3 className="font-bold text-foreground mb-1">
                {isNe ? svc.nameNe || svc.name : svc.name}
              </h3>
              {(isNe ? svc.descriptionNe || svc.description : svc.description) && (
                <p className="text-sm text-foreground/70">
                  {isNe ? svc.descriptionNe || svc.description : svc.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
