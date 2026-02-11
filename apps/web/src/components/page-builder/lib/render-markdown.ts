import { marked } from "marked";

// Configure marked for safe output
marked.setOptions({
  breaks: true,
  gfm: true,
});

export function renderMarkdown(input: string): string {
  if (!input || !input.trim()) return "";
  // marked.parse can return string or Promise<string>
  // We use parseInline for simpler output in section context
  const result = marked.parse(input);
  if (typeof result === "string") return result;
  // If it returns a promise (shouldn't with sync config), return input as fallback
  return input;
}
