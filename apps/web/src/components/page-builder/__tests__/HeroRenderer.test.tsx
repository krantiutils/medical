import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeroRenderer } from "../sections/HeroRenderer";
import { createHeroSection } from "../lib/section-defaults";
import { STYLE_PRESETS } from "../lib/style-presets";

describe("HeroRenderer", () => {
  const defaultSection = createHeroSection();

  it("renders heading in English", () => {
    render(<HeroRenderer section={defaultSection} lang="en" />);
    expect(screen.getByText(defaultSection.data.heading)).toBeInTheDocument();
  });

  it("renders heading in Nepali when lang=ne", () => {
    render(<HeroRenderer section={defaultSection} lang="ne" />);
    expect(screen.getByText(defaultSection.data.headingNe)).toBeInTheDocument();
  });

  it("renders subtitle", () => {
    render(<HeroRenderer section={defaultSection} lang="en" />);
    expect(screen.getByText(defaultSection.data.subtitle)).toBeInTheDocument();
  });

  it("renders clinic logo when showLogo=true and clinicLogo provided", () => {
    render(
      <HeroRenderer
        section={defaultSection}
        lang="en"
        clinicLogo="https://example.com/logo.png"
        clinicName="Test Clinic"
      />,
    );
    const img = screen.getByAltText("Test Clinic");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "https://example.com/logo.png");
  });

  it("renders clinic name initial when no logo URL but showLogo=true", () => {
    render(
      <HeroRenderer section={defaultSection} lang="en" clinicName="Test Clinic" />,
    );
    expect(screen.getByText("T")).toBeInTheDocument();
  });

  it("does not render logo when showLogo=false", () => {
    const section = createHeroSection({ showLogo: false });
    render(
      <HeroRenderer
        section={section}
        lang="en"
        clinicLogo="https://example.com/logo.png"
        clinicName="Test Clinic"
      />,
    );
    expect(screen.queryByAltText("Test Clinic")).not.toBeInTheDocument();
  });

  it("applies modern preset classes", () => {
    const { container } = render(
      <HeroRenderer section={defaultSection} lang="en" preset={STYLE_PRESETS.modern} />,
    );
    const heading = screen.getByText(defaultSection.data.heading);
    expect(heading.className).toContain("font-semibold");
  });

  it("falls back to bauhaus when no preset given", () => {
    render(<HeroRenderer section={defaultSection} lang="en" />);
    const heading = screen.getByText(defaultSection.data.heading);
    expect(heading.className).toContain("font-bold");
  });
});
