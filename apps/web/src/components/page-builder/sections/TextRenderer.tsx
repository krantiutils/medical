import type { TextSection } from "@/types/page-builder";
import { DESIGN_TOKEN_BG, DESIGN_TOKEN_TEXT, PADDING_SIZE, LAYOUT_WIDTH } from "@/types/page-builder";
import { renderMarkdown } from "../lib/render-markdown";
import type { StylePresetClasses } from "../lib/style-presets";

interface TextRendererProps {
  section: TextSection;
  lang: string;
  preset?: StylePresetClasses;
}

/**
 * Render body content: if it starts with '<' it's HTML from TipTap,
 * otherwise treat as legacy markdown.
 * Content is authored by authenticated clinic owners via TipTap's
 * constrained editor, not arbitrary user input.
 */
function renderBody(body: string): string {
  if (!body || !body.trim()) return "";
  const trimmed = body.trim();
  if (trimmed.startsWith("<")) {
    return trimmed;
  }
  return renderMarkdown(body);
}

export function TextRenderer({ section, lang, preset }: TextRendererProps) {
  const isNe = lang === "ne";
  const { data, style } = section;
  const heading = isNe ? data.headingNe || data.heading : data.heading;
  const body = isNe ? data.bodyNe || data.body : data.body;
  const html = renderBody(body);

  const headingWeight = preset?.headingWeight || "font-bold";
  const divider = preset?.sectionDivider || "border-t-2 border-current/20";

  return (
    <div className={`${DESIGN_TOKEN_BG[style.bgColor]} ${DESIGN_TOKEN_TEXT[style.textColor]} ${PADDING_SIZE[style.padding]}`}>
      <div className={LAYOUT_WIDTH[style.layout]}>
        {heading && (
          <>
            <h2 className={`text-3xl ${headingWeight} mb-4`}>{heading}</h2>
            <div className={`${divider} mb-6`} />
          </>
        )}
        {html && (
          <div
            className="prose prose-lg max-w-none [&_a]:text-primary-blue [&_a]:underline [&_strong]:font-bold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:mt-4 [&_h3]:mb-2 [&_img]:max-w-full [&_img]:h-auto"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
      </div>
    </div>
  );
}
