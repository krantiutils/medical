"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import type { PhotoGallerySection } from "@/types/page-builder";
import { DESIGN_TOKEN_BG, DESIGN_TOKEN_TEXT, PADDING_SIZE, LAYOUT_WIDTH } from "@/types/page-builder";
import type { StylePresetClasses } from "../lib/style-presets";

interface PhotoGalleryRendererProps {
  section: PhotoGallerySection;
  lang: string;
  clinicPhotos?: string[];
  preset?: StylePresetClasses;
}

export function PhotoGalleryRenderer({ section, lang, clinicPhotos, preset }: PhotoGalleryRendererProps) {
  const isNe = lang === "ne";
  const { data, style } = section;
  const heading = isNe ? data.headingNe || data.heading : data.heading;
  // Use variant if set, else fall back to legacy layout field
  const variant = data.variant || data.layout || "grid";

  const colsClass = data.columns === 2 ? "grid-cols-1 sm:grid-cols-2" :
                     data.columns === 4 ? "grid-cols-2 sm:grid-cols-4" :
                     "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

  const photos = data.source === "auto"
    ? (clinicPhotos || []).map((url, i) => ({ id: `auto-${i}`, url, caption: "", captionNe: "" }))
    : data.manualPhotos;

  const cardBorder = preset?.border || "border-4 border-foreground";
  const cardShadow = preset?.shadow || "shadow-[4px_4px_0_0_#121212]";
  const headingWeight = preset?.headingWeight || "font-bold";
  const divider = preset?.sectionDivider || "border-t-2 border-current/20";
  const radius = preset?.radius || "";

  const headingEl = heading ? (
    <>
      <h2 className={`text-3xl ${headingWeight} mb-4`}>{heading}</h2>
      <div className={`${divider} mb-6`} />
    </>
  ) : null;

  if (photos.length === 0) {
    return (
      <div className={`${DESIGN_TOKEN_BG[style.bgColor]} ${DESIGN_TOKEN_TEXT[style.textColor]} ${PADDING_SIZE[style.padding]}`}>
        <div className={LAYOUT_WIDTH[style.layout]}>
          {headingEl}
          <p className="text-center opacity-60 py-8">{isNe ? "कुनै फोटो छैन" : "No photos yet"}</p>
        </div>
      </div>
    );
  }

  if (variant === "carousel") {
    return (
      <div className={`${DESIGN_TOKEN_BG[style.bgColor]} ${DESIGN_TOKEN_TEXT[style.textColor]} ${PADDING_SIZE[style.padding]}`}>
        <div className={LAYOUT_WIDTH[style.layout]}>
          {headingEl}
          <CarouselView
            photos={photos}
            isNe={isNe}
            cardBorder={cardBorder}
            cardShadow={cardShadow}
            radius={radius}
          />
        </div>
      </div>
    );
  }

  if (variant === "masonry") {
    return (
      <div className={`${DESIGN_TOKEN_BG[style.bgColor]} ${DESIGN_TOKEN_TEXT[style.textColor]} ${PADDING_SIZE[style.padding]}`}>
        <div className={LAYOUT_WIDTH[style.layout]}>
          {headingEl}
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
            {photos.map((photo) => (
              <div key={photo.id} className={`${cardBorder} ${cardShadow} ${radius} overflow-hidden mb-4 break-inside-avoid`}>
                <img
                  src={photo.url}
                  alt={isNe ? photo.captionNe || photo.caption : photo.caption}
                  className="w-full h-auto object-cover"
                />
                {(photo.caption || photo.captionNe) && (
                  <div className="p-2 bg-white">
                    <p className="text-sm font-medium text-foreground">
                      {isNe ? photo.captionNe || photo.caption : photo.caption}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Default: grid
  return (
    <div className={`${DESIGN_TOKEN_BG[style.bgColor]} ${DESIGN_TOKEN_TEXT[style.textColor]} ${PADDING_SIZE[style.padding]}`}>
      <div className={LAYOUT_WIDTH[style.layout]}>
        {headingEl}
        <div className={`grid ${colsClass} gap-4`}>
          {photos.map((photo) => (
            <div key={photo.id} className={`${cardBorder} ${cardShadow} ${radius} overflow-hidden`}>
              <img
                src={photo.url}
                alt={isNe ? photo.captionNe || photo.caption : photo.caption}
                className="w-full h-48 object-cover"
              />
              {(photo.caption || photo.captionNe) && (
                <div className="p-2 bg-white">
                  <p className="text-sm font-medium text-foreground">
                    {isNe ? photo.captionNe || photo.caption : photo.caption}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface CarouselViewProps {
  photos: Array<{ id: string; url: string; caption: string; captionNe: string }>;
  isNe: boolean;
  cardBorder: string;
  cardShadow: string;
  radius: string;
}

function CarouselView({ photos, isNe, cardBorder, cardShadow, radius }: CarouselViewProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "center" });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <div className="relative">
      {/* Carousel viewport */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="flex-[0_0_80%] sm:flex-[0_0_60%] md:flex-[0_0_50%] min-w-0"
            >
              <div className={`${cardBorder} ${cardShadow} ${radius} overflow-hidden`}>
                <div className="aspect-[4/3]">
                  <img
                    src={photo.url}
                    alt={isNe ? photo.captionNe || photo.caption : photo.caption}
                    className="w-full h-full object-cover"
                  />
                </div>
                {(photo.caption || photo.captionNe) && (
                  <div className="p-3 bg-white">
                    <p className="text-sm font-medium text-foreground">
                      {isNe ? photo.captionNe || photo.caption : photo.caption}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation arrows */}
      {canScrollPrev && (
        <button
          type="button"
          onClick={scrollPrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-foreground text-white flex items-center justify-center hover:bg-primary-blue transition-colors z-10"
          aria-label="Previous"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      {canScrollNext && (
        <button
          type="button"
          onClick={scrollNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-foreground text-white flex items-center justify-center hover:bg-primary-blue transition-colors z-10"
          aria-label="Next"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Dot indicators */}
      {photos.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => scrollTo(index)}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                index === selectedIndex
                  ? "bg-foreground"
                  : "bg-foreground/30 hover:bg-foreground/50"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
