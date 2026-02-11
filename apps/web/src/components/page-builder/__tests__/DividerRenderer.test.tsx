import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { DividerRenderer } from "../sections/DividerRenderer";
import { createDividerSection } from "../lib/section-defaults";

describe("DividerRenderer", () => {
  it("renders without crashing", () => {
    const section = createDividerSection();
    const { container } = render(<DividerRenderer section={section} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("renders full width by default", () => {
    const section = createDividerSection();
    const { container } = render(<DividerRenderer section={section} />);
    const divider = container.querySelector(".w-full");
    expect(divider).toBeInTheDocument();
  });

  it("renders half width when specified", () => {
    const section = createDividerSection();
    section.data.width = "half";
    const { container } = render(<DividerRenderer section={section} />);
    const divider = container.querySelector(".w-1\\/2");
    expect(divider).toBeInTheDocument();
  });

  it("renders third width when specified", () => {
    const section = createDividerSection();
    section.data.width = "third";
    const { container } = render(<DividerRenderer section={section} />);
    const divider = container.querySelector(".w-1\\/3");
    expect(divider).toBeInTheDocument();
  });

  it("renders thin line for thickness=1", () => {
    const section = createDividerSection();
    section.data.thickness = 1;
    const { container } = render(<DividerRenderer section={section} />);
    const divider = container.querySelector(".h-px");
    expect(divider).toBeInTheDocument();
  });

  it("renders medium line for thickness=2", () => {
    const section = createDividerSection();
    section.data.thickness = 2;
    const { container } = render(<DividerRenderer section={section} />);
    const divider = container.querySelector(".h-0\\.5");
    expect(divider).toBeInTheDocument();
  });

  it("renders thick line for thickness=4", () => {
    const section = createDividerSection();
    section.data.thickness = 4;
    const { container } = render(<DividerRenderer section={section} />);
    const divider = container.querySelector(".h-1");
    expect(divider).toBeInTheDocument();
  });

  it("applies the correct color class", () => {
    const section = createDividerSection();
    section.data.color = "primary-blue";
    const { container } = render(<DividerRenderer section={section} />);
    const divider = container.querySelector(".bg-primary-blue");
    expect(divider).toBeInTheDocument();
  });
});
