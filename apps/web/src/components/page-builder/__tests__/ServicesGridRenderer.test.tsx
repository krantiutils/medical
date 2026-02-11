import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ServicesGridRenderer } from "../sections/ServicesGridRenderer";
import { createServicesGridSection } from "../lib/section-defaults";
import { STYLE_PRESETS } from "../lib/style-presets";

describe("ServicesGridRenderer", () => {
  it("renders heading", () => {
    const section = createServicesGridSection();
    render(<ServicesGridRenderer section={section} lang="en" />);
    expect(screen.getByText(section.data.heading)).toBeInTheDocument();
  });

  it("shows empty state when no services and auto source", () => {
    const section = createServicesGridSection();
    render(<ServicesGridRenderer section={section} lang="en" clinicServices={[]} />);
    expect(screen.getByText("No services added yet")).toBeInTheDocument();
  });

  it("renders auto-sourced services from clinic data", () => {
    const section = createServicesGridSection();
    render(<ServicesGridRenderer section={section} lang="en" clinicServices={["general", "lab"]} />);
    expect(screen.getByText("General Consultation")).toBeInTheDocument();
    expect(screen.getByText("Lab Tests")).toBeInTheDocument();
  });

  it("renders raw service name when not in PREDEFINED_SERVICES", () => {
    const section = createServicesGridSection();
    render(<ServicesGridRenderer section={section} lang="en" clinicServices={["custom-service"]} />);
    expect(screen.getByText("custom-service")).toBeInTheDocument();
  });

  it("renders Nepali service names when lang=ne", () => {
    const section = createServicesGridSection();
    render(<ServicesGridRenderer section={section} lang="ne" clinicServices={["general"]} />);
    expect(screen.getByText("सामान्य परामर्श")).toBeInTheDocument();
  });

  it("renders manual services when source=manual", () => {
    const section = createServicesGridSection({
      source: "manual",
      manualServices: [
        { id: "svc-1", name: "Dental Cleaning", nameNe: "दाँत सफाई", description: "Professional cleaning", descriptionNe: "", icon: "" },
      ],
    });
    render(<ServicesGridRenderer section={section} lang="en" />);
    expect(screen.getByText("Dental Cleaning")).toBeInTheDocument();
    expect(screen.getByText("Professional cleaning")).toBeInTheDocument();
  });

  it("applies preset card class", () => {
    const section = createServicesGridSection({
      source: "manual",
      manualServices: [
        { id: "svc-1", name: "Test", nameNe: "", description: "", descriptionNe: "", icon: "" },
      ],
    });
    const { container } = render(
      <ServicesGridRenderer section={section} lang="en" preset={STYLE_PRESETS.modern} />,
    );
    // Modern preset uses rounded-xl
    const card = container.querySelector(".rounded-xl");
    expect(card).toBeInTheDocument();
  });
});
