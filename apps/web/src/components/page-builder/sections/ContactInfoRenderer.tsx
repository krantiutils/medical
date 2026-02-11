import type { ContactInfoSection } from "@/types/page-builder";
import { DESIGN_TOKEN_BG, DESIGN_TOKEN_TEXT, PADDING_SIZE, LAYOUT_WIDTH } from "@/types/page-builder";
import type { StylePresetClasses } from "../lib/style-presets";

interface ClinicContact {
  phone: string | null;
  email: string | null;
  address: string | null;
  website: string | null;
  timings: Record<string, { isOpen: boolean; openTime: string; closeTime: string }> | null;
}

interface ContactInfoRendererProps {
  section: ContactInfoSection;
  lang: string;
  clinic?: ClinicContact;
  preset?: StylePresetClasses;
}

const DAYS_OF_WEEK = [
  { key: "sunday", en: "Sunday", ne: "आइतबार" },
  { key: "monday", en: "Monday", ne: "सोमबार" },
  { key: "tuesday", en: "Tuesday", ne: "मंगलबार" },
  { key: "wednesday", en: "Wednesday", ne: "बुधबार" },
  { key: "thursday", en: "Thursday", ne: "बिहिबार" },
  { key: "friday", en: "Friday", ne: "शुक्रबार" },
  { key: "saturday", en: "Saturday", ne: "शनिबार" },
];

function ContactDetails({ data, contact, isNe, radius }: { data: ContactInfoSection["data"]; contact: ClinicContact; isNe: boolean; radius: string }) {
  return (
    <div className="space-y-4">
      {data.showPhone && contact.phone && (
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 bg-primary-red ${radius || "rounded-full"} flex items-center justify-center flex-shrink-0`}>
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <a href={`tel:${contact.phone}`} className="hover:text-primary-blue transition-colors">{contact.phone}</a>
        </div>
      )}
      {data.showEmail && contact.email && (
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 bg-primary-blue ${radius || "rounded-full"} flex items-center justify-center flex-shrink-0`}>
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <a href={`mailto:${contact.email}`} className="hover:text-primary-blue transition-colors">{contact.email}</a>
        </div>
      )}
      {data.showAddress && contact.address && (
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 bg-primary-yellow ${radius || "rounded-full"} flex items-center justify-center flex-shrink-0`}>
            <svg className="w-4 h-4 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span>{contact.address}</span>
        </div>
      )}
      {data.showWebsite && contact.website && (
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 bg-foreground ${radius || "rounded-full"} flex items-center justify-center flex-shrink-0`}>
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          </div>
          <a href={contact.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary-blue transition-colors underline">{contact.website}</a>
        </div>
      )}
    </div>
  );
}

function HoursTable({ contact, isNe }: { contact: ClinicContact; isNe: boolean }) {
  if (!contact.timings) return null;
  return (
    <div>
      <h3 className="text-lg font-bold mb-3">{isNe ? "खुल्ने समय" : "Operating Hours"}</h3>
      <div className="space-y-2">
        {DAYS_OF_WEEK.map((day) => {
          const schedule = contact.timings?.[day.key];
          const isOpen = schedule?.isOpen;
          return (
            <div
              key={day.key}
              className={`flex items-center justify-between py-2 px-3 border-2 ${isOpen ? "border-verified bg-verified/5" : "border-foreground/20 bg-foreground/5"}`}
            >
              <span className="font-bold text-foreground">{day[isNe ? "ne" : "en"]}</span>
              <span className={`text-sm font-medium ${isOpen ? "text-verified" : "text-foreground/60"}`}>
                {isOpen ? `${schedule.openTime} - ${schedule.closeTime}` : (isNe ? "बन्द" : "Closed")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ContactInfoRenderer({ section, lang, clinic, preset }: ContactInfoRendererProps) {
  const isNe = lang === "ne";
  const { data, style } = section;
  const heading = isNe ? data.headingNe || data.heading : data.heading;
  const variant = data.variant || "list";

  const contact = clinic || { phone: null, email: null, address: null, website: null, timings: null };
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

  if (variant === "card") {
    return (
      <div className={`${DESIGN_TOKEN_BG[style.bgColor]} ${DESIGN_TOKEN_TEXT[style.textColor]} ${PADDING_SIZE[style.padding]}`}>
        <div className={LAYOUT_WIDTH[style.layout]}>
          {headingEl}
          <div className={`${cardClass} p-6`}>
            <ContactDetails data={data} contact={contact} isNe={isNe} radius={radius} />
            {data.showHours && contact.timings && (
              <div className="mt-6">
                <HoursTable contact={contact} isNe={isNe} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === "two_column") {
    return (
      <div className={`${DESIGN_TOKEN_BG[style.bgColor]} ${DESIGN_TOKEN_TEXT[style.textColor]} ${PADDING_SIZE[style.padding]}`}>
        <div className={LAYOUT_WIDTH[style.layout]}>
          {headingEl}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ContactDetails data={data} contact={contact} isNe={isNe} radius={radius} />
            {data.showHours && contact.timings && (
              <HoursTable contact={contact} isNe={isNe} />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default: list
  return (
    <div className={`${DESIGN_TOKEN_BG[style.bgColor]} ${DESIGN_TOKEN_TEXT[style.textColor]} ${PADDING_SIZE[style.padding]}`}>
      <div className={LAYOUT_WIDTH[style.layout]}>
        {headingEl}
        <ContactDetails data={data} contact={contact} isNe={isNe} radius={radius} />
        {data.showHours && contact.timings && (
          <div className="mt-6">
            <HoursTable contact={contact} isNe={isNe} />
          </div>
        )}
      </div>
    </div>
  );
}
