import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TextRenderer } from "../sections/TextRenderer";
import { createTextSection } from "../lib/section-defaults";
import { STYLE_PRESETS } from "../lib/style-presets";

describe("TextRenderer", () => {
  const defaultSection = createTextSection();

  it("renders heading in English", () => {
    render(<TextRenderer section={defaultSection} lang="en" />);
    expect(screen.getByText(defaultSection.data.heading)).toBeInTheDocument();
  });

  it("renders heading in Nepali when lang=ne", () => {
    render(<TextRenderer section={defaultSection} lang="ne" />);
    expect(screen.getByText(defaultSection.data.headingNe)).toBeInTheDocument();
  });

  it("renders markdown body content", () => {
    const section = createTextSection({ body: "Hello **world**", bodyNe: "" });
    const { container } = render(<TextRenderer section={section} lang="en" />);
    // marked converts **world** to <strong>world</strong>
    const strong = container.querySelector("strong");
    expect(strong).toBeInTheDocument();
    expect(strong?.textContent).toBe("world");
  });

  it("does not render heading when empty", () => {
    const section = createTextSection({ heading: "", headingNe: "" });
    const { container } = render(<TextRenderer section={section} lang="en" />);
    expect(container.querySelector("h2")).not.toBeInTheDocument();
  });

  it("does not render body when empty", () => {
    const section = createTextSection({ body: "", bodyNe: "" });
    const { container } = render(<TextRenderer section={section} lang="en" />);
    // Should not have prose div with content
    const prose = container.querySelector(".prose");
    expect(prose).not.toBeInTheDocument();
  });

  it("applies preset heading weight", () => {
    render(<TextRenderer section={defaultSection} lang="en" preset={STYLE_PRESETS.minimal} />);
    const heading = screen.getByText(defaultSection.data.heading);
    expect(heading.className).toContain("font-medium");
  });
});
