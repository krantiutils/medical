"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ProfessionalReviewFormProps {
  doctorId: string;
  lang: string;
}

export function ProfessionalReviewForm({ doctorId, lang }: ProfessionalReviewFormProps) {
  const { data: session, status } = useSession();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (status === "loading") {
    return null;
  }

  if (!session) {
    return (
      <div className="text-center py-4">
        <p className="text-foreground/60 mb-2">
          {lang === "ne" ? "समीक्षा लेख्न लगइन गर्नुहोस्" : "Sign in to leave a review"}
        </p>
        <Link href={`/${lang}/login`}>
          <Button variant="outline" size="sm">
            {lang === "ne" ? "लगइन" : "Sign In"}
          </Button>
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="border-2 border-verified bg-verified/5 p-4 text-center">
        <p className="font-bold text-verified">
          {lang === "ne" ? "समीक्षा सफलतापूर्वक पेश गरियो!" : "Review submitted successfully!"}
        </p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError(lang === "ne" ? "कृपया रेटिंग चयन गर्नुहोस्" : "Please select a rating");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId,
          rating,
          reviewText: reviewText.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to submit review");
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2 block">
          {lang === "ne" ? "रेटिंग" : "Rating"}
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
              className="p-1 transition-transform hover:scale-110"
            >
              <svg
                className={`w-8 h-8 ${
                  star <= (hoverRating || rating)
                    ? "text-primary-yellow fill-primary-yellow"
                    : "text-foreground/20 fill-foreground/20"
                }`}
                viewBox="0 0 24 24"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label
          htmlFor="reviewText"
          className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2 block"
        >
          {lang === "ne" ? "तपाईंको समीक्षा" : "Your Review"}
        </label>
        <textarea
          id="reviewText"
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder={
            lang === "ne"
              ? "तपाईंको अनुभव साझा गर्नुहोस् (वैकल्पिक)"
              : "Share your experience (optional)"
          }
          className="w-full px-4 py-3 border-2 border-foreground bg-white focus:outline-none focus:border-primary-blue resize-none"
          rows={3}
          maxLength={1000}
        />
      </div>

      {error && (
        <p className="text-sm text-primary-red font-medium">{error}</p>
      )}

      <Button
        type="submit"
        variant="primary"
        size="sm"
        disabled={submitting || rating === 0}
      >
        {submitting
          ? lang === "ne" ? "पेश गर्दै..." : "Submitting..."
          : lang === "ne" ? "समीक्षा पेश गर्नुहोस्" : "Submit Review"}
      </Button>
    </form>
  );
}
