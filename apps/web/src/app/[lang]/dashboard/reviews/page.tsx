"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Review {
  id: string;
  rating: number;
  review_text: string | null;
  categories: Record<string, number> | null;
  doctor_response: string | null;
  is_published: boolean;
  created_at: string;
  patient: {
    full_name: string;
  };
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
          className={`w-5 h-5 ${
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

export default function DoctorReviewsPage() {
  const { data: session, status } = useSession();
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en";

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [saving, setSaving] = useState(false);
  const [professionalId, setProfessionalId] = useState<string | null>(null);

  // Translations
  const t = {
    en: {
      title: "My Reviews",
      subtitle: "View and respond to patient reviews",
      noReviews: "No reviews yet",
      noReviewsDesc: "When patients leave reviews for you, they will appear here.",
      patient: "Patient",
      clinic: "Clinic",
      rating: "Rating",
      submittedAt: "Submitted",
      respond: "Respond",
      yourResponse: "Your Response",
      responsePlaceholder: "Write a professional response to the patient's review...",
      saveResponse: "Save Response",
      saving: "Saving...",
      editResponse: "Edit Response",
      responseSubmitted: "Response saved",
      cancel: "Cancel",
      viewClinic: "View Clinic",
      loginRequired: "Please log in to access this page",
      login: "Login",
      notProfessional: "Professional Account Required",
      notProfessionalDesc: "You need to claim your professional profile to access this feature.",
      claimProfile: "Claim Your Profile",
      categories: "Category Ratings",
      cleanliness: "Cleanliness",
      waitTime: "Wait Time",
      staff: "Staff Behavior",
    },
    ne: {
      title: "मेरा समीक्षाहरू",
      subtitle: "बिरामी समीक्षाहरू हेर्नुहोस् र प्रतिक्रिया दिनुहोस्",
      noReviews: "अझै कुनै समीक्षा छैन",
      noReviewsDesc: "जब बिरामीहरूले तपाईंको लागि समीक्षा छोड्छन्, तिनीहरू यहाँ देखा पर्नेछन्।",
      patient: "बिरामी",
      clinic: "क्लिनिक",
      rating: "रेटिङ",
      submittedAt: "पेश गरिएको",
      respond: "प्रतिक्रिया दिनुहोस्",
      yourResponse: "तपाईंको प्रतिक्रिया",
      responsePlaceholder: "बिरामीको समीक्षामा व्यावसायिक प्रतिक्रिया लेख्नुहोस्...",
      saveResponse: "प्रतिक्रिया सुरक्षित गर्नुहोस्",
      saving: "सुरक्षित गर्दै...",
      editResponse: "प्रतिक्रिया सम्पादन गर्नुहोस्",
      responseSubmitted: "प्रतिक्रिया सुरक्षित भयो",
      cancel: "रद्द गर्नुहोस्",
      viewClinic: "क्लिनिक हेर्नुहोस्",
      loginRequired: "यो पृष्ठ पहुँच गर्न कृपया लगइन गर्नुहोस्",
      login: "लगइन",
      notProfessional: "पेशेवर खाता आवश्यक",
      notProfessionalDesc: "यो सुविधा पहुँच गर्न तपाईंले आफ्नो पेशेवर प्रोफाइल दावी गर्नुपर्छ।",
      claimProfile: "आफ्नो प्रोफाइल दावी गर्नुहोस्",
      categories: "श्रेणी रेटिङ",
      cleanliness: "सरसफाई",
      waitTime: "पर्खने समय",
      staff: "कर्मचारी व्यवहार",
    },
  };

  const translations = t[lang === "ne" ? "ne" : "en"];

  // Fetch doctor's reviews
  const fetchReviews = useCallback(async (doctorId: string) => {
    try {
      const res = await fetch(`/api/dashboard/reviews?doctorId=${doctorId}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch professional ID
  useEffect(() => {
    async function fetchProfessionalId() {
      if (status === "authenticated" && session?.user?.id) {
        try {
          const res = await fetch("/api/dashboard/profile");
          if (res.ok) {
            const data = await res.json();
            if (data.professional?.id) {
              setProfessionalId(data.professional.id);
              fetchReviews(data.professional.id);
            } else {
              setLoading(false);
            }
          } else {
            setLoading(false);
          }
        } catch (error) {
          console.error("Error fetching professional:", error);
          setLoading(false);
        }
      } else if (status !== "loading") {
        setLoading(false);
      }
    }

    fetchProfessionalId();
  }, [status, session, fetchReviews]);

  // Handle response submission
  const handleSubmitResponse = async (reviewId: string) => {
    if (!responseText.trim()) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "respond",
          doctorResponse: responseText.trim(),
        }),
      });

      if (res.ok) {
        setReviews((prev) =>
          prev.map((r) =>
            r.id === reviewId ? { ...r, doctor_response: responseText.trim() } : r
          )
        );
        setRespondingTo(null);
        setResponseText("");
      }
    } catch (error) {
      console.error("Error submitting response:", error);
    } finally {
      setSaving(false);
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
              <Link href={`/${lang}/login?callbackUrl=/${lang}/dashboard/reviews`}>
                <Button variant="primary">{translations.login}</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Not a professional
  if (!professionalId) {
    return (
      <main className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-md mx-auto text-center">
          <Card decorator="yellow" decoratorPosition="top-right">
            <CardContent className="py-12">
              <div className="w-16 h-16 mx-auto mb-6 bg-primary-yellow/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-primary-yellow"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold mb-2">{translations.notProfessional}</h2>
              <p className="text-foreground/60 mb-6">{translations.notProfessionalDesc}</p>
              <Link href={`/${lang}/claim`}>
                <Button variant="primary">{translations.claimProfile}</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{translations.title}</h1>
          <p className="text-foreground/60">{translations.subtitle}</p>
        </div>

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <Card decorator="blue" decoratorPosition="top-right">
            <CardContent className="py-12 text-center">
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
              <p className="text-lg font-bold mb-2">{translations.noReviews}</p>
              <p className="text-foreground/60">{translations.noReviewsDesc}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <Card
                key={review.id}
                decorator={review.doctor_response ? "blue" : "yellow"}
                decoratorPosition="top-left"
              >
                <CardContent>
                  {/* Review Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <StarDisplay rating={review.rating} />
                        <span className="text-2xl font-bold">{review.rating}/5</span>
                      </div>
                      <p className="text-sm text-foreground/60">
                        {new Date(review.created_at).toLocaleDateString(
                          lang === "ne" ? "ne-NP" : "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </p>
                    </div>

                    <Link
                      href={`/${lang}/clinic/${review.clinic.slug}`}
                      className="text-sm text-primary-blue hover:underline font-medium"
                    >
                      {review.clinic.name} →
                    </Link>
                  </div>

                  {/* Patient Name */}
                  <div className="mb-4">
                    <span className="text-xs font-bold text-foreground/60 uppercase">
                      {translations.patient}:
                    </span>
                    <span className="ml-2 font-medium">{review.patient.full_name}</span>
                  </div>

                  {/* Review Text */}
                  {review.review_text && (
                    <div className="mb-4 p-4 bg-foreground/5 border-l-4 border-foreground/20">
                      <p className="text-foreground/80 italic">"{review.review_text}"</p>
                    </div>
                  )}

                  {/* Category Ratings */}
                  {review.categories && Object.keys(review.categories).some(
                    (k) => review.categories![k] > 0
                  ) && (
                    <div className="mb-4 flex flex-wrap gap-4 text-sm">
                      {review.categories.cleanliness > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-foreground/60">{translations.cleanliness}:</span>
                          <span className="font-bold">{review.categories.cleanliness}/5</span>
                        </div>
                      )}
                      {review.categories.wait_time > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-foreground/60">{translations.waitTime}:</span>
                          <span className="font-bold">{review.categories.wait_time}/5</span>
                        </div>
                      )}
                      {review.categories.staff > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-foreground/60">{translations.staff}:</span>
                          <span className="font-bold">{review.categories.staff}/5</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Doctor Response */}
                  {review.doctor_response && respondingTo !== review.id && (
                    <div className="mt-4 pt-4 border-t-2 border-foreground/10">
                      <div className="bg-primary-blue/5 border-l-4 border-primary-blue p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-primary-blue uppercase">
                            {translations.yourResponse}
                          </span>
                          <button
                            onClick={() => {
                              setRespondingTo(review.id);
                              setResponseText(review.doctor_response || "");
                            }}
                            className="text-sm text-primary-blue hover:underline font-medium"
                          >
                            {translations.editResponse}
                          </button>
                        </div>
                        <p className="text-foreground/80">{review.doctor_response}</p>
                      </div>
                    </div>
                  )}

                  {/* Response Form */}
                  {respondingTo === review.id && (
                    <div className="mt-4 pt-4 border-t-2 border-foreground/10">
                      <label className="block text-sm font-bold mb-2">
                        {translations.yourResponse}
                      </label>
                      <textarea
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        placeholder={translations.responsePlaceholder}
                        rows={4}
                        className="w-full px-4 py-3 border-4 border-foreground focus:border-primary-blue focus:outline-none resize-none mb-4"
                      />
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setRespondingTo(null);
                            setResponseText("");
                          }}
                          disabled={saving}
                        >
                          {translations.cancel}
                        </Button>
                        <Button
                          variant="primary"
                          onClick={() => handleSubmitResponse(review.id)}
                          disabled={saving || !responseText.trim()}
                        >
                          {saving ? translations.saving : translations.saveResponse}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Respond Button (if no response yet) */}
                  {!review.doctor_response && respondingTo !== review.id && (
                    <div className="mt-4 pt-4 border-t-2 border-foreground/10">
                      <Button
                        variant="outline"
                        onClick={() => setRespondingTo(review.id)}
                      >
                        {translations.respond}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
