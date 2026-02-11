"use client";

import { useCallback } from "react";
import { ImageBrowser } from "./ImageBrowser";
import { RichTextEditor } from "./RichTextEditor";
import type {
  PageSection,
  SectionStyle,
  DesignToken,
  PaddingSize,
  LayoutWidth,
  FAQSection,
  ServicesGridSection,
  PhotoGallerySection,
  ButtonSection,
  ButtonSize,
  ButtonGap,
  ButtonStyle,
  Alignment,
} from "@/types/page-builder";
import { SECTION_VARIANTS } from "@/types/page-builder";

interface SectionSidebarProps {
  section: PageSection;
  lang: string;
  onUpdate: (updates: Partial<PageSection>) => void;
  onUpdateData: (dataUpdates: Record<string, unknown>) => void;
  onClose: () => void;
}

const COLOR_OPTIONS: { value: DesignToken; label: string; swatch: string }[] = [
  { value: "white", label: "White", swatch: "bg-white border" },
  { value: "background", label: "Background", swatch: "bg-background border" },
  { value: "primary-blue", label: "Blue", swatch: "bg-primary-blue" },
  { value: "primary-red", label: "Red", swatch: "bg-primary-red" },
  { value: "primary-yellow", label: "Yellow", swatch: "bg-primary-yellow" },
  { value: "foreground", label: "Dark", swatch: "bg-foreground" },
  { value: "muted", label: "Muted", swatch: "bg-muted border" },
];

const PADDING_OPTIONS: { value: PaddingSize; label: string }[] = [
  { value: "none", label: "None" },
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
];

const LAYOUT_OPTIONS: { value: LayoutWidth; label: string }[] = [
  { value: "full", label: "Full width" },
  { value: "contained", label: "Contained" },
  { value: "narrow", label: "Narrow" },
];

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-bold uppercase tracking-widest text-foreground/60 mb-1">{children}</label>;
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 border-2 border-foreground/20 text-sm font-medium focus:border-primary-blue focus:outline-none transition-colors"
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 4 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2 border-2 border-foreground/20 text-sm font-medium font-mono focus:border-primary-blue focus:outline-none transition-colors resize-y"
    />
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <div
        className={`relative w-10 h-5 rounded-full transition-colors ${checked ? "bg-primary-blue" : "bg-foreground/20"}`}
        onClick={() => onChange(!checked)}
      >
        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full border border-foreground/20 transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </div>
      <span className="text-sm font-medium">{label}</span>
    </label>
  );
}

function ColorSwatches({ value, onChange, label }: { value: DesignToken; onChange: (v: DesignToken) => void; label: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex gap-1.5 flex-wrap">
        {COLOR_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`w-7 h-7 rounded-sm ${opt.swatch} border-foreground/10 ${value === opt.value ? "ring-2 ring-primary-blue ring-offset-1" : ""}`}
            title={opt.label}
          />
        ))}
      </div>
    </div>
  );
}

