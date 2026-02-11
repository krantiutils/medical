import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DoctorShowcaseRenderer } from "../sections/DoctorShowcaseRenderer";
import { createDoctorShowcaseSection } from "../lib/section-defaults";
import { STYLE_PRESETS } from "../lib/style-presets";

const mockDoctors = [
  {
    id: "doc-1",
    full_name: "Ram Sharma",
    type: "DOCTOR",
    photo_url: "https://example.com/ram.jpg",
    specialties: ["Cardiology"],
    degree: "MBBS, MD",
    role: "Senior Consultant",
  },
  {
    id: "doc-2",
    full_name: "Sita Thapa",
    type: "DENTIST",
    photo_url: null,
    specialties: ["Orthodontics"],
    degree: "BDS",
    role: null,
  },
  {
    id: "doc-3",
    full_name: "Hari Pharmacist",
    type: "PHARMACIST",
    photo_url: null,
    specialties: [],
    degree: null,
    role: null,
  },
];

describe("DoctorShowcaseRenderer", () => {
  const defaultSection = createDoctorShowcaseSection();

  it("renders heading", () => {
    render(<DoctorShowcaseRenderer section={defaultSection} lang="en" doctors={mockDoctors} />);
    expect(screen.getByText(defaultSection.data.heading)).toBeInTheDocument();
  });

  it("shows empty state when no doctors", () => {
    render(<DoctorShowcaseRenderer section={defaultSection} lang="en" doctors={[]} />);
    expect(screen.getByText("No doctors affiliated yet")).toBeInTheDocument();
  });

  it("prepends Dr. to DOCTOR type names", () => {
    render(<DoctorShowcaseRenderer section={defaultSection} lang="en" doctors={mockDoctors} />);
    expect(screen.getByText("Dr. Ram Sharma")).toBeInTheDocument();
  });

  it("prepends Dr. to DENTIST type names", () => {
    render(<DoctorShowcaseRenderer section={defaultSection} lang="en" doctors={mockDoctors} />);
    expect(screen.getByText("Dr. Sita Thapa")).toBeInTheDocument();
  });

  it("does NOT prepend Dr. to PHARMACIST type", () => {
    render(<DoctorShowcaseRenderer section={defaultSection} lang="en" doctors={mockDoctors} />);
    expect(screen.getByText("Hari Pharmacist")).toBeInTheDocument();
  });

  it("does not double Dr. prefix when name already starts with Dr.", () => {
    const doctorsWithPrefix = [
      { id: "doc-4", full_name: "Dr. Amit Joshi", type: "DOCTOR", photo_url: null, specialties: [], degree: null, role: null },
    ];
    render(<DoctorShowcaseRenderer section={defaultSection} lang="en" doctors={doctorsWithPrefix} />);
    expect(screen.getByText("Dr. Amit Joshi")).toBeInTheDocument();
    expect(screen.queryByText("Dr. Dr. Amit Joshi")).not.toBeInTheDocument();
  });

  it("shows specialty when showSpecialty=true", () => {
    render(<DoctorShowcaseRenderer section={defaultSection} lang="en" doctors={mockDoctors} />);
    expect(screen.getByText("Cardiology")).toBeInTheDocument();
  });

  it("hides specialty when showSpecialty=false", () => {
    const section = createDoctorShowcaseSection({ showSpecialty: false });
    render(<DoctorShowcaseRenderer section={section} lang="en" doctors={mockDoctors} />);
    expect(screen.queryByText("Cardiology")).not.toBeInTheDocument();
  });

  it("shows degree when showDegree=true", () => {
    render(<DoctorShowcaseRenderer section={defaultSection} lang="en" doctors={mockDoctors} />);
    expect(screen.getByText("MBBS, MD")).toBeInTheDocument();
  });

  it("shows role when showRole=true", () => {
    render(<DoctorShowcaseRenderer section={defaultSection} lang="en" doctors={mockDoctors} />);
    expect(screen.getByText("Senior Consultant")).toBeInTheDocument();
  });

  it("renders doctor photo when available", () => {
    render(<DoctorShowcaseRenderer section={defaultSection} lang="en" doctors={mockDoctors} />);
    const img = screen.getByAltText("Dr. Ram Sharma");
    expect(img).toHaveAttribute("src", "https://example.com/ram.jpg");
  });

  it("renders initial letter when no photo", () => {
    render(<DoctorShowcaseRenderer section={defaultSection} lang="en" doctors={mockDoctors} />);
    // Sita Thapa has no photo, should show "S"
    expect(screen.getByText("S")).toBeInTheDocument();
  });

  it("renders type badges with correct colors", () => {
    const { container } = render(
      <DoctorShowcaseRenderer section={defaultSection} lang="en" doctors={mockDoctors} />,
    );
    // Check that DOCTOR, DENTIST, PHARMACIST badges exist
    expect(screen.getByText("DOCTOR")).toBeInTheDocument();
    expect(screen.getByText("DENTIST")).toBeInTheDocument();
    expect(screen.getByText("PHARMACIST")).toBeInTheDocument();

    // Verify color classes
    const doctorBadge = screen.getByText("DOCTOR");
    expect(doctorBadge.className).toContain("bg-primary-blue");

    const dentistBadge = screen.getByText("DENTIST");
    expect(dentistBadge.className).toContain("bg-primary-red");

    const pharmacistBadge = screen.getByText("PHARMACIST");
    expect(pharmacistBadge.className).toContain("bg-primary-yellow");
  });

  it("applies preset card classes", () => {
    const { container } = render(
      <DoctorShowcaseRenderer
        section={defaultSection}
        lang="en"
        doctors={mockDoctors}
        preset={STYLE_PRESETS.warm}
      />,
    );
    // Warm preset uses border-amber-200
    const card = container.querySelector(".border-amber-200");
    expect(card).toBeInTheDocument();
  });
});
