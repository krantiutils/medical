"use client";

import type { SectionType } from "@/types/page-builder";
import { SECTION_TYPE_INFO } from "@/types/page-builder";

interface SectionAddPanelProps {
  lang: string;
  onAddSection: (type: SectionType) => void;
}

export function SectionAddPanel({ lang, onAddSection }: SectionAddPanelProps) {
  const isNe = lang === "ne";

  return (
    <div className="w-44 flex-shrink-0 bg-white border-r-4 border-foreground overflow-y-auto h-full">
      <div className="px-3 py-3 border-b-2 border-foreground/10">
        <h3 className="text-xs font-bold uppercase tracking-widest text-foreground/60">
          {isNe ? "खण्डहरू" : "Sections"}
        </h3>
      </div>
      <div className="p-2 space-y-1">
        {SECTION_TYPE_INFO.map((info) => (
          <button
            key={info.type}
            type="button"
            onClick={() => onAddSection(info.type)}
            className="w-full flex items-center gap-2 px-2 py-2 text-left text-sm font-bold border-2 border-foreground/10 hover:border-primary-blue hover:bg-primary-blue/5 transition-colors"
          >
            <span className="text-base flex-shrink-0">{info.icon}</span>
            <span className="truncate">{isNe ? info.labelNe : info.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
