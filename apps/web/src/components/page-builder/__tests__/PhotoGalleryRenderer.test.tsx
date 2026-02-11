import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PhotoGalleryRenderer } from "../sections/PhotoGalleryRenderer";
import { createPhotoGallerySection } from "../lib/section-defaults";
import { STYLE_PRESETS } from "../lib/style-presets";

describe("PhotoGalleryRenderer", () => {
  const defaultSection = createPhotoGallerySection();

  it("renders heading", () => {
    render(<PhotoGalleryRenderer section={defaultSection} lang="en" />);
    expect(screen.getByText(defaultSection.data.heading)).toBeInTheDocument();
  });

  it("shows empty state when no photos and auto source", () => {
    render(<PhotoGalleryRenderer section={defaultSection} lang="en" clinicPhotos={[]} />);
    expect(screen.getByText("No photos yet")).toBeInTheDocument();
  });

  it("renders auto-sourced photos from clinic data", () => {
    const photos = ["https://example.com/1.jpg", "https://example.com/2.jpg"];
    const { container } = render(
      <PhotoGalleryRenderer section={defaultSection} lang="en" clinicPhotos={photos} />,
    );
    const images = container.querySelectorAll("img");
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute("src", "https://example.com/1.jpg");
    expect(images[1]).toHaveAttribute("src", "https://example.com/2.jpg");
  });

  it("renders manual photos when source=manual", () => {
    const section = createPhotoGallerySection({
      source: "manual",
      manualPhotos: [
        { id: "p1", url: "https://example.com/manual.jpg", caption: "Reception", captionNe: "स्वागतकक्ष" },
      ],
    });
    render(<PhotoGalleryRenderer section={section} lang="en" />);
    expect(screen.getByText("Reception")).toBeInTheDocument();
    const img = screen.getByAltText("Reception");
    expect(img).toHaveAttribute("src", "https://example.com/manual.jpg");
  });

  it("renders Nepali captions when lang=ne", () => {
    const section = createPhotoGallerySection({
      source: "manual",
      manualPhotos: [
        { id: "p1", url: "https://example.com/1.jpg", caption: "Reception", captionNe: "स्वागतकक्ष" },
      ],
    });
    render(<PhotoGalleryRenderer section={section} lang="ne" />);
    expect(screen.getByText("स्वागतकक्ष")).toBeInTheDocument();
  });

  it("applies 2-column grid class", () => {
    const section = createPhotoGallerySection({ columns: 2 });
    const { container } = render(
      <PhotoGalleryRenderer section={section} lang="en" clinicPhotos={["https://example.com/1.jpg"]} />,
    );
    const grid = container.querySelector(".sm\\:grid-cols-2");
    expect(grid).toBeInTheDocument();
  });

  it("applies 4-column grid class", () => {
    const section = createPhotoGallerySection({ columns: 4 });
    const { container } = render(
      <PhotoGalleryRenderer section={section} lang="en" clinicPhotos={["https://example.com/1.jpg"]} />,
    );
    const grid = container.querySelector(".sm\\:grid-cols-4");
    expect(grid).toBeInTheDocument();
  });

  it("applies preset border and shadow classes", () => {
    const section = createPhotoGallerySection({
      source: "manual",
      manualPhotos: [
        { id: "p1", url: "https://example.com/1.jpg", caption: "", captionNe: "" },
      ],
    });
    const { container } = render(
      <PhotoGalleryRenderer section={section} lang="en" preset={STYLE_PRESETS.modern} />,
    );
    const card = container.querySelector(".rounded-xl");
    expect(card).toBeInTheDocument();
  });
});
