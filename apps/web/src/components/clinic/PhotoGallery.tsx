"use client";

import { useState } from "react";
import Image from "next/image";

interface PhotoGalleryProps {
  photos: string[];
  clinicName: string;
  translations: {
    photoGallery: string;
    photos: string;
    close: string;
    previous: string;
    next: string;
  };
}

export function PhotoGallery({
  photos,
  clinicName,
  translations: t,
}: PhotoGalleryProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  if (!photos || photos.length === 0) {
    return null;
  }

  const openModal = (index: number) => {
    setSelectedPhotoIndex(index);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const goToPrevious = () => {
    setSelectedPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setSelectedPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      closeModal();
    } else if (e.key === "ArrowLeft") {
      goToPrevious();
    } else if (e.key === "ArrowRight") {
      goToNext();
    }
  };

  return (
    <>
      {/* Gallery Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {photos.map((photo, index) => (
          <button
            key={index}
            onClick={() => openModal(index)}
            className="relative aspect-square border-4 border-foreground hover:border-primary-blue transition-colors overflow-hidden group"
          >
            <Image
              src={photo}
              alt={`${clinicName} - ${t.photos} ${index + 1}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <svg
                className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                />
              </svg>
            </div>
          </button>
        ))}
      </div>

      {/* Photo count */}
      <p className="text-sm text-foreground/60 mt-3">
        {photos.length} {t.photos}
      </p>

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={closeModal}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="dialog"
          aria-modal="true"
          aria-label={t.photoGallery}
        >
          {/* Close button */}
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 z-10 p-2 bg-white border-2 border-foreground shadow-[4px_4px_0_0_#121212] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#121212] transition-all"
            aria-label={t.close}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Navigation buttons */}
          {photos.length > 1 && (
            <>
              {/* Previous button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-white border-2 border-foreground shadow-[4px_4px_0_0_#121212] hover:translate-x-[2px] hover:translate-y-[calc(-50%+2px)] hover:shadow-[2px_2px_0_0_#121212] transition-all"
                aria-label={t.previous}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              {/* Next button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-white border-2 border-foreground shadow-[4px_4px_0_0_#121212] hover:translate-x-[2px] hover:translate-y-[calc(-50%+2px)] hover:shadow-[2px_2px_0_0_#121212] transition-all"
                aria-label={t.next}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </>
          )}

          {/* Main image */}
          <div
            className="relative max-w-4xl max-h-[80vh] w-full h-full mx-16"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={photos[selectedPhotoIndex]}
              alt={`${clinicName} - ${t.photos} ${selectedPhotoIndex + 1}`}
              fill
              className="object-contain"
              priority
            />
          </div>

          {/* Photo counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white px-4 py-2 border-2 border-foreground font-bold">
            {selectedPhotoIndex + 1} / {photos.length}
          </div>
        </div>
      )}
    </>
  );
}
