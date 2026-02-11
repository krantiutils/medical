"use client";

import { useEffect, useState } from "react";

interface Review {
  id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  doctor_response: string | null;
  patient: { full_name: string; photo_url: string | null } | null;
  user: { name: string | null; image: string | null } | null;
}

interface ReviewsData {
  reviews: Review[];
  total: number;
  averageRating: number;
  totalReviews: number;
}

interface ProfessionalReviewsDisplayProps {
  doctorId: string;
  lang: string;
}

export function ProfessionalReviewsDisplay({ doctorId, lang }: ProfessionalReviewsDisplayProps) {
  const [data, setData] = useState<ReviewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch(`/api/reviews?doctorId=${doctorId}&limit=10`);
        if (!res.ok) {
          throw new Error("Failed to fetch reviews");
        }
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError("Failed to load reviews");
      } finally {
        setLoading(false);
      }
    }

    fetchReviews();
  }, [doctorId]);

  if (loading) {
    return (
      <div className="py-4 text-center text-foreground/60">
        {lang === "ne" ? "समीक्षाहरू लोड हुँदैछ..." : "Loading reviews..."}
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  function renderStars(rating: number) {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? "text-primary-yellow fill-primary-yellow"
                : "text-foreground/20 fill-foreground/20"
            }`}
            viewBox="0 0 24 24"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
      </div>
    );
  }

  function getReviewerName(review: Review): string {
    if (review.user?.name) return review.user.name;
    if (review.patient?.full_name) return review.patient.full_name;
    return lang === "ne" ? "अज्ञात" : "Anonymous";
  }

  return (
    <div>
      {/* Average Rating */}
      {data.totalReviews > 0 && (
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl font-black">{data.averageRating.toFixed(1)}</span>
          <div>
            {renderStars(Math.round(data.averageRating))}
            <p className="text-sm text-foreground/60 mt-0.5">
              {lang === "ne"
                ? `${data.totalReviews} समीक्षाहरूको आधारमा`
                : `Based on ${data.totalReviews} review${data.totalReviews !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {data.reviews.length === 0 ? (
        <p className="text-foreground/60 text-sm">
          {lang === "ne" ? "अझै कुनै समीक्षा छैन" : "No reviews yet"}
        </p>
      ) : (
        <div className="space-y-4">
          {data.reviews.map((review) => (
            <div
              key={review.id}
              className="border-2 border-foreground/10 p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">{getReviewerName(review)}</span>
                  {renderStars(review.rating)}
                </div>
                <span className="text-xs text-foreground/40">
                  {new Date(review.created_at).toLocaleDateString(
                    lang === "ne" ? "ne-NP" : "en-US",
                    { year: "numeric", month: "short", day: "numeric" }
                  )}
                </span>
              </div>

              {review.review_text && (
                <p className="text-sm text-foreground/80">{review.review_text}</p>
              )}

              {review.doctor_response && (
                <div className="mt-3 pl-4 border-l-4 border-primary-blue">
                  <p className="text-xs font-bold text-primary-blue mb-1">
                    {lang === "ne" ? "डाक्टरको प्रतिक्रिया" : "Doctor's Response"}
                  </p>
                  <p className="text-sm text-foreground/70">{review.doctor_response}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
