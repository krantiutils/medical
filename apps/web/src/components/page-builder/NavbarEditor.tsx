"use client";

import { useState, useRef } from "react";
import type { NavbarConfig, NavLink, DesignToken } from "@/types/page-builder";

interface NavbarEditorProps {
  navbar: NavbarConfig;
  onChange: (navbar: NavbarConfig) => void;
  onClose: () => void;
  lang: string;
  clinicLogoUrl?: string | null;
  onLogoUploaded?: (url: string) => void;
}

const COLOR_OPTIONS: { value: DesignToken; label: string; swatch: string }[] = [
  { value: "white", label: "White", swatch: "bg-white border" },
  { value: "background", label: "Background", swatch: "bg-background border" },
  { value: "primary-blue", label: "Blue", swatch: "bg-primary-blue" },
  { value: "primary-red", label: "Red", swatch: "bg-primary-red" },
  { value: "foreground", label: "Dark", swatch: "bg-foreground" },
];

export function NavbarEditor({ navbar, onChange, onClose, lang, clinicLogoUrl, onLogoUploaded }: NavbarEditorProps) {
  const isNe = lang === "ne";
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateLink = (index: number, updates: Partial<NavLink>) => {
    const links = [...navbar.links];
    links[index] = { ...links[index], ...updates };
    onChange({ ...navbar, links });
  };

  const addLink = () => {
    const id = `nav-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    onChange({
      ...navbar,
      links: [...navbar.links, { id, label: "", labelNe: "", href: "#", openInNewTab: false }],
    });
  };

  const removeLink = (index: number) => {
    onChange({
      ...navbar,
      links: navbar.links.filter((_, i) => i !== index),
    });
  };

  const moveLink = (from: number, to: number) => {
    if (to < 0 || to >= navbar.links.length) return;
    const links = [...navbar.links];
    const [moved] = links.splice(from, 1);
    links.splice(to, 0, moved);
    onChange({ ...navbar, links });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("logo", file);

      const res = await fetch("/api/clinic/logo", {
        method: "PUT",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setUploadError(data.error || "Upload failed");
        return;
      }

      onLogoUploaded?.(data.url);
    } catch {
      setUploadError("Upload failed");
    } finally {
      setUploading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="w-80 flex-shrink-0 bg-white border-l-4 border-foreground overflow-y-auto h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b-2 border-foreground/10 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-foreground/60">
          {isNe ? "नेभिगेसन" : "Navigation"}
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
        {/* Toggles */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={navbar.logo}
              onChange={(e) => onChange({ ...navbar, logo: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-sm font-bold">{isNe ? "लोगो देखाउनुहोस्" : "Show logo"}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={navbar.clinicName}
              onChange={(e) => onChange({ ...navbar, clinicName: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-sm font-bold">{isNe ? "नाम देखाउनुहोस्" : "Show name"}</span>
          </label>
        </div>

        {/* Logo upload */}
        {navbar.logo && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-foreground/60 mb-1">
              {isNe ? "क्लिनिक लोगो" : "Clinic Logo"}
            </label>
            {clinicLogoUrl && (
              <div className="mb-2">
                <img
                  src={clinicLogoUrl}
                  alt="Current logo"
                  className="w-16 h-16 object-contain border-2 border-foreground/20"
                />
              </div>
            )}
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold border-2 border-foreground/20 hover:border-primary-blue hover:text-primary-blue transition-colors cursor-pointer">
              {uploading ? (
                isNe ? "अपलोड हुँदैछ..." : "Uploading..."
              ) : clinicLogoUrl ? (
                isNe ? "लोगो परिवर्तन गर्नुहोस्" : "Change Logo"
              ) : (
                isNe ? "लोगो अपलोड गर्नुहोस्" : "Upload Logo"
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleLogoUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
            {uploadError && (
              <p className="text-xs text-primary-red font-bold mt-1">{uploadError}</p>
            )}
          </div>
        )}

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
                  onClick={() => onChange({ ...navbar, style: { ...navbar.style, bgColor: opt.value } })}
                  className={`w-6 h-6 rounded-sm ${opt.swatch} border-foreground/10 ${navbar.style.bgColor === opt.value ? "ring-2 ring-primary-blue ring-offset-1" : ""}`}
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
                  onClick={() => onChange({ ...navbar, style: { ...navbar.style, textColor: opt.value } })}
                  className={`w-6 h-6 rounded-sm ${opt.swatch} border-foreground/10 ${navbar.style.textColor === opt.value ? "ring-2 ring-primary-blue ring-offset-1" : ""}`}
                  title={opt.label}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Links */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2">
            {isNe ? "लिंकहरू" : "Links"}
          </label>
          <div className="space-y-2">
            {navbar.links.map((link, idx) => (
              <div key={link.id} className="border-2 border-foreground/10 p-2 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex gap-0.5">
                    <button
                      type="button"
                      onClick={() => moveLink(idx, idx - 1)}
                      disabled={idx === 0}
                      className="p-0.5 text-foreground/40 hover:text-foreground disabled:opacity-30"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => moveLink(idx, idx + 1)}
                      disabled={idx === navbar.links.length - 1}
                      className="p-0.5 text-foreground/40 hover:text-foreground disabled:opacity-30"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                  </div>
                  <button type="button" onClick={() => removeLink(idx)} className="text-xs text-primary-red font-bold">
                    {isNe ? "हटाउनुहोस्" : "Remove"}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <input
                    type="text"
                    value={link.label}
                    onChange={(e) => updateLink(idx, { label: e.target.value })}
                    placeholder="Label (EN)"
                    className="px-2 py-1 border border-foreground/20 text-sm focus:border-primary-blue focus:outline-none"
                  />
                  <input
                    type="text"
                    value={link.labelNe}
                    onChange={(e) => updateLink(idx, { labelNe: e.target.value })}
                    placeholder="Label (NE)"
                    className="px-2 py-1 border border-foreground/20 text-sm focus:border-primary-blue focus:outline-none"
                  />
                </div>
                <input
                  type="text"
                  value={link.href}
                  onChange={(e) => updateLink(idx, { href: e.target.value })}
                  placeholder="#section or https://..."
                  className="w-full px-2 py-1 border border-foreground/20 text-sm focus:border-primary-blue focus:outline-none"
                />
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={link.openInNewTab}
                    onChange={(e) => updateLink(idx, { openInNewTab: e.target.checked })}
                    className="w-3 h-3"
                  />
                  <span className="text-xs text-foreground/60">{isNe ? "नयाँ ट्याबमा खोल्नुहोस्" : "Open in new tab"}</span>
                </label>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addLink}
            className="mt-2 w-full py-2 text-sm font-bold border-2 border-dashed border-foreground/20 hover:border-primary-blue text-foreground/60 hover:text-primary-blue transition-colors"
          >
            + {isNe ? "लिंक थप्नुहोस्" : "Add link"}
          </button>
        </div>
      </div>
    </div>
  );
}
