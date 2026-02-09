"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDisplayName } from "@/lib/professional-display";

interface Review {
  id: string;
  rating: number;
  review_text: string | null;
  categories: Record<string, number> | null;
  is_published: boolean;
  created_at: string;
  patient: {
    full_name: string;
  };
  doctor: {
    id: string;
    full_name: string;
    type: "DOCTOR" | "DENTIST" | "PHARMACIST";
  } | null;
  clinic: {
    id: string;
    name: string;
    slug: string;
  };
}

// Star display component
function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${
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

export default function AdminReviewsPage() {
  const { data: session, status } = useSession();
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en";

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "published" | "unpublished">("all");
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [deleteModal, setDeleteModal] = useState<Review | null>(null);

  // Translations
  const t = {
    en: {
      title: "Reviews Moderation",
      subtitle: "Moderate patient reviews across all clinics",
      allReviews: "All Reviews",
      publishedReviews: "Published",
      unpublishedReviews: "Unpublished",
      noReviews: "No reviews found",
      patient: "Patient",
      clinic: "Clinic",
      doctor: "Doctor",
      rating: "Rating",
      submittedAt: "Submitted",
      status: "Status",
      published: "Published",
      unpublished: "Unpublished",
      publish: "Publish",
      unpublish: "Unpublish",
      delete: "Delete",
      viewClinic: "View Clinic",
      close: "Close",
      reviewDetails: "Review Details",
      categories: "Category Ratings",
      cleanliness: "Cleanliness",
      waitTime: "Wait Time",
      staff: "Staff Behavior",
      publishing: "Publishing...",
      unpublishing: "Unpublishing...",
      deleting: "Deleting...",
      generalReview: "General Clinic Review",
      confirmDelete: "Delete Review",
      confirmDeleteMessage: "Are you sure you want to delete this review? This action cannot be undone.",
      cancel: "Cancel",
      accessDenied: "Access Denied",
      accessDeniedMessage: "You do not have permission to access this page.",
      goHome: "Go Home",
      loginRequired: "Please log in to access this page",
      login: "Login",
    },
    ne: {
      title: "समीक्षा मध्यस्थता",
      subtitle: "सबै क्लिनिकहरूमा बिरामी समीक्षाहरू मध्यस्थता गर्नुहोस्",
      allReviews: "सबै समीक्षाहरू",
      publishedReviews: "प्रकाशित",
      unpublishedReviews: "अप्रकाशित",
      noReviews: "कुनै समीक्षा फेला परेन",
      patient: "बिरामी",
      clinic: "क्लिनिक",
      doctor: "डाक्टर",
      rating: "रेटिङ",
      submittedAt: "पेश गरिएको",
      status: "स्थिति",
      published: "प्रकाशित",
      unpublished: "अप्रकाशित",
      publish: "प्रकाशित गर्नुहोस्",
      unpublish: "अप्रकाशित गर्नुहोस्",
      delete: "मेट्नुहोस्",
      viewClinic: "क्लिनिक हेर्नुहोस्",
      close: "बन्द गर्नुहोस्",
      reviewDetails: "समीक्षा विवरण",
      categories: "श्रेणी रेटिङ",
      cleanliness: "सरसफाई",
      waitTime: "पर्खने समय",
      staff: "कर्मचारी व्यवहार",
      publishing: "प्रकाशित गर्दै...",
      unpublishing: "अप्रकाशित गर्दै...",
      deleting: "मेट्दै...",
      generalReview: "सामान्य क्लिनिक समीक्षा",
      confirmDelete: "समीक्षा मेट्नुहोस्",
      confirmDeleteMessage: "के तपाईं यो समीक्षा मेट्न निश्चित हुनुहुन्छ? यो कार्य पूर्ववत गर्न सकिँदैन।",
      cancel: "रद्द गर्नुहोस्",
      accessDenied: "पहुँच अस्वीकार",
      accessDeniedMessage: "यो पृष्ठ पहुँच गर्न तपाईंलाई अनुमति छैन।",
      goHome: "गृह जानुहोस्",
      loginRequired: "यो पृष्ठ पहुँच गर्न कृपया लगइन गर्नुहोस्",
      login: "लगइन",
    },
  };

  const translations = t[lang === "ne" ? "ne" : "en"];

  // Fetch reviews
  const fetchReviews = useCallback(async () => {
    try {
      const publishedParam = filter === "all" ? "all" : filter === "published" ? "true" : "false";
      const res = await fetch(`/api/admin/reviews?published=${publishedParam}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      fetchReviews();
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [status, session, fetchReviews]);

  // Handle publish/unpublish
  const handleTogglePublish = async (review: Review) => {
    setActionLoading(review.id);
    try {
      const res = await fetch(`/api/reviews/${review.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "moderate",
          is_published: !review.is_published,
        }),
      });

      if (res.ok) {
        setReviews((prev) =>
          prev.map((r) =>
            r.id === review.id ? { ...r, is_published: !r.is_published } : r
          )
        );
      }
    } catch (error) {
      console.error("Error updating review:", error);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle delete
  const handleDelete = async (review: Review) => {
    setActionLoading(review.id);
    try {
      const res = await fetch(`/api/reviews/${review.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== review.id));
        setDeleteModal(null);
      }
    } catch (error) {
      console.error("Error deleting review:", error);
    } finally {
      setActionLoading(null);
    }
  };

  // Loading state
  if (loading || status === "loading") {
    return (
      <main className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-foreground/10 rounded w-1/3" />
            <div className="h-6 bg-foreground/10 rounded w-2/3" />
            <div className="h-48 bg-foreground/10 rounded" />
          </div>
        </div>
      </main>
    );
  }

  // Not authenticated
  if (status === "unauthenticated") {
    return (
      <main className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-md mx-auto text-center">
          <Card decorator="red" decoratorPosition="top-right">
            <CardContent className="py-12">
              <div className="w-16 h-16 mx-auto mb-6 bg-primary-red/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-primary-red"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <p className="text-lg font-bold mb-6">{translations.loginRequired}</p>
              <Link href={`/${lang}/login?callbackUrl=/${lang}/admin/reviews`}>
                <Button variant="primary">{translations.login}</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Not admin
  if (session?.user?.role !== "ADMIN") {
    return (
      <main className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-md mx-auto text-center">
          <Card decorator="red" decoratorPosition="top-right">
            <CardContent className="py-12">
              <div className="w-16 h-16 mx-auto mb-6 bg-primary-red/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-primary-red"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">{translations.accessDenied}</h2>
              <p className="text-foreground/60 mb-6">{translations.accessDeniedMessage}</p>
              <Link href={`/${lang}`}>
                <Button variant="outline">{translations.goHome}</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{translations.title}</h1>
          <p className="text-foreground/60">{translations.subtitle}</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {(["all", "published", "unpublished"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 font-bold border-4 transition-all ${
                filter === f
                  ? "border-foreground bg-foreground text-white"
                  : "border-foreground bg-white hover:bg-foreground/5"
              }`}
            >
              {f === "all"
                ? translations.allReviews
                : f === "published"
                ? translations.publishedReviews
                : translations.unpublishedReviews}
            </button>
          ))}
        </div>

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <Card decorator="blue" decoratorPosition="top-right">
            <CardContent className="py-12 text-center">
              <p className="text-foreground/60">{translations.noReviews}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card
                key={review.id}
                decorator={review.is_published ? "blue" : "yellow"}
                decoratorPosition="top-left"
              >
                <CardContent>
                  <div className="flex flex-col lg:flex-row gap-4">
                    {/* Review Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <StarDisplay rating={review.rating} />
                            <span
                              className={`px-2 py-0.5 text-xs font-bold ${
                                review.is_published
                                  ? "bg-verified/20 text-verified"
                                  : "bg-primary-yellow/20 text-primary-yellow"
                              }`}
                            >
                              {review.is_published
                                ? translations.published
                                : translations.unpublished}
                            </span>
                          </div>
                          <p className="text-sm text-foreground/60">
                            {new Date(review.created_at).toLocaleDateString(
                              lang === "ne" ? "ne-NP" : "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Clinic & Doctor */}
                      <div className="mb-3 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-foreground/60 uppercase">
                            {translations.clinic}:
                          </span>
                          <Link
                            href={`/${lang}/clinic/${review.clinic.slug}`}
                            className="text-primary-blue hover:underline font-medium"
                          >
                            {review.clinic.name}
                          </Link>
                        </div>
                        {review.doctor && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-foreground/60 uppercase">
                              {translations.doctor}:
                            </span>
                            <span className="font-medium">
                              {getDisplayName(review.doctor)}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-foreground/60 uppercase">
                            {translations.patient}:
                          </span>
                          <span className="font-medium">
                            {review.patient.full_name}
                          </span>
                        </div>
                      </div>

                      {/* Review Text */}
                      {review.review_text && (
                        <p className="text-foreground/80 line-clamp-2">
                          "{review.review_text}"
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-row lg:flex-col gap-2 lg:w-36">
                      <Button
                        variant={review.is_published ? "outline" : "primary"}
                        size="sm"
                        className="flex-1"
                        onClick={() => handleTogglePublish(review)}
                        disabled={actionLoading === review.id}
                      >
                        {actionLoading === review.id
                          ? review.is_published
                            ? translations.unpublishing
                            : translations.publishing
                          : review.is_published
                          ? translations.unpublish
                          : translations.publish}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setSelectedReview(review)}
                      >
                        {translations.reviewDetails}
                      </Button>
                      <button
                        onClick={() => setDeleteModal(review)}
                        disabled={actionLoading === review.id}
                        className="px-3 py-1.5 text-sm font-bold text-primary-red hover:bg-primary-red/10 border-2 border-primary-red transition-colors"
                      >
                        {translations.delete}
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Review Details Modal */}
        {selectedReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white border-4 border-foreground shadow-[8px_8px_0_0_#121212] max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold">{translations.reviewDetails}</h2>
                  <button
                    onClick={() => setSelectedReview(null)}
                    className="p-2 hover:bg-foreground/10"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Rating */}
                  <div className="flex items-center gap-3">
                    <StarDisplay rating={selectedReview.rating} />
                    <span className="text-2xl font-bold">{selectedReview.rating}/5</span>
                  </div>

                  {/* Info */}
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-bold">{translations.clinic}:</span>{" "}
                      {selectedReview.clinic.name}
                    </p>
                    <p>
                      <span className="font-bold">{translations.doctor}:</span>{" "}
                      {selectedReview.doctor
                        ? getDisplayName(selectedReview.doctor)
                        : translations.generalReview}
                    </p>
                    <p>
                      <span className="font-bold">{translations.patient}:</span>{" "}
                      {selectedReview.patient.full_name}
                    </p>
                  </div>

                  {/* Review Text */}
                  {selectedReview.review_text && (
                    <div>
                      <h3 className="font-bold mb-2">Review</h3>
                      <p className="text-foreground/80 p-3 bg-foreground/5 border-2 border-foreground/10">
                        {selectedReview.review_text}
                      </p>
                    </div>
                  )}

                  {/* Categories */}
                  {selectedReview.categories && Object.keys(selectedReview.categories).some(
                    (k) => selectedReview.categories![k] > 0
                  ) && (
                    <div>
                      <h3 className="font-bold mb-2">{translations.categories}</h3>
                      <div className="space-y-2">
                        {selectedReview.categories.cleanliness > 0 && (
                          <div className="flex items-center justify-between">
                            <span>{translations.cleanliness}</span>
                            <StarDisplay rating={selectedReview.categories.cleanliness} />
                          </div>
                        )}
                        {selectedReview.categories.wait_time > 0 && (
                          <div className="flex items-center justify-between">
                            <span>{translations.waitTime}</span>
                            <StarDisplay rating={selectedReview.categories.wait_time} />
                          </div>
                        )}
                        {selectedReview.categories.staff > 0 && (
                          <div className="flex items-center justify-between">
                            <span>{translations.staff}</span>
                            <StarDisplay rating={selectedReview.categories.staff} />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full"
                    onClick={() => setSelectedReview(null)}
                  >
                    {translations.close}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white border-4 border-primary-red shadow-[8px_8px_0_0_#D02020] max-w-md w-full">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-primary-red mb-4">
                  {translations.confirmDelete}
                </h2>
                <p className="text-foreground/70 mb-6">
                  {translations.confirmDeleteMessage}
                </p>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1"
                    onClick={() => setDeleteModal(null)}
                    disabled={actionLoading === deleteModal.id}
                  >
                    {translations.cancel}
                  </Button>
                  <button
                    onClick={() => handleDelete(deleteModal)}
                    disabled={actionLoading === deleteModal.id}
                    className="flex-1 px-6 py-3 bg-primary-red text-white font-bold border-4 border-foreground shadow-[4px_4px_0_0_#121212] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50"
                  >
                    {actionLoading === deleteModal.id
                      ? translations.deleting
                      : translations.delete}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
