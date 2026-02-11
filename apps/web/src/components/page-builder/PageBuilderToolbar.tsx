"use client";

import type { AutoSaveStatus } from "./hooks/useAutoSave";
import type { BuilderPage, StylePreset } from "@/types/page-builder";
import { PAGE_TEMPLATES } from "@/types/page-builder";
import { STYLE_PRESET_INFO } from "./lib/style-presets";
import { useState, useRef, useEffect } from "react";

interface PageBuilderToolbarProps {
  lang: string;
  clinicSlug: string;
  enabled: boolean;
  saveStatus: AutoSaveStatus;
  canUndo: boolean;
  canRedo: boolean;
  stylePreset: StylePreset;
  pages: BuilderPage[];
  currentPageId: string | null;
  clinicLogoUrl?: string | null;
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onToggleEnabled: () => void;
  onOpenTemplates: () => void;
  onOpenNavbar: () => void;
  onOpenFooter: () => void;
  onSetStylePreset: (preset: StylePreset) => void;
  onSelectPage: (id: string) => void;
  onAddPage: (slug: string, title: string, titleNe: string) => void;
  onRemovePage: (id: string) => void;
  onRenamePage: (id: string, title: string, titleNe: string) => void;
  onUpdatePageSlug: (id: string, slug: string) => void;
  onLogoUploaded?: (url: string) => void;
}

