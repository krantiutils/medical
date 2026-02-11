import type { ButtonSection, ButtonItem } from "@/types/page-builder";
import { DESIGN_TOKEN_BG, DESIGN_TOKEN_TEXT, PADDING_SIZE, LAYOUT_WIDTH } from "@/types/page-builder";
import type { StylePresetClasses } from "../lib/style-presets";

interface ButtonRendererProps {
  section: ButtonSection;
  lang: string;
  preset?: StylePresetClasses;
}

const SIZE_CLASSES: Record<string, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};

const GAP_CLASSES: Record<string, string> = {
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6",
};

const ALIGN_CLASSES: Record<string, string> = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
};

const ITEMS_ALIGN_CLASSES: Record<string, string> = {
  left: "items-start",
  center: "items-center",
  right: "items-end",
};

const BG_CLASS: Record<string, string> = {
  "white": "bg-white",
  "background": "bg-background",
  "primary-blue": "bg-primary-blue",
  "primary-red": "bg-primary-red",
  "primary-yellow": "bg-primary-yellow",
  "foreground": "bg-foreground",
  "muted": "bg-muted",
};

const BORDER_CLASS: Record<string, string> = {
  "white": "border-white text-white",
  "background": "border-background text-background",
  "primary-blue": "border-primary-blue text-primary-blue",
  "primary-red": "border-primary-red text-primary-red",
  "primary-yellow": "border-primary-yellow text-primary-yellow",
  "foreground": "border-foreground text-foreground",
  "muted": "border-muted text-muted",
};

function getTextColorForBg(color: string): string {
  if (color === "white" || color === "background" || color === "muted" || color === "primary-yellow") {
    return "text-foreground";
  }
  return "text-white";
}

function getButtonClasses(btn: ButtonItem, size: string, preset?: StylePresetClasses): string {
  let classes = `${size} font-bold transition-colors inline-block`;
  const btnStyle = btn.style || "solid";

  switch (btnStyle) {
    case "solid":
      classes += ` ${BG_CLASS[btn.color] || BG_CLASS["primary-blue"]} ${getTextColorForBg(btn.color)}`;
      if (preset?.border) {
        classes += ` ${preset.border} ${preset.shadow} ${preset.radius}`;
      } else {
        classes += " border-2 border-foreground shadow-[2px_2px_0_0_#121212]";
      }
      break;
    case "outline":
      classes += ` bg-transparent border-2 ${BORDER_CLASS[btn.color] || BORDER_CLASS["primary-blue"]} hover:opacity-80`;
      if (preset?.radius) classes += ` ${preset.radius}`;
      break;
    case "pill":
      classes += ` ${BG_CLASS[btn.color] || BG_CLASS["primary-blue"]} ${getTextColorForBg(btn.color)} rounded-full`;
      break;
  }

  return classes;
}

export function ButtonRenderer({ section, lang, preset }: ButtonRendererProps) {
  const isNe = lang === "ne";
  const { data, style } = section;
  const variant = data.variant || "row";
  const size = SIZE_CLASSES[data.size] || SIZE_CLASSES.md;
  const gap = GAP_CLASSES[data.gap] || GAP_CLASSES.md;
  const align = ALIGN_CLASSES[data.alignment] || ALIGN_CLASSES.center;
  const buttons = data.buttons || [];

  if (buttons.length === 0) return null;

  let containerClasses = "flex flex-wrap";
  switch (variant) {
    case "row":
      containerClasses += ` ${align} ${gap}`;
      break;
    case "stack":
      containerClasses = `flex flex-col ${ITEMS_ALIGN_CLASSES[data.alignment] || ITEMS_ALIGN_CLASSES.center} ${gap}`;
      break;
    case "spread":
      containerClasses += ` justify-between ${gap}`;
      break;
  }

  return (
    <div className={`${DESIGN_TOKEN_BG[style.bgColor]} ${DESIGN_TOKEN_TEXT[style.textColor]} ${PADDING_SIZE[style.padding]}`}>
      <div className={LAYOUT_WIDTH[style.layout]}>
        <div className={containerClasses}>
          {buttons.map((btn) => {
            const label = isNe ? btn.labelNe || btn.label : btn.label;
            return (
              <a
                key={btn.id}
                href={btn.href || "#"}
                target={btn.openInNewTab ? "_blank" : undefined}
                rel={btn.openInNewTab ? "noopener noreferrer" : undefined}
                className={getButtonClasses(btn, size, preset)}
              >
                {label || "Button"}
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
