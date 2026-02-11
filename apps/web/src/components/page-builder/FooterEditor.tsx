"use client";

import type { FooterConfig, DesignToken } from "@/types/page-builder";

interface FooterEditorProps {
  footer: FooterConfig;
  onChange: (footer: FooterConfig) => void;
  onClose: () => void;
  lang: string;
}

const COLOR_OPTIONS: { value: DesignToken; label: string; swatch: string }[] = [
  { value: "white", label: "White", swatch: "bg-white border" },
  { value: "background", label: "Background", swatch: "bg-background border" },
  { value: "primary-blue", label: "Blue", swatch: "bg-primary-blue" },
  { value: "primary-red", label: "Red", swatch: "bg-primary-red" },
  { value: "foreground", label: "Dark", swatch: "bg-foreground" },
];

export function FooterEditor({ footer, onChange, onClose, lang }: FooterEditorProps) {
  const isNe = lang === "ne";

  return (
    <div className="w-80 flex-shrink-0 bg-white border-l-4 border-foreground overflow-y-auto h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b-2 border-foreground/10 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-foreground/60">
          {isNe ? "फुटर" : "Footer"}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="p-1 hover:bg-foreground/10 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Enable toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={footer.enabled}
            onChange={(e) => onChange({ ...footer, enabled: e.target.checked })}
            className="w-4 h-4"
          />
          <span className="text-sm font-bold">{isNe ? "फुटर सक्रिय" : "Show footer"}</span>
        </label>

        {/* Content toggles */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={footer.showClinicName}
              onChange={(e) => onChange({ ...footer, showClinicName: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-sm font-bold">{isNe ? "क्लिनिक नाम" : "Clinic name"}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={footer.showPhone}
              onChange={(e) => onChange({ ...footer, showPhone: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-sm font-bold">{isNe ? "फोन" : "Phone"}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={footer.showEmail}
              onChange={(e) => onChange({ ...footer, showEmail: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-sm font-bold">{isNe ? "इमेल" : "Email"}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={footer.showAddress}
              onChange={(e) => onChange({ ...footer, showAddress: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-sm font-bold">{isNe ? "ठेगाना" : "Address"}</span>
          </label>
        </div>

        {/* Copyright */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-foreground/60 mb-1">
            Copyright (EN)
          </label>
          <input
            type="text"
            value={footer.copyright}
            onChange={(e) => onChange({ ...footer, copyright: e.target.value })}
            placeholder="© 2026 Your Clinic"
            className="w-full px-3 py-2 border-2 border-foreground/20 text-sm focus:border-primary-blue focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-foreground/60 mb-1">
            Copyright (NE)
          </label>
          <input
            type="text"
            value={footer.copyrightNe}
            onChange={(e) => onChange({ ...footer, copyrightNe: e.target.value })}
            placeholder="© २०२६ तपाईंको क्लिनिक"
            className="w-full px-3 py-2 border-2 border-foreground/20 text-sm focus:border-primary-blue focus:outline-none"
          />
        </div>

        {/* Colors */}
        <div className="space-y-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-foreground/60 mb-1">
              {isNe ? "पृष्ठभूमि" : "Background"}
            </label>
            <div className="flex gap-1">
              {COLOR_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChange({ ...footer, style: { ...footer.style, bgColor: opt.value } })}
                  className={`w-6 h-6 rounded-sm ${opt.swatch} border-foreground/10 ${footer.style.bgColor === opt.value ? "ring-2 ring-primary-blue ring-offset-1" : ""}`}
                  title={opt.label}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-foreground/60 mb-1">
              {isNe ? "पाठ" : "Text"}
            </label>
            <div className="flex gap-1">
              {COLOR_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChange({ ...footer, style: { ...footer.style, textColor: opt.value } })}
                  className={`w-6 h-6 rounded-sm ${opt.swatch} border-foreground/10 ${footer.style.textColor === opt.value ? "ring-2 ring-primary-blue ring-offset-1" : ""}`}
                  title={opt.label}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
