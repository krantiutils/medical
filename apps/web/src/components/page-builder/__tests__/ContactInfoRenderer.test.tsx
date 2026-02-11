import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ContactInfoRenderer } from "../sections/ContactInfoRenderer";
import { createContactInfoSection } from "../lib/section-defaults";
import { STYLE_PRESETS } from "../lib/style-presets";

const mockClinic = {
  phone: "+977-1-4444444",
  email: "info@clinic.com",
  address: "Kathmandu, Nepal",
  website: "https://clinic.com",
  timings: {
    sunday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
    monday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
    tuesday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
    wednesday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
    thursday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
    friday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
    saturday: { isOpen: false, openTime: "", closeTime: "" },
  },
};

describe("ContactInfoRenderer", () => {
  const defaultSection = createContactInfoSection();

  it("renders heading", () => {
    render(<ContactInfoRenderer section={defaultSection} lang="en" clinic={mockClinic} />);
    expect(screen.getByText(defaultSection.data.heading)).toBeInTheDocument();
  });

  it("renders phone number with tel: link", () => {
    render(<ContactInfoRenderer section={defaultSection} lang="en" clinic={mockClinic} />);
    const phone = screen.getByText("+977-1-4444444");
    expect(phone.closest("a")).toHaveAttribute("href", "tel:+977-1-4444444");
  });

  it("renders email with mailto: link", () => {
    render(<ContactInfoRenderer section={defaultSection} lang="en" clinic={mockClinic} />);
    const email = screen.getByText("info@clinic.com");
    expect(email.closest("a")).toHaveAttribute("href", "mailto:info@clinic.com");
  });

  it("renders address", () => {
    render(<ContactInfoRenderer section={defaultSection} lang="en" clinic={mockClinic} />);
    expect(screen.getByText("Kathmandu, Nepal")).toBeInTheDocument();
  });

  it("renders website with external link", () => {
    render(<ContactInfoRenderer section={defaultSection} lang="en" clinic={mockClinic} />);
    const website = screen.getByText("https://clinic.com");
    const link = website.closest("a");
    expect(link).toHaveAttribute("href", "https://clinic.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("hides phone when showPhone=false", () => {
    const section = createContactInfoSection({ showPhone: false });
    render(<ContactInfoRenderer section={section} lang="en" clinic={mockClinic} />);
    expect(screen.queryByText("+977-1-4444444")).not.toBeInTheDocument();
  });

  it("hides email when showEmail=false", () => {
    const section = createContactInfoSection({ showEmail: false });
    render(<ContactInfoRenderer section={section} lang="en" clinic={mockClinic} />);
    expect(screen.queryByText("info@clinic.com")).not.toBeInTheDocument();
  });

  it("hides address when showAddress=false", () => {
    const section = createContactInfoSection({ showAddress: false });
    render(<ContactInfoRenderer section={section} lang="en" clinic={mockClinic} />);
    expect(screen.queryByText("Kathmandu, Nepal")).not.toBeInTheDocument();
  });

  it("renders operating hours when showHours=true", () => {
    render(<ContactInfoRenderer section={defaultSection} lang="en" clinic={mockClinic} />);
    expect(screen.getByText("Operating Hours")).toBeInTheDocument();
    expect(screen.getByText("Sunday")).toBeInTheDocument();
    // Multiple days show the same time range
    const timeTexts = screen.getAllByText("09:00 - 17:00");
    expect(timeTexts.length).toBe(6); // Sun-Fri
    expect(screen.getByText("Closed")).toBeInTheDocument(); // Saturday
  });

  it("renders Nepali day names when lang=ne", () => {
    render(<ContactInfoRenderer section={defaultSection} lang="ne" clinic={mockClinic} />);
    expect(screen.getByText("आइतबार")).toBeInTheDocument();
    expect(screen.getByText("खुल्ने समय")).toBeInTheDocument();
  });

  it("handles null clinic data gracefully", () => {
    render(<ContactInfoRenderer section={defaultSection} lang="en" />);
    // Should render without crashing, no contact info shown
    expect(screen.getByText(defaultSection.data.heading)).toBeInTheDocument();
    expect(screen.queryByText("+977-1-4444444")).not.toBeInTheDocument();
  });

  it("applies preset heading weight", () => {
    render(
      <ContactInfoRenderer
        section={defaultSection}
        lang="en"
        clinic={mockClinic}
        preset={STYLE_PRESETS.minimal}
      />,
    );
    const heading = screen.getByText(defaultSection.data.heading);
    expect(heading.className).toContain("font-medium");
  });
});
