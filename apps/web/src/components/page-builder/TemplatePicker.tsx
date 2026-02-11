"use client";

import { TEMPLATES } from "./lib/templates";
import type { PageBuilderConfig } from "@/types/page-builder";

interface TemplatePickerProps {
  lang: string;
  onSelect: (config: PageBuilderConfig) => void;
  onClose: () => void;
}

export function TemplatePicker({ lang, onSelect, onClose }: TemplatePickerProps) {
  const isNe = lang === "ne";

  return (
    <div className="flex-1 bg-background overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            {isNe ? "टेम्प्लेट छान्नुहोस्" : "Choose a Template"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm font-bold border-2 border-foreground/20 hover:border-foreground transition-colors"
          >
            {isNe ? "रद्द गर्नुहोस्" : "Cancel"}
          </button>
        </div>

        <p className="text-xs text-primary-red font-bold mb-4">
          {isNe
            ? "चेतावनी: टेम्प्लेट छान्दा तपाईंको हालको कन्फिगरेसन ओभरराइट हुनेछ।"
            : "Warning: Choosing a template will overwrite your current configuration."}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              type="button"
              onClick={() => {
                onSelect(tmpl.createConfig());
                onClose();
              }}
              className="text-left border-4 border-foreground bg-white p-4 shadow-[4px_4px_0_0_#121212] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#121212] transition-all"
            >
              <h4 className="font-bold text-lg mb-1">{isNe ? tmpl.nameNe : tmpl.name}</h4>
              <p className="text-sm text-foreground/60">{isNe ? tmpl.descriptionNe : tmpl.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
