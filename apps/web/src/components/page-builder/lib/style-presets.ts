// Style preset definitions for the page builder
// Each preset provides a set of Tailwind classes that renderers use
// instead of hardcoded Bauhaus-style classes.

export type StylePreset = "bauhaus" | "modern" | "minimal" | "warm";

export interface StylePresetClasses {
  border: string;
  shadow: string;
  radius: string;
  hoverShadow: string;
  cardClass: string;
  headingWeight: string;
  sectionDivider: string;
  navBorder: string;
  ctaClass: string;
  ctaHover: string;
}

export const STYLE_PRESETS: Record<StylePreset, StylePresetClasses> = {
  bauhaus: {
    border: "border-4 border-foreground",
    shadow: "shadow-[4px_4px_0_0_#121212]",
    radius: "",
    hoverShadow: "hover:shadow-[6px_6px_0_0_#121212]",
    cardClass: "border-4 border-foreground shadow-[4px_4px_0_0_#121212]",
    headingWeight: "font-bold",
    sectionDivider: "border-t-2 border-current/20",
    navBorder: "border-b-4 border-foreground",
    ctaClass: "border-4 border-foreground shadow-[4px_4px_0_0_#121212]",
    ctaHover: "hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#121212]",
  },
  modern: {
    border: "border border-foreground/10",
    shadow: "shadow-lg",
    radius: "rounded-xl",
    hoverShadow: "hover:shadow-xl",
    cardClass: "border border-foreground/10 shadow-lg rounded-xl",
    headingWeight: "font-semibold",
    sectionDivider: "border-t border-foreground/10",
    navBorder: "border-b border-foreground/10 shadow-sm",
    ctaClass: "border border-foreground/10 shadow-lg rounded-xl",
    ctaHover: "hover:-translate-y-0.5 hover:shadow-xl",
  },
  minimal: {
    border: "",
    shadow: "",
    radius: "rounded-md",
    hoverShadow: "",
    cardClass: "bg-white/50 rounded-md",
    headingWeight: "font-medium",
    sectionDivider: "",
    navBorder: "border-b border-foreground/5",
    ctaClass: "rounded-md bg-foreground/5",
    ctaHover: "hover:bg-foreground/10",
  },
  warm: {
    border: "border-2 border-amber-200",
    shadow: "shadow-md shadow-amber-100",
    radius: "rounded-lg",
    hoverShadow: "hover:shadow-lg",
    cardClass: "border-2 border-amber-200 shadow-md rounded-lg bg-amber-50/30",
    headingWeight: "font-bold",
    sectionDivider: "border-t border-amber-200",
    navBorder: "border-b-2 border-amber-200",
    ctaClass: "border-2 border-amber-200 shadow-md rounded-lg",
    ctaHover: "hover:-translate-y-0.5 hover:shadow-lg",
  },
};

export const STYLE_PRESET_INFO: Array<{ value: StylePreset; label: string; labelNe: string; description: string }> = [
  { value: "bauhaus", label: "Bauhaus", labelNe: "बाउहाउस", description: "Bold borders, hard shadows, geometric" },
  { value: "modern", label: "Modern", labelNe: "आधुनिक", description: "Soft shadows, rounded corners, clean" },
  { value: "minimal", label: "Minimal", labelNe: "न्यूनतम", description: "No borders, no shadows, content-focused" },
  { value: "warm", label: "Warm", labelNe: "न्यानो", description: "Amber tones, medium shadows, inviting" },
];