function ColumnSelect({ value, onChange }: { value: number; onChange: (v: 2 | 3 | 4) => void }) {
  return (
    <div>
      <Label>Columns</Label>
      <div className="flex gap-1">
        {([2, 3, 4] as const).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`px-3 py-1.5 text-sm font-bold border-2 transition-colors ${value === n ? "border-primary-blue bg-primary-blue text-white" : "border-foreground/20 hover:border-primary-blue"}`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function VariantPicker({ sectionType, currentVariant, onChange }: { sectionType: PageSection["type"]; currentVariant: string; onChange: (v: string) => void }) {
  const variants = SECTION_VARIANTS[sectionType];
  if (!variants || variants.length <= 1) return null;

  return (
    <div>
      <Label>Variant</Label>
      <div className="flex flex-wrap gap-1">
        {variants.map((v) => (
          <button
            key={v.value}
            type="button"
            onClick={() => onChange(v.value)}
            title={v.description}
            className={`px-2.5 py-1.5 text-xs font-bold border-2 transition-colors ${
              currentVariant === v.value
                ? "border-primary-blue bg-primary-blue text-white"
                : "border-foreground/20 hover:border-primary-blue"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SectionSidebar({ section, lang, onUpdate, onUpdateData, onClose }: SectionSidebarProps) {
  const isNe = lang === "ne";

  const updateStyle = useCallback((styleUpdates: Partial<SectionStyle>) => {
    onUpdate({ style: { ...section.style, ...styleUpdates } } as Partial<PageSection>);
  }, [section.style, onUpdate]);

  // Render section-specific fields
  function renderDataFields() {
    const d = section.data as Record<string, unknown>;

    switch (section.type) {
      case "hero":
        return (
          <>
            <div><Label>Heading (EN)</Label><Input value={d.heading as string} onChange={(v) => onUpdateData({ heading: v })} /></div>
            <div><Label>Heading (NE)</Label><Input value={d.headingNe as string} onChange={(v) => onUpdateData({ headingNe: v })} /></div>
            <div><Label>Subtitle (EN)</Label><Input value={d.subtitle as string} onChange={(v) => onUpdateData({ subtitle: v })} /></div>
            <div><Label>Subtitle (NE)</Label><Input value={d.subtitleNe as string} onChange={(v) => onUpdateData({ subtitleNe: v })} /></div>
            <Toggle checked={d.showLogo as boolean} onChange={(v) => onUpdateData({ showLogo: v })} label="Show clinic logo" />
            <div>
              <Label>Hero Image</Label>
              {(d.image as string | null) && (
                <div className="relative mb-2">
                  <img src={d.image as string} alt="" className="w-full h-20 object-cover border-2 border-foreground/20" />
                  <button
                    type="button"
                    onClick={() => onUpdateData({ image: null })}
                    className="absolute top-1 right-1 w-5 h-5 bg-primary-red text-white flex items-center justify-center text-xs font-bold"
                  >
                    X
                  </button>
                </div>
              )}
              <ImageBrowser lang={lang} onSelect={(url) => onUpdateData({ image: url })} />
            </div>
          </>
        );

      case "text":
        return (
          <>
            <div><Label>Heading (EN)</Label><Input value={d.heading as string} onChange={(v) => onUpdateData({ heading: v })} /></div>
            <div><Label>Heading (NE)</Label><Input value={d.headingNe as string} onChange={(v) => onUpdateData({ headingNe: v })} /></div>
            <div><Label>Body (EN)</Label><RichTextEditor value={d.body as string} onChange={(v) => onUpdateData({ body: v })} placeholder="Write your content..." lang="en" /></div>
            <div><Label>Body (NE)</Label><RichTextEditor value={d.bodyNe as string} onChange={(v) => onUpdateData({ bodyNe: v })} placeholder="सामग्री लेख्नुहोस्..." lang="ne" /></div>
          </>
        );

      case "services_grid": {
        const services = (section as ServicesGridSection).data.manualServices;
        return (
          <>
            <div><Label>Heading (EN)</Label><Input value={d.heading as string} onChange={(v) => onUpdateData({ heading: v })} /></div>
            <div><Label>Heading (NE)</Label><Input value={d.headingNe as string} onChange={(v) => onUpdateData({ headingNe: v })} /></div>
            <ColumnSelect value={d.columns as number} onChange={(v) => onUpdateData({ columns: v })} />
            <div>
              <Label>Data source</Label>
              <div className="flex gap-2">
                {(["auto", "manual"] as const).map((src) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => onUpdateData({ source: src })}
                    className={`px-3 py-1.5 text-sm font-bold border-2 ${d.source === src ? "border-primary-blue bg-primary-blue text-white" : "border-foreground/20"}`}
                  >
                    {src === "auto" ? "Auto (from clinic)" : "Manual"}
                  </button>
                ))}
              </div>
            </div>
            {d.source === "manual" && (
              <div>
                <Label>Services</Label>
                <div className="space-y-3">
                  {services.map((svc, idx) => (
                    <div key={svc.id} className="border-2 border-foreground/10 p-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground/40">#{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const newServices = services.filter((_, i) => i !== idx);
                            onUpdateData({ manualServices: newServices });
                          }}
                          className="text-xs text-primary-red font-bold"
                        >
                          Remove
                        </button>
                      </div>
                      <Input
                        value={svc.name}
                        onChange={(v) => {
                          const updated = [...services];
                          updated[idx] = { ...updated[idx], name: v };
                          onUpdateData({ manualServices: updated });
                        }}
                        placeholder="Service name (EN)"
                      />
                      <Input
                        value={svc.nameNe}
                        onChange={(v) => {
                          const updated = [...services];
                          updated[idx] = { ...updated[idx], nameNe: v };
                          onUpdateData({ manualServices: updated });
                        }}
                        placeholder="Service name (NE)"
                      />
                      <Input
                        value={svc.description}
                        onChange={(v) => {
                          const updated = [...services];
                          updated[idx] = { ...updated[idx], description: v };
                          onUpdateData({ manualServices: updated });
                        }}
                        placeholder="Description (EN)"
                      />
                      <Input
                        value={svc.descriptionNe}
                        onChange={(v) => {
                          const updated = [...services];
                          updated[idx] = { ...updated[idx], descriptionNe: v };
                          onUpdateData({ manualServices: updated });
                        }}
                        placeholder="Description (NE)"
                      />
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newSvc = {
                      id: `svc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                      name: "",
                      nameNe: "",
                      description: "",
                      descriptionNe: "",
                      icon: "",
                    };
                    onUpdateData({ manualServices: [...services, newSvc] });
                  }}
                  className="mt-2 w-full py-2 text-sm font-bold border-2 border-dashed border-foreground/20 hover:border-primary-blue text-foreground/60 hover:text-primary-blue transition-colors"
                >
                  + Add service
                </button>
              </div>
            )}
          </>
        );
      }

      case "doctor_showcase":
        return (
          <>
            <div><Label>Heading (EN)</Label><Input value={d.heading as string} onChange={(v) => onUpdateData({ heading: v })} /></div>
            <div><Label>Heading (NE)</Label><Input value={d.headingNe as string} onChange={(v) => onUpdateData({ headingNe: v })} /></div>
            <ColumnSelect value={d.columns as number} onChange={(v) => onUpdateData({ columns: v })} />
            <Toggle checked={d.showSpecialty as boolean} onChange={(v) => onUpdateData({ showSpecialty: v })} label="Show specialty" />
            <Toggle checked={d.showDegree as boolean} onChange={(v) => onUpdateData({ showDegree: v })} label="Show degree" />
            <Toggle checked={d.showRole as boolean} onChange={(v) => onUpdateData({ showRole: v })} label="Show role" />
          </>
        );

      case "photo_gallery": {
        const photos = (section as PhotoGallerySection).data.manualPhotos;
        const galleryVariant = (d.variant as string) || "grid";
        return (
          <>
            <div><Label>Heading (EN)</Label><Input value={d.heading as string} onChange={(v) => onUpdateData({ heading: v })} /></div>
            <div><Label>Heading (NE)</Label><Input value={d.headingNe as string} onChange={(v) => onUpdateData({ headingNe: v })} /></div>
            {galleryVariant === "grid" && (
              <ColumnSelect value={d.columns as number} onChange={(v) => onUpdateData({ columns: v })} />
            )}
            <div>
              <Label>Data source</Label>
              <div className="flex gap-2">
                {(["auto", "manual"] as const).map((src) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => onUpdateData({ source: src })}
                    className={`px-3 py-1.5 text-sm font-bold border-2 ${d.source === src ? "border-primary-blue bg-primary-blue text-white" : "border-foreground/20"}`}
                  >
                    {src === "auto" ? "Auto (from clinic)" : "Manual"}
                  </button>
                ))}
              </div>
            </div>
            {d.source === "manual" && (
              <div>
                <Label>Photos</Label>
                <div className="space-y-3">
                  {photos.map((photo, idx) => (
                    <div key={photo.id} className="border-2 border-foreground/10 p-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground/40">#{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const newPhotos = photos.filter((_, i) => i !== idx);
                            onUpdateData({ manualPhotos: newPhotos });
                          }}
                          className="text-xs text-primary-red font-bold"
                        >
                          Remove
                        </button>
                      </div>
                      {photo.url ? (
                        <div className="relative">
                          <img src={photo.url} alt="" className="w-full h-20 object-cover border-2 border-foreground/20" />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...photos];
                              updated[idx] = { ...updated[idx], url: "" };
                              onUpdateData({ manualPhotos: updated });
                            }}
                            className="absolute top-1 right-1 w-5 h-5 bg-primary-red text-white flex items-center justify-center text-xs font-bold"
                          >
                            X
                          </button>
                        </div>
                      ) : (
                        <ImageBrowser
                          lang={lang}
                          onSelect={(url) => {
                            const updated = [...photos];
                            updated[idx] = { ...updated[idx], url };
                            onUpdateData({ manualPhotos: updated });
                          }}
                        />
                      )}
                      <Input
                        value={photo.caption}
                        onChange={(v) => {
                          const updated = [...photos];
                          updated[idx] = { ...updated[idx], caption: v };
                          onUpdateData({ manualPhotos: updated });
                        }}
                        placeholder="Caption (EN)"
                      />
                      <Input
                        value={photo.captionNe}
                        onChange={(v) => {
                          const updated = [...photos];
                          updated[idx] = { ...updated[idx], captionNe: v };
                          onUpdateData({ manualPhotos: updated });
                        }}
                        placeholder="Caption (NE)"
                      />
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newPhoto = {
                      id: `photo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                      url: "",
                      caption: "",
                      captionNe: "",
                    };
                    onUpdateData({ manualPhotos: [...photos, newPhoto] });
                  }}
                  className="mt-2 w-full py-2 text-sm font-bold border-2 border-dashed border-foreground/20 hover:border-primary-blue text-foreground/60 hover:text-primary-blue transition-colors"
                >
                  + Add photo
                </button>
              </div>
            )}
          </>
        );
      }

      case "contact_info":
        return (
          <>
            <div><Label>Heading (EN)</Label><Input value={d.heading as string} onChange={(v) => onUpdateData({ heading: v })} /></div>
            <div><Label>Heading (NE)</Label><Input value={d.headingNe as string} onChange={(v) => onUpdateData({ headingNe: v })} /></div>
            <Toggle checked={d.showPhone as boolean} onChange={(v) => onUpdateData({ showPhone: v })} label="Show phone" />
            <Toggle checked={d.showEmail as boolean} onChange={(v) => onUpdateData({ showEmail: v })} label="Show email" />
            <Toggle checked={d.showAddress as boolean} onChange={(v) => onUpdateData({ showAddress: v })} label="Show address" />
            <Toggle checked={d.showWebsite as boolean} onChange={(v) => onUpdateData({ showWebsite: v })} label="Show website" />
            <Toggle checked={d.showHours as boolean} onChange={(v) => onUpdateData({ showHours: v })} label="Show hours" />
          </>
        );

      case "testimonials":
        return (
          <>
            <div><Label>Heading (EN)</Label><Input value={d.heading as string} onChange={(v) => onUpdateData({ heading: v })} /></div>
            <div><Label>Heading (NE)</Label><Input value={d.headingNe as string} onChange={(v) => onUpdateData({ headingNe: v })} /></div>
            <div>
              <Label>Max reviews shown</Label>
              <input
                type="number"
                min={1}
                max={20}
                value={d.maxCount as number}
                onChange={(e) => onUpdateData({ maxCount: parseInt(e.target.value) || 6 })}
                className="w-20 px-3 py-2 border-2 border-foreground/20 text-sm font-medium focus:border-primary-blue focus:outline-none"
              />
            </div>
          </>
        );

      case "faq": {
        const items = (section as FAQSection).data.items;
        return (
          <>
            <div><Label>Heading (EN)</Label><Input value={d.heading as string} onChange={(v) => onUpdateData({ heading: v })} /></div>
            <div><Label>Heading (NE)</Label><Input value={d.headingNe as string} onChange={(v) => onUpdateData({ headingNe: v })} /></div>
            <div>
              <Label>Questions</Label>
              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div key={item.id} className="border-2 border-foreground/10 p-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground/40">Q{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const newItems = items.filter((_, i) => i !== idx);
                          onUpdateData({ items: newItems });
                        }}
                        className="text-xs text-primary-red font-bold"
                      >
                        Remove
                      </button>
                    </div>
                    <Input
                      value={item.question}
                      onChange={(v) => {
                        const newItems = [...items];
                        newItems[idx] = { ...newItems[idx], question: v };
                        onUpdateData({ items: newItems });
                      }}
                      placeholder="Question (EN)"
                    />
                    <Input
                      value={item.questionNe}
                      onChange={(v) => {
                        const newItems = [...items];
                        newItems[idx] = { ...newItems[idx], questionNe: v };
                        onUpdateData({ items: newItems });
                      }}
                      placeholder="Question (NE)"
                    />
                    <Textarea
                      value={item.answer}
                      onChange={(v) => {
                        const newItems = [...items];
                        newItems[idx] = { ...newItems[idx], answer: v };
                        onUpdateData({ items: newItems });
                      }}
                      placeholder="Answer (EN)"
                      rows={2}
                    />
                    <Textarea
                      value={item.answerNe}
                      onChange={(v) => {
                        const newItems = [...items];
                        newItems[idx] = { ...newItems[idx], answerNe: v };
                        onUpdateData({ items: newItems });
                      }}
                      placeholder="Answer (NE)"
                      rows={2}
                    />
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  const newItem = {
                    id: `faq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                    question: "",
                    questionNe: "",
                    answer: "",
                    answerNe: "",
                  };
                  onUpdateData({ items: [...items, newItem] });
                }}
                className="mt-2 w-full py-2 text-sm font-bold border-2 border-dashed border-foreground/20 hover:border-primary-blue text-foreground/60 hover:text-primary-blue transition-colors"
              >
                + Add question
              </button>
            </div>
          </>
        );
      }

      case "booking":
      case "opd_schedule":
        return (
          <>
            <div><Label>Heading (EN)</Label><Input value={d.heading as string} onChange={(v) => onUpdateData({ heading: v })} /></div>
            <div><Label>Heading (NE)</Label><Input value={d.headingNe as string} onChange={(v) => onUpdateData({ headingNe: v })} /></div>
            <p className="text-xs text-foreground/40 italic">
              {section.type === "booking"
                ? "This section displays the booking widget from your clinic data."
                : "This section displays the OPD schedule from your clinic data."}
            </p>
          </>
        );

      case "map_embed":
        return (
          <>
            <div><Label>Heading (EN)</Label><Input value={d.heading as string} onChange={(v) => onUpdateData({ heading: v })} /></div>
            <div><Label>Heading (NE)</Label><Input value={d.headingNe as string} onChange={(v) => onUpdateData({ headingNe: v })} /></div>
            <div>
              <Label>Data source</Label>
              <div className="flex gap-2">
                {(["auto", "manual"] as const).map((src) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => onUpdateData({ source: src })}
                    className={`px-3 py-1.5 text-sm font-bold border-2 ${d.source === src ? "border-primary-blue bg-primary-blue text-white" : "border-foreground/20"}`}
                  >
                    {src === "auto" ? "Auto" : "Manual"}
                  </button>
                ))}
              </div>
            </div>
            {d.source === "manual" && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Latitude</Label>
                  <input
                    type="number"
                    step="any"
                    value={d.manualLat as number || ""}
                    onChange={(e) => onUpdateData({ manualLat: parseFloat(e.target.value) || null })}
                    className="w-full px-3 py-2 border-2 border-foreground/20 text-sm focus:border-primary-blue focus:outline-none"
                  />
                </div>
                <div>
                  <Label>Longitude</Label>
                  <input
                    type="number"
                    step="any"
                    value={d.manualLng as number || ""}
                    onChange={(e) => onUpdateData({ manualLng: parseFloat(e.target.value) || null })}
                    className="w-full px-3 py-2 border-2 border-foreground/20 text-sm focus:border-primary-blue focus:outline-none"
                  />
                </div>
              </div>
            )}
            <div>
              <Label>Height (px)</Label>
              <input
                type="number"
                min={200}
                max={800}
                value={d.height as number}
                onChange={(e) => onUpdateData({ height: parseInt(e.target.value) || 400 })}
                className="w-20 px-3 py-2 border-2 border-foreground/20 text-sm focus:border-primary-blue focus:outline-none"
              />
            </div>
          </>
        );

      case "divider":
        return (
          <>
            <div>
              <Label>Thickness</Label>
              <div className="flex gap-1">
                {([1, 2, 4] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onUpdateData({ thickness: t })}
                    className={`px-3 py-1.5 text-sm font-bold border-2 ${d.thickness === t ? "border-primary-blue bg-primary-blue text-white" : "border-foreground/20"}`}
                  >
                    {t}px
                  </button>
                ))}
              </div>
            </div>
            <ColorSwatches value={d.color as DesignToken} onChange={(v) => onUpdateData({ color: v })} label="Color" />
            <div>
              <Label>Width</Label>
              <div className="flex gap-1">
                {(["full", "half", "third"] as const).map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => onUpdateData({ width: w })}
                    className={`px-3 py-1.5 text-sm font-bold border-2 capitalize ${d.width === w ? "border-primary-blue bg-primary-blue text-white" : "border-foreground/20"}`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          </>
        );

      case "button": {
        const buttons = (section as ButtonSection).data.buttons;
        return (
          <>
            {/* Section-level controls */}
            <div>
              <Label>Size</Label>
              <div className="flex gap-1">
                {(["sm", "md", "lg"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onUpdateData({ size: s as ButtonSize })}
                    className={`px-3 py-1.5 text-sm font-bold border-2 uppercase ${d.size === s ? "border-primary-blue bg-primary-blue text-white" : "border-foreground/20"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Alignment</Label>
              <div className="flex gap-1">
                {(["left", "center", "right"] as const).map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => onUpdateData({ alignment: a as Alignment })}
                    className={`px-3 py-1.5 text-sm font-bold border-2 capitalize ${d.alignment === a ? "border-primary-blue bg-primary-blue text-white" : "border-foreground/20"}`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Gap</Label>
              <div className="flex gap-1">
                {(["sm", "md", "lg"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => onUpdateData({ gap: g as ButtonGap })}
                    className={`px-3 py-1.5 text-sm font-bold border-2 uppercase ${d.gap === g ? "border-primary-blue bg-primary-blue text-white" : "border-foreground/20"}`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Per-button controls */}
            <div>
              <Label>Buttons</Label>
              <div className="space-y-3">
                {buttons.map((btn, idx) => (
                  <div key={btn.id} className="border-2 border-foreground/10 p-2 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground/40">#{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = buttons.filter((_, i) => i !== idx);
                          onUpdateData({ buttons: updated });
                        }}
                        className="text-xs text-primary-red font-bold"
                      >
                        Remove
                      </button>
                    </div>
                    <Input
                      value={btn.label}
                      onChange={(v) => {
                        const updated = [...buttons];
                        updated[idx] = { ...updated[idx], label: v };
                        onUpdateData({ buttons: updated });
                      }}
                      placeholder="Label (EN)"
                    />
                    <Input
                      value={btn.labelNe}
                      onChange={(v) => {
                        const updated = [...buttons];
                        updated[idx] = { ...updated[idx], labelNe: v };
                        onUpdateData({ buttons: updated });
                      }}
                      placeholder="Label (NE)"
                    />
                    <Input
                      value={btn.href}
                      onChange={(v) => {
                        const updated = [...buttons];
                        updated[idx] = { ...updated[idx], href: v };
                        onUpdateData({ buttons: updated });
                      }}
                      placeholder="https://..."
                    />
                    <Toggle
                      checked={btn.openInNewTab}
                      onChange={(v) => {
                        const updated = [...buttons];
                        updated[idx] = { ...updated[idx], openInNewTab: v };
                        onUpdateData({ buttons: updated });
                      }}
                      label="New tab"
                    />
                    <div>
                      <span className="text-[10px] font-bold uppercase text-foreground/40">Style</span>
                      <div className="flex gap-1">
                        {(["solid", "outline", "pill"] as const).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => {
                              const updated = [...buttons];
                              updated[idx] = { ...updated[idx], style: s as ButtonStyle };
                              onUpdateData({ buttons: updated });
                            }}
                            className={`px-2 py-1 text-xs font-bold border-2 capitalize ${btn.style === s ? "border-primary-blue bg-primary-blue text-white" : "border-foreground/20"}`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                    <ColorSwatches
                      value={btn.color}
                      onChange={(v) => {
                        const updated = [...buttons];
                        updated[idx] = { ...updated[idx], color: v };
                        onUpdateData({ buttons: updated });
                      }}
                      label="Color"
                    />
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  const newBtn = {
                    id: `btn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                    label: "Button",
                    labelNe: "बटन",
                    href: "#",
                    openInNewTab: false,
                    color: "primary-blue" as DesignToken,
                    style: "solid" as ButtonStyle,
                  };
                  onUpdateData({ buttons: [...buttons, newBtn] });
                }}
                className="mt-2 w-full py-2 text-sm font-bold border-2 border-dashed border-foreground/20 hover:border-primary-blue text-foreground/60 hover:text-primary-blue transition-colors"
              >
                + Add button
              </button>
            </div>
          </>
        );
      }

      case "image":
        return (
          <>
            {(d.src as string | null) && (
              <div className="relative mb-2">
                <img src={d.src as string} alt="" className="w-full h-32 object-cover border-2 border-foreground/20" />
                <button
                  type="button"
                  onClick={() => onUpdateData({ src: null })}
                  className="absolute top-1 right-1 w-5 h-5 bg-primary-red text-white flex items-center justify-center text-xs font-bold"
                >
                  X
                </button>
              </div>
            )}
            {!(d.src as string | null) && (
              <div>
                <Label>Image</Label>
                <ImageBrowser lang={lang} onSelect={(url) => onUpdateData({ src: url })} />
              </div>
            )}
            <div><Label>Alt text (EN)</Label><Input value={d.alt as string} onChange={(v) => onUpdateData({ alt: v })} placeholder="Describe the image" /></div>
            <div><Label>Alt text (NE)</Label><Input value={d.altNe as string} onChange={(v) => onUpdateData({ altNe: v })} placeholder="तस्बिर वर्णन" /></div>
            <div><Label>Caption (EN)</Label><Input value={d.caption as string} onChange={(v) => onUpdateData({ caption: v })} /></div>
            <div><Label>Caption (NE)</Label><Input value={d.captionNe as string} onChange={(v) => onUpdateData({ captionNe: v })} /></div>
            <div><Label>Link URL (optional)</Label><Input value={d.href as string} onChange={(v) => onUpdateData({ href: v })} placeholder="https://..." /></div>
          </>
        );

      default:
        return null;
    }
  }

  return (
    <div className="w-80 flex-shrink-0 bg-white border-l-4 border-foreground overflow-y-auto h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b-2 border-foreground/10 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-foreground/60">
          {isNe ? "खण्ड सम्पादन" : "Edit Section"}
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
        {/* Anchor ID */}
        <div>
          <Label>Anchor ID</Label>
          <Input
            value={section.anchorId}
            onChange={(v) => onUpdate({ anchorId: v } as Partial<PageSection>)}
            placeholder="section-name"
          />
          <p className="text-xs text-foreground/40 mt-0.5">Used for #anchor links in navbar</p>
        </div>

        {/* Variant picker */}
        <VariantPicker
          sectionType={section.type}
          currentVariant={(section.data as Record<string, unknown>).variant as string || ""}
          onChange={(v) => {
            // For photo_gallery, sync variant to legacy layout field
            if (section.type === "photo_gallery") {
              const layoutVal = v === "masonry" ? "grid" : v as "grid" | "carousel";
              onUpdateData({ variant: v, layout: layoutVal });
            } else {
              onUpdateData({ variant: v });
            }
          }}
        />

        {/* Section-specific fields */}
        {renderDataFields()}

        {/* Style section */}
        <div className="border-t-2 border-foreground/10 pt-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-foreground/40 mb-3">
            {isNe ? "शैली" : "Style"}
          </h4>

          <div className="space-y-3">
            <ColorSwatches
              value={section.style.bgColor}
              onChange={(v) => updateStyle({ bgColor: v })}
              label="Background"
            />

            <ColorSwatches
              value={section.style.textColor}
              onChange={(v) => updateStyle({ textColor: v })}
              label="Text color"
            />

            <div>
              <Label>Padding</Label>
              <div className="flex gap-1">
                {PADDING_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateStyle({ padding: opt.value })}
                    className={`px-2 py-1 text-xs font-bold border-2 ${section.style.padding === opt.value ? "border-primary-blue bg-primary-blue text-white" : "border-foreground/20"}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Layout</Label>
              <div className="flex gap-1">
                {LAYOUT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateStyle({ layout: opt.value })}
                    className={`px-2 py-1 text-xs font-bold border-2 ${section.style.layout === opt.value ? "border-primary-blue bg-primary-blue text-white" : "border-foreground/20"}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Background image */}
            <div>
              <Label>Background Image</Label>
              {section.style.bgImage && (
                <div className="relative mb-2">
                  <img src={section.style.bgImage} alt="" className="w-full h-16 object-cover border-2 border-foreground/20" />
                  <button
                    type="button"
                    onClick={() => updateStyle({ bgImage: null })}
                    className="absolute top-1 right-1 w-5 h-5 bg-primary-red text-white flex items-center justify-center text-xs font-bold"
                  >
                    X
                  </button>
                </div>
              )}
              <ImageBrowser lang={lang} onSelect={(url) => updateStyle({ bgImage: url })} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
