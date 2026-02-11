import type { DoctorShowcaseSection } from "@/types/page-builder";
import { DESIGN_TOKEN_BG, DESIGN_TOKEN_TEXT, PADDING_SIZE, LAYOUT_WIDTH } from "@/types/page-builder";
import type { StylePresetClasses } from "../lib/style-presets";
import { getDisplayName } from "@/lib/professional-display";

interface DoctorInfo {
  id: string;
  full_name: string;
  type: string;
  photo_url: string | null;
  specialties: string[];
  degree: string | null;
  role: string | null;
}

interface DoctorShowcaseRendererProps {
  section: DoctorShowcaseSection;
  lang: string;
  doctors?: DoctorInfo[];
  preset?: StylePresetClasses;
}

export function DoctorShowcaseRenderer({ section, lang, doctors, preset }: DoctorShowcaseRendererProps) {
  const isNe = lang === "ne";
  const { data, style } = section;
  const heading = isNe ? data.headingNe || data.heading : data.heading;
  const variant = data.variant || "cards";
  const list = doctors || [];

  const cardClass = preset?.cardClass || "border-4 border-foreground bg-white shadow-[4px_4px_0_0_#121212]";
  const headingWeight = preset?.headingWeight || "font-bold";
  const divider = preset?.sectionDivider || "border-t-2 border-current/20";
  const imgBorder = preset?.border || "border-2 border-foreground";
  const imgRadius = preset?.radius || "";

  const headingEl = heading ? (
    <>
      <h2 className={`text-3xl ${headingWeight} mb-4`}>{heading}</h2>
      <div className={`${divider} mb-6`} />
    </>
  ) : null;

  if (list.length === 0) {
    return (
      <div className={`${DESIGN_TOKEN_BG[style.bgColor]} ${DESIGN_TOKEN_TEXT[style.textColor]} ${PADDING_SIZE[style.padding]}`}>
        <div className={LAYOUT_WIDTH[style.layout]}>
          {headingEl}
          <p className="text-center opacity-60 py-8">{isNe ? "कुनै डाक्टर सम्बद्ध छैन" : "No doctors affiliated yet"}</p>
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
            {list.map((doc) => {
              const displayName = getDisplayName(doc as { full_name: string; type: "DOCTOR" | "DENTIST" | "PHARMACIST" });
              return (
                <div key={doc.id} className={`${cardClass} p-3 flex items-center gap-4`}>
                  {doc.photo_url ? (
                    <img src={doc.photo_url} alt={displayName} className={`w-10 h-10 object-cover ${imgBorder} ${imgRadius} flex-shrink-0`} />
                  ) : (
                    <div className={`w-10 h-10 bg-muted ${imgBorder} ${imgRadius} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-lg font-bold text-foreground/40">{doc.full_name.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0 flex items-center gap-4">
                    <h3 className="font-bold text-foreground truncate">{displayName}</h3>
                    {data.showSpecialty && doc.specialties.length > 0 && (
                      <span className="text-sm text-foreground/70 truncate">{doc.specialties[0]}</span>
                    )}
                    {data.showDegree && doc.degree && (
                      <span className="text-sm text-foreground/60 truncate">{doc.degree}</span>
                    )}
                    {data.showRole && doc.role && (
                      <span className="text-xs px-2 py-0.5 bg-foreground/10 border border-foreground/20 text-foreground/70">{doc.role}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={`${DESIGN_TOKEN_BG[style.bgColor]} ${DESIGN_TOKEN_TEXT[style.textColor]} ${PADDING_SIZE[style.padding]}`}>
        <div className={LAYOUT_WIDTH[style.layout]}>
          {headingEl}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {list.map((doc) => {
              const displayName = getDisplayName(doc as { full_name: string; type: "DOCTOR" | "DENTIST" | "PHARMACIST" });
              return (
                <div key={doc.id} className={`${cardClass} p-3 text-center`}>
                  {doc.photo_url ? (
                    <img src={doc.photo_url} alt={displayName} className={`w-14 h-14 object-cover ${imgBorder} ${imgRadius} mx-auto mb-2`} />
                  ) : (
                    <div className={`w-14 h-14 bg-muted ${imgBorder} ${imgRadius} flex items-center justify-center mx-auto mb-2`}>
                      <span className="text-xl font-bold text-foreground/40">{doc.full_name.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  <h3 className="font-bold text-foreground text-sm truncate">{displayName}</h3>
                </div>
              );
            })}
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
          {list.map((doc) => {
            const displayName = getDisplayName(doc as { full_name: string; type: "DOCTOR" | "DENTIST" | "PHARMACIST" });
            const typeColor = doc.type === "DOCTOR" ? "bg-primary-blue" :
                              doc.type === "DENTIST" ? "bg-primary-red" :
                              "bg-primary-yellow text-foreground";

            return (
              <div key={doc.id} className={`${cardClass} p-4`}>
                <div className="flex gap-4">
                  {doc.photo_url ? (
                    <img src={doc.photo_url} alt={displayName} className={`w-16 h-16 object-cover ${imgBorder} ${imgRadius} flex-shrink-0`} />
                  ) : (
                    <div className={`w-16 h-16 bg-muted ${imgBorder} ${imgRadius} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-2xl font-bold text-foreground/40">{doc.full_name.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className={`inline-block px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-white border border-foreground mb-1 ${typeColor} ${imgRadius}`}>
                      {doc.type}
                    </span>
                    <h3 className="font-bold text-foreground truncate">{displayName}</h3>
                    {data.showSpecialty && doc.specialties.length > 0 && (
                      <p className="text-sm text-foreground/70 truncate">{doc.specialties[0]}</p>
                    )}
                    {data.showDegree && doc.degree && (
                      <p className="text-sm text-foreground/60 truncate">{doc.degree}</p>
                    )}
                    {data.showRole && doc.role && (
                      <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-foreground/10 border border-foreground/20 text-foreground/70 ${imgRadius}`}>
                        {doc.role}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
