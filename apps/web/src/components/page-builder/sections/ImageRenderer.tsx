import type { ImageSection } from "@/types/page-builder";
import { DESIGN_TOKEN_BG, DESIGN_TOKEN_TEXT, PADDING_SIZE, LAYOUT_WIDTH } from "@/types/page-builder";
import type { StylePresetClasses } from "../lib/style-presets";

interface ImageRendererProps {
  section: ImageSection;
  lang: string;
  preset?: StylePresetClasses;
}

export function ImageRenderer({ section, lang, preset }: ImageRendererProps) {
  const isNe = lang === "ne";
  const { data, style } = section;
  const alt = isNe ? data.altNe || data.alt : data.alt;
  const caption = isNe ? data.captionNe || data.caption : data.caption;
  const variant = data.variant || "standard";

  if (!data.src) {
    return (
      <div className={`${DESIGN_TOKEN_BG[style.bgColor]} ${DESIGN_TOKEN_TEXT[style.textColor]} ${PADDING_SIZE[style.padding]}`}>
        <div className={LAYOUT_WIDTH[style.layout]}>
          <div className="border-2 border-dashed border-foreground/20 py-12 text-center text-foreground/40 text-sm">
            No image selected
          </div>
        </div>
      </div>
    );
  }

  let imgClasses = "max-w-full h-auto";
  switch (variant) {
    case "rounded":
      imgClasses += " rounded-xl";
      break;
    case "shadow":
      imgClasses += " shadow-lg";
      if (preset?.border) {
        imgClasses += ` ${preset.border} ${preset.shadow}`;
      } else {
        imgClasses += " border-2 border-foreground shadow-[4px_4px_0_0_#121212]";
      }
      break;
  }

  const img = <img src={data.src} alt={alt || ""} className={imgClasses} />;

  const wrapped = data.href ? (
    <a href={data.href} target="_blank" rel="noopener noreferrer" className="inline-block">
      {img}
    </a>
  ) : img;

  return (
    <div className={`${DESIGN_TOKEN_BG[style.bgColor]} ${DESIGN_TOKEN_TEXT[style.textColor]} ${PADDING_SIZE[style.padding]}`}>
      <div className={LAYOUT_WIDTH[style.layout]}>
        <figure>
          {wrapped}
          {caption && (
            <figcaption className="mt-2 text-sm text-foreground/60 italic">
              {caption}
            </figcaption>
          )}
        </figure>
      </div>
    </div>
  );
}
