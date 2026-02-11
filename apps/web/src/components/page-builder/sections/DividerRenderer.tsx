import type { DividerSection, DesignToken } from "@/types/page-builder";
import { DESIGN_TOKEN_BG, PADDING_SIZE } from "@/types/page-builder";

interface DividerRendererProps {
  section: DividerSection;
}

const DIVIDER_BG: Record<DesignToken, string> = {
  "white": "bg-white",
  "background": "bg-background",
  "primary-blue": "bg-primary-blue",
  "primary-red": "bg-primary-red",
  "primary-yellow": "bg-primary-yellow",
  "foreground": "bg-foreground",
  "muted": "bg-muted",
};

export function DividerRenderer({ section }: DividerRendererProps) {
  const { data, style } = section;
  const variant = data.variant || "line";

  if (variant === "space") {
    return (
      <div className={`${DESIGN_TOKEN_BG[style.bgColor]} ${PADDING_SIZE[style.padding]}`} />
    );
  }

  if (variant === "dots") {
    return (
      <div className={`${DESIGN_TOKEN_BG[style.bgColor]} ${PADDING_SIZE[style.padding]}`}>
        <div className="max-w-4xl mx-auto px-4 flex justify-center gap-3">
          <span className={`w-2 h-2 rounded-full ${DIVIDER_BG[data.color]}`} />
          <span className={`w-2 h-2 rounded-full ${DIVIDER_BG[data.color]}`} />
          <span className={`w-2 h-2 rounded-full ${DIVIDER_BG[data.color]}`} />
        </div>
      </div>
    );
  }

  // Default: line
  const widthClass = data.width === "half" ? "w-1/2" :
                      data.width === "third" ? "w-1/3" :
                      "w-full";

  const heightClass = data.thickness === 1 ? "h-px" :
                       data.thickness === 4 ? "h-1" :
                       "h-0.5";

  return (
    <div className={`${DESIGN_TOKEN_BG[style.bgColor]} ${PADDING_SIZE[style.padding]}`}>
      <div className="max-w-4xl mx-auto px-4 flex justify-center">
        <div className={`${widthClass} ${heightClass} ${DIVIDER_BG[data.color]}`} />
      </div>
    </div>
  );
}
