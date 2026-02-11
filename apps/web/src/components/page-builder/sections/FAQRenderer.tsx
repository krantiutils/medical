"use client";

import { useState } from "react";
import type { FAQSection } from "@/types/page-builder";
import { DESIGN_TOKEN_BG, DESIGN_TOKEN_TEXT, PADDING_SIZE, LAYOUT_WIDTH } from "@/types/page-builder";
import type { StylePresetClasses } from "../lib/style-presets";

interface FAQRendererProps {
  section: FAQSection;
  lang: string;
  preset?: StylePresetClasses;
}

export function FAQRenderer({ section, lang, preset }: FAQRendererProps) {
  const isNe = lang === "ne";
  const { data, style } = section;
  const heading = isNe ? data.headingNe || data.heading : data.heading;
  const variant = data.variant || "accordion";

  const cardClass = preset?.cardClass || "border-4 border-foreground bg-white shadow-[3px_3px_0_0_#121212]";
  const headingWeight = preset?.headingWeight || "font-bold";
  const divider = preset?.sectionDivider || "border-t-2 border-current/20";

  const headingEl = heading ? (
    <>
      <h2 className={`text-3xl ${headingWeight} mb-4`}>{heading}</h2>
      <div className={`${divider} mb-6`} />
    </>
  ) : null;

  if (data.items.length === 0) {
    return (
      <div className={`${DESIGN_TOKEN_BG[style.bgColor]} ${DESIGN_TOKEN_TEXT[style.textColor]} ${PADDING_SIZE[style.padding]}`}>
        <div className={LAYOUT_WIDTH[style.layout]}>
          {headingEl}
          <p className="text-center opacity-60 py-8">{isNe ? "कुनै प्रश्न थपिएको छैन" : "No questions added yet"}</p>
        </div>
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className={`${DESIGN_TOKEN_BG[style.bgColor]} ${DESIGN_TOKEN_TEXT[style.textColor]} ${PADDING_SIZE[style.padding]}`}>
        <div className={LAYOUT_WIDTH[style.layout]}>
          {headingEl}
          <div className="space-y-6">
            {data.items.map((item) => {
              const question = isNe ? item.questionNe || item.question : item.question;
              const answer = isNe ? item.answerNe || item.answer : item.answer;
              return (
                <div key={item.id}>
                  <h3 className={`text-lg ${headingWeight} mb-2`}>{question}</h3>
                  <p className="text-foreground/80">{answer}</p>
                </div>
              );
            })}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.items.map((item) => {
              const question = isNe ? item.questionNe || item.question : item.question;
              const answer = isNe ? item.answerNe || item.answer : item.answer;
              return (
                <div key={item.id} className={`${cardClass} p-4`}>
                  <h3 className={`text-lg ${headingWeight} mb-2`}>{question}</h3>
                  <p className="text-foreground/80">{answer}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Default: accordion
  return <AccordionFAQ section={section} lang={lang} preset={preset} />;
}

function AccordionFAQ({ section, lang, preset }: FAQRendererProps) {
  const isNe = lang === "ne";
  const { data, style } = section;
  const heading = isNe ? data.headingNe || data.heading : data.heading;
  const [openId, setOpenId] = useState<string | null>(null);

  const cardClass = preset?.cardClass || "border-4 border-foreground bg-white shadow-[3px_3px_0_0_#121212]";
  const headingWeight = preset?.headingWeight || "font-bold";
  const divider = preset?.sectionDivider || "border-t-2 border-current/20";

  return (
    <div className={`${DESIGN_TOKEN_BG[style.bgColor]} ${DESIGN_TOKEN_TEXT[style.textColor]} ${PADDING_SIZE[style.padding]}`}>
      <div className={LAYOUT_WIDTH[style.layout]}>
        {heading && (
          <>
            <h2 className={`text-3xl ${headingWeight} mb-4`}>{heading}</h2>
            <div className={`${divider} mb-6`} />
          </>
        )}
        <div className="space-y-3">
          {data.items.map((item) => {
            const question = isNe ? item.questionNe || item.question : item.question;
            const answer = isNe ? item.answerNe || item.answer : item.answer;
            const isOpen = openId === item.id;

            return (
              <div key={item.id} className={cardClass}>
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : item.id)}
                  className={`w-full flex items-center justify-between p-4 text-left ${headingWeight} hover:bg-muted/50 transition-colors`}
                >
                  <span>{question}</span>
                  <svg
                    className={`w-5 h-5 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 border-t-2 border-foreground/10">
                    <p className="pt-3 text-foreground/80">{answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