export function PageBuilderToolbar({
  lang,
  clinicSlug,
  enabled,
  saveStatus,
  canUndo,
  canRedo,
  stylePreset,
  pages,
  currentPageId,
  clinicLogoUrl,
  onSave,
  onUndo,
  onRedo,
  onToggleEnabled,
  onOpenTemplates,
  onOpenNavbar,
  onOpenFooter,
  onSetStylePreset,
  onSelectPage,
  onAddPage,
  onRemovePage,
  onRenamePage,
  onUpdatePageSlug,
  onLogoUploaded,
}: PageBuilderToolbarProps) {
  const isNe = lang === "ne";
  const [showAddPage, setShowAddPage] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customSlug, setCustomSlug] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customTitleNe, setCustomTitleNe] = useState("");
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [showLogoPicker, setShowLogoPicker] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const addPageRef = useRef<HTMLDivElement>(null);
  const stylePickerRef = useRef<HTMLDivElement>(null);
  const logoPickerRef = useRef<HTMLDivElement>(null);
  const logoFileRef = useRef<HTMLInputElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (addPageRef.current && !addPageRef.current.contains(e.target as Node)) {
        setShowAddPage(false);
        setShowCustomForm(false);
      }
      if (stylePickerRef.current && !stylePickerRef.current.contains(e.target as Node)) {
        setShowStylePicker(false);
      }
      if (logoPickerRef.current && !logoPickerRef.current.contains(e.target as Node)) {
        setShowLogoPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    setLogoError(null);
    try {
      const formData = new FormData();
      formData.append("logo", file);
      const res = await fetch("/api/clinic/logo", { method: "PUT", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setLogoError(data.error || "Upload failed");
        return;
      }
      onLogoUploaded?.(data.url);
    } catch {
      setLogoError("Upload failed");
    } finally {
      setLogoUploading(false);
      if (logoFileRef.current) logoFileRef.current.value = "";
    }
  };

  const statusText = {
    idle: "",
    saving: isNe ? "सेभ हुँदैछ..." : "Saving...",
    saved: isNe ? "सेभ भयो" : "Saved",
    error: isNe ? "सेभ असफल" : "Save failed",
  };

  const statusColor = {
    idle: "",
    saving: "text-primary-blue",
    saved: "text-verified",
    error: "text-primary-red",
  };

  // Pages that could still be added (not yet created)
  const existingSlugs = new Set(pages.map((p) => p.slug));
  const availablePageTemplates = PAGE_TEMPLATES.filter((t) => !existingSlugs.has(t.slug));

  return (
    <div className="bg-white border-b-4 border-foreground">
      {/* Top row: actions */}
      <div className="flex items-center gap-2 px-4 py-2 flex-wrap">
        {/* Save button */}
        <button
          type="button"
          onClick={onSave}
          className="px-4 py-1.5 text-sm font-bold bg-primary-blue text-white border-2 border-foreground shadow-[3px_3px_0_0_#121212] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_#121212] active:translate-y-0 active:shadow-none transition-all"
        >
          {isNe ? "सेभ" : "Save"}
        </button>

        {/* Save status */}
        {statusText[saveStatus] && (
          <span className={`text-xs font-bold ${statusColor[saveStatus]}`}>
            {statusText[saveStatus]}
          </span>
        )}

        {/* Undo/Redo */}
        <div className="flex gap-0.5 ml-2">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 border-2 border-foreground/20 hover:border-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Undo"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a4 4 0 014 4v2M3 10l4 4M3 10l4-4" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 border-2 border-foreground/20 hover:border-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Redo"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a4 4 0 00-4 4v2M21 10l-4 4M21 10l-4-4" />
            </svg>
          </button>
        </div>

        {/* Templates */}
        <button
          type="button"
          onClick={onOpenTemplates}
          className="px-3 py-1.5 text-sm font-bold border-2 border-foreground/20 hover:border-primary-blue hover:text-primary-blue transition-colors"
        >
          {isNe ? "टेम्प्लेट" : "Templates"}
        </button>

        {/* Navbar */}
        <button
          type="button"
          onClick={onOpenNavbar}
          className="px-3 py-1.5 text-sm font-bold border-2 border-foreground/20 hover:border-primary-blue hover:text-primary-blue transition-colors"
        >
          {isNe ? "नेभिगेसन" : "Navbar"}
        </button>

        {/* Footer */}
        <button
          type="button"
          onClick={onOpenFooter}
          className="px-3 py-1.5 text-sm font-bold border-2 border-foreground/20 hover:border-primary-blue hover:text-primary-blue transition-colors"
        >
          {isNe ? "फुटर" : "Footer"}
        </button>

        {/* Logo */}
        <div className="relative" ref={logoPickerRef}>
          <button
            type="button"
            onClick={() => setShowLogoPicker(!showLogoPicker)}
            className="px-3 py-1.5 text-sm font-bold border-2 border-foreground/20 hover:border-primary-blue hover:text-primary-blue transition-colors flex items-center gap-1.5"
          >
            {clinicLogoUrl && (
              <img src={clinicLogoUrl} alt="" className="w-4 h-4 object-contain" />
            )}
            {isNe ? "लोगो" : "Logo"}
          </button>
          {showLogoPicker && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-white border-4 border-foreground shadow-[4px_4px_0_0_#121212] p-3 min-w-[220px]">
              {clinicLogoUrl && (
                <div className="mb-3 flex justify-center">
                  <img
                    src={clinicLogoUrl}
                    alt="Current logo"
                    className="w-20 h-20 object-contain border-2 border-foreground/20"
                  />
                </div>
              )}
              <label className="flex items-center justify-center gap-1.5 w-full px-3 py-2 text-sm font-bold border-2 border-foreground/20 hover:border-primary-blue hover:text-primary-blue transition-colors cursor-pointer">
                {logoUploading ? (
                  isNe ? "अपलोड हुँदैछ..." : "Uploading..."
                ) : clinicLogoUrl ? (
                  isNe ? "लोगो परिवर्तन गर्नुहोस्" : "Change Logo"
                ) : (
                  isNe ? "लोगो अपलोड गर्नुहोस्" : "Upload Logo"
                )}
                <input
                  ref={logoFileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleLogoUpload}
                  disabled={logoUploading}
                  className="hidden"
                />
              </label>
              {logoError && (
                <p className="text-xs text-primary-red font-bold mt-1">{logoError}</p>
              )}
              <p className="text-[10px] text-foreground/40 mt-2">JPEG, PNG, or WebP. Max 5MB.</p>
            </div>
          )}
        </div>

        {/* Style Preset Picker */}
        <div className="relative" ref={stylePickerRef}>
          <button
            type="button"
            onClick={() => setShowStylePicker(!showStylePicker)}
            className="px-3 py-1.5 text-sm font-bold border-2 border-foreground/20 hover:border-primary-blue hover:text-primary-blue transition-colors"
          >
            {isNe ? "शैली" : "Style"}: {STYLE_PRESET_INFO.find((p) => p.value === stylePreset)?.label || stylePreset}
          </button>
          {showStylePicker && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-white border-4 border-foreground shadow-[4px_4px_0_0_#121212] min-w-[200px]">
              {STYLE_PRESET_INFO.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => {
                    onSetStylePreset(preset.value);
                    setShowStylePicker(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-primary-blue/10 transition-colors ${stylePreset === preset.value ? "bg-primary-blue/20 font-bold" : ""}`}
                >
                  <span className="font-bold">{isNe ? preset.labelNe : preset.label}</span>
                  <span className="block text-xs text-foreground/60">{preset.description}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Enable/Disable toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-xs font-bold uppercase tracking-wider text-foreground/60">
            {isNe ? "सक्रिय" : "Enable"}
          </span>
          <div
            className={`relative w-10 h-5 rounded-full transition-colors ${enabled ? "bg-verified" : "bg-foreground/20"}`}
            onClick={onToggleEnabled}
          >
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full border border-foreground/20 transition-transform ${enabled ? "translate-x-5" : "translate-x-0.5"}`} />
          </div>
        </label>

        {/* View page — opens with ?preview=true */}
        <a
          href={
            process.env.NEXT_PUBLIC_BASE_DOMAIN
              ? `https://${clinicSlug}.${process.env.NEXT_PUBLIC_BASE_DOMAIN}?preview=true`
              : `/${lang}/clinic/${clinicSlug}?preview=true`
          }
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 text-sm font-bold border-2 border-foreground/20 hover:border-primary-blue hover:text-primary-blue transition-colors flex items-center gap-1"
        >
          {isNe ? "पृष्ठ हेर्नुहोस्" : "View Page"}
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>

      {/* Page tabs row */}
      <div className="relative flex items-center gap-1 px-4 py-1.5 border-t-2 border-foreground/10">
        <div className="flex items-center gap-1 flex-wrap flex-1 min-w-0">
        {pages.map((page) => (
          <div key={page.id} className="relative flex items-center group">
            <button
              type="button"
              onClick={() => onSelectPage(page.id)}
              className={`px-3 py-1 text-sm font-bold transition-colors whitespace-nowrap ${
                page.id === currentPageId
                  ? "bg-foreground text-white"
                  : "bg-foreground/5 text-foreground/60 hover:bg-foreground/10 hover:text-foreground"
              } ${!page.visible ? "opacity-50" : ""}`}
            >
              {isNe ? page.titleNe || page.title : page.title}
              {page.isHomePage && (
                <span className="ml-1 text-xs opacity-60">(home)</span>
              )}
            </button>
            {/* Edit + Delete buttons for non-home pages */}
            {!page.isHomePage && (
              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingPageId(editingPageId === page.id ? null : page.id);
                  }}
                  className="p-0.5 text-foreground/30 hover:text-primary-blue"
                  title={isNe ? "सम्पादन" : "Edit slug & title"}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemovePage(page.id);
                  }}
                  className="p-0.5 text-foreground/30 hover:text-primary-red"
                  title={isNe ? "हटाउनुहोस्" : "Delete page"}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            {/* Page edit popover — rendered inside relative parent, now outside overflow */}
            {editingPageId === page.id && (
              <div
                className="absolute top-full left-0 mt-1 z-50 bg-white border-4 border-foreground shadow-[4px_4px_0_0_#121212] p-3 space-y-2 min-w-[220px]"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-foreground/60 mb-0.5">
                    {isNe ? "शीर्षक (EN)" : "Title (EN)"}
                  </label>
                  <input
                    type="text"
                    value={page.title}
                    onChange={(e) => onRenamePage(page.id, e.target.value, page.titleNe)}
                    className="w-full px-2 py-1 border-2 border-foreground/20 text-sm font-bold focus:border-primary-blue focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-foreground/60 mb-0.5">
                    {isNe ? "शीर्षक (NE)" : "Title (NE)"}
                  </label>
                  <input
                    type="text"
                    value={page.titleNe}
                    onChange={(e) => onRenamePage(page.id, page.title, e.target.value)}
                    className="w-full px-2 py-1 border-2 border-foreground/20 text-sm font-bold focus:border-primary-blue focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-foreground/60 mb-0.5">
                    {isNe ? "URL स्लग" : "URL Slug"}
                  </label>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-foreground/40">/</span>
                    <input
                      type="text"
                      value={page.slug}
                      onChange={(e) => {
                        const slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
                        onUpdatePageSlug(page.id, slug);
                      }}
                      className="flex-1 px-2 py-1 border-2 border-foreground/20 text-sm font-mono focus:border-primary-blue focus:outline-none"
                      placeholder="custom-page"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingPageId(null)}
                  className="w-full py-1.5 text-xs font-bold bg-foreground text-white hover:bg-primary-blue transition-colors"
                >
                  {isNe ? "बन्द गर्नुहोस्" : "Done"}
                </button>
              </div>
            )}
          </div>
        ))}
        </div>

        {/* Add page button — outside overflow container so dropdown isn't clipped */}
        <div className="relative flex-shrink-0" ref={addPageRef}>
          <button
            type="button"
            onClick={() => { setShowAddPage(!showAddPage); setShowCustomForm(false); }}
            className="px-3 py-1 text-sm font-bold text-foreground/60 hover:text-primary-blue border-2 border-dashed border-foreground/20 hover:border-primary-blue transition-colors flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            {isNe ? "पृष्ठ" : "Page"}
          </button>
          {showAddPage && (
            <div className="absolute top-full right-0 mt-1 z-50 bg-white border-4 border-foreground shadow-[4px_4px_0_0_#121212] min-w-[240px]">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-foreground/40 border-b border-foreground/10">
                {isNe ? "टेम्प्लेटबाट" : "From template"}
              </div>
              {availablePageTemplates.map((tmpl) => (
                <button
                  key={tmpl.slug}
                  type="button"
                  onClick={() => {
                    onAddPage(tmpl.slug, tmpl.title, tmpl.titleNe);
                    setShowAddPage(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm font-bold hover:bg-primary-blue/10 transition-colors flex items-center justify-between"
                >
                  <span>{isNe ? tmpl.titleNe : tmpl.title}</span>
                  <span className="text-[10px] text-foreground/30 font-mono">/{tmpl.slug}</span>
                </button>
              ))}
              {availablePageTemplates.length === 0 && (
                <p className="px-3 py-2 text-xs text-foreground/40 italic">
                  {isNe ? "सबै टेम्प्लेट प्रयोग भइसकेको" : "All templates used"}
                </p>
              )}

              <div className="border-t-2 border-foreground/10">
                {!showCustomForm ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomForm(true);
                      setCustomSlug("");
                      setCustomTitle("");
                      setCustomTitleNe("");
                    }}
                    className="w-full text-left px-3 py-2 text-sm font-bold hover:bg-primary-blue/10 transition-colors"
                  >
                    {isNe ? "+ कस्टम पृष्ठ" : "+ Custom Page"}
                  </button>
                ) : (
                  <div className="p-3 space-y-2" onClick={(e) => e.stopPropagation()}>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-foreground/40 mb-0.5">
                        URL Slug
                      </label>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-foreground/40">/</span>
                        <input
                          type="text"
                          value={customSlug}
                          onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-"))}
                          placeholder="my-page"
                          className="flex-1 px-2 py-1 border-2 border-foreground/20 text-sm font-mono focus:border-primary-blue focus:outline-none"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-foreground/40 mb-0.5">
                        Title (EN)
                      </label>
                      <input
                        type="text"
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        placeholder="Page Title"
                        className="w-full px-2 py-1 border-2 border-foreground/20 text-sm font-bold focus:border-primary-blue focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-foreground/40 mb-0.5">
                        Title (NE)
                      </label>
                      <input
                        type="text"
                        value={customTitleNe}
                        onChange={(e) => setCustomTitleNe(e.target.value)}
                        placeholder="पृष्ठ शीर्षक"
                        className="w-full px-2 py-1 border-2 border-foreground/20 text-sm font-bold focus:border-primary-blue focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={!customSlug.trim() || !customTitle.trim()}
                      onClick={() => {
                        const slug = customSlug.trim().replace(/^-+|-+$/g, "");
                        if (!slug || !customTitle.trim()) return;
                        onAddPage(slug, customTitle.trim(), customTitleNe.trim() || customTitle.trim());
                        setShowAddPage(false);
                        setShowCustomForm(false);
                      }}
                      className="w-full py-1.5 text-sm font-bold bg-primary-blue text-white border-2 border-foreground shadow-[2px_2px_0_0_#121212] hover:-translate-y-0.5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      {isNe ? "पृष्ठ बनाउनुहोस्" : "Create Page"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
