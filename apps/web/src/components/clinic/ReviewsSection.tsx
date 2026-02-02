"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Review {
  id: string;
  rating: number;
  review_text: string | null;
  categories: {
    cleanliness?: number;
    wait_time?: number;
    staff?: number;
  } | null;
  doctor_response: string | null;
  created_at: string;
  patient: {
    full_name: string;
    photo_url: string | null;
  };
  doctor: {
    id: string;
    full_name: string;
    type: string;
  } | null;
}

interface ReviewsSectionProps {
  clinicId: string;
  clinicSlug: string;
  lang: string;
  translations: {
    reviews: string;
    writeReview: string;
    basedOn: string;
    reviewsText: string;
    noReviews: string;
    noReviewsYet: string;
    beTheFirst: string;
    showMore: string;
    doctorResponse: string;
    verifiedPatient: string;
    categories: {
      cleanliness: string;
      waitTime: string;
      staffBehavior: string;
    };
  };
}

// Star display component
function StarDisplay({ rating, size = "md" }: { rating: number; size?: "sm" | "md" }) {
  const sizeClass = size === "sm" ? "w-4 h-4" : "w-5 h-5";

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`${sizeClass} ${
            star <= rating
              ? "text-primary-yellow fill-primary-yellow"
              : "text-foreground/20"
          }`}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      ))}
    </div>
  );
}

export function ReviewsSection({
  clinicId,
  clinicSlug,
  lang,
  translations: t,
}: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch(`/api/reviews?clinicId=${clinicId}&limit=20`);
        if (res.ok) {
          const data = await res.json();
          setReviews(data.reviews);
          setAverageRating(data.averageRating);
          setTotalReviews(data.totalReviews);
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchReviews();
  }, [clinicId]);

  const displayedReviews = showAll ? reviews : reviews.slice(0, 3);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-24 bg-foreground/10 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Rating Summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          {totalReviews > 0 ? (
            <>
              <div className="text-5xl font-black text-foreground">
                {averageRating.toFixed(1)}
              </div>
              <div>
                <StarDisplay rating={Math.round(averageRating)} />
                <p className="text-sm text-foreground/60 mt-1">
                  {t.basedOn} {totalReviews} {t.reviewsText}
                </p>
              </div>
            </>
          ) : (
            <p className="text-foreground/60">{t.noReviews}</p>
          )}
        </div>

        <Link href={`/${lang}/clinic/${clinicSlug}/review`}>
          <Button variant="primary" size="md">
            {t.writeReview}
          </Button>
        </Link>
      </div>

      {/* No Reviews State */}
      {reviews.length === 0 && (
        <div className="text-center py-8 border-4 border-dashed border-foreground/20">
          <div className="w-16 h-16 mx-auto mb-4 bg-foreground/10 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-foreground/40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <p className="text-foreground/60 mb-2">{t.noReviewsYet}</p>
          <p className="text-sm text-foreground/40">{t.beTheFirst}</p>
        </div>
      )}

      {/* Reviews List */}
      {reviews.length > 0 && (
        <div className="space-y-4">
          {displayedReviews.map((review) => (
            <div
              key={review.id}
              className="border-4 border-foreground bg-white p-4"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  {review.patient.photo_url ? (
                    <img
                      src={review.patient.photo_url}
                      alt={review.patient.full_name}
                      className="w-10 h-10 rounded-full border-2 border-foreground object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary-blue flex items-center justify-center text-white font-bold border-2 border-foreground">
                      {review.patient.full_name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div>
                    <div className="font-bold">{review.patient.full_name}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-verified font-medium">
                        {t.verifiedPatient}
                      </span>
                      <span className="text-xs text-foreground/40">•</span>
                      <span className="text-xs text-foreground/60">
                        {new Date(review.created_at).toLocaleDateString(
                          lang === "ne" ? "ne-NP" : "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <StarDisplay rating={review.rating} size="sm" />
              </div>

              {/* Doctor badge */}
              {review.doctor && (
                <div className="mb-3">
                  <span className="inline-block px-2 py-1 text-xs font-bold bg-primary-blue/10 text-primary-blue border border-primary-blue/30">
                    Dr. {review.doctor.full_name}
                  </span>
                </div>
              )}

              {/* Review Text */}
              {review.review_text && (
                <p className="text-foreground/80 mb-3">{review.review_text}</p>
              )}

              {/* Category Ratings */}
              {review.categories && Object.keys(review.categories).some(
                (k) => review.categories![k as keyof typeof review.categories]
              ) && (
                <div className="flex flex-wrap gap-3 mb-3">
                  {review.categories.cleanliness && review.categories.cleanliness > 0 && (
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-foreground/60">
                        {t.categories.cleanliness}:
                      </span>
                      <StarDisplay rating={review.categories.cleanliness} size="sm" />
                    </div>
                  )}
                  {review.categories.wait_time && review.categories.wait_time > 0 && (
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-foreground/60">
                        {t.categories.waitTime}:
                      </span>
                      <StarDisplay rating={review.categories.wait_time} size="sm" />
                    </div>
                  )}
                  {review.categories.staff && review.categories.staff > 0 && (
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-foreground/60">
                        {t.categories.staffBehavior}:
                      </span>
                      <StarDisplay rating={review.categories.staff} size="sm" />
                    </div>
                  )}
                </div>
              )}

              {/* Doctor Response */}
              {review.doctor_response && (
                <div className="mt-3 pt-3 border-t-2 border-foreground/10">
                  <div className="bg-primary-blue/5 border-l-4 border-primary-blue p-3">
                    <div className="text-xs font-bold text-primary-blue mb-1">
                      {t.doctorResponse}
                    </div>
                    <p className="text-sm text-foreground/80">
                      {review.doctor_response}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Show More Button */}
          {reviews.length > 3 && !showAll && (
            <button
              onClick={() => setShowAll(true)}
              className="w-full py-3 border-4 border-foreground bg-white hover:bg-foreground/5 font-bold transition-colors"
            >
              {t.showMore} ({reviews.length - 3} more)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
