"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Patient {
  id: string;
  name: string | null;
  email: string;
}

interface InstantRequest {
  id: string;
  status: string;
  fee: string;
  chief_complaint: string | null;
  acceptance_deadline: string | null;
  created_at: string;
  patient: Patient;
}

const translations = {
  en: {
    title: "Incoming Consultation Requests",
    subtitle: "Accept or reject instant consultation requests",
    noRequests: "No pending requests",
    noRequestsDescription:
      "New requests will appear here when patients request instant consultations",
    patient: "Patient",
    reason: "Reason",
    timeLeft: "Time left",
    accept: "Accept",
    reject: "Reject",
    accepting: "Accepting...",
    rejecting: "Rejecting...",
    rejectionReason: "Reason for rejection (optional)",
    rejectionPlaceholder: "e.g., Currently in another consultation",
    fee: "Fee",
    loginRequired: "Please log in to view instant consultation requests",
    login: "Login",
    noProfile:
      "You need a claimed professional profile to receive consultation requests",
    claimProfile: "Claim Your Profile",
    enableTelemedicine: "Enable telemedicine in your profile settings to receive requests",
    profileSettings: "Profile Settings",
    seconds: "seconds",
    expired: "Expired",
    cancel: "Cancel",
    confirmReject: "Confirm Rejection",
  },
  ne: {
    title: "आउने परामर्श अनुरोधहरू",
    subtitle: "तत्काल परामर्श अनुरोधहरू स्वीकार वा अस्वीकार गर्नुहोस्",
    noRequests: "कुनै पर्खिने अनुरोध छैन",
    noRequestsDescription:
      "बिरामीहरूले तत्काल परामर्श अनुरोध गर्दा नयाँ अनुरोधहरू यहाँ देखिनेछन्",
    patient: "बिरामी",
    reason: "कारण",
    timeLeft: "बाँकी समय",
    accept: "स्वीकार गर्नुहोस्",
    reject: "अस्वीकार गर्नुहोस्",
    accepting: "स्वीकार गर्दै...",
    rejecting: "अस्वीकार गर्दै...",
    rejectionReason: "अस्वीकारको कारण (वैकल्पिक)",
    rejectionPlaceholder: "जस्तै, अर्को परामर्शमा छु",
    fee: "शुल्क",
    loginRequired: "तत्काल परामर्श अनुरोधहरू हेर्न कृपया लगइन गर्नुहोस्",
    login: "लगइन गर्नुहोस्",
    noProfile:
      "परामर्श अनुरोधहरू प्राप्त गर्न तपाईंलाई दाबी गरिएको व्यावसायिक प्रोफाइल चाहिन्छ",
    claimProfile: "आफ्नो प्रोफाइल दाबी गर्नुहोस्",
    enableTelemedicine:
      "अनुरोधहरू प्राप्त गर्न आफ्नो प्रोफाइल सेटिङ्समा टेलिमेडिसिन सक्षम गर्नुहोस्",
    profileSettings: "प्रोफाइल सेटिङ्",
    seconds: "सेकेन्ड",
    expired: "समाप्त भयो",
    cancel: "रद्द गर्नुहोस्",
    confirmReject: "अस्वीकार पुष्टि गर्नुहोस्",
  },
};

export default function InstantRequestsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const lang = (params?.lang as "en" | "ne") || "en";
  const t = translations[lang];

  const [requests, setRequests] = useState<InstantRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [timeLeftMap, setTimeLeftMap] = useState<Record<string, number>>({});

  // Rejection modal state
  const [rejectingRequest, setRejectingRequest] = useState<InstantRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch("/api/telemedicine/instant?role=doctor");
      const data = await res.json();

      if (res.ok) {
        setRequests(data.requests || []);

        // Initialize time left map
        const newTimeLeftMap: Record<string, number> = {};
        for (const req of data.requests || []) {
          if (req.acceptance_deadline) {
            const deadline = new Date(req.acceptance_deadline);
            const now = new Date();
            const remaining = Math.max(
              0,
              Math.floor((deadline.getTime() - now.getTime()) / 1000)
            );
            newTimeLeftMap[req.id] = remaining;
          }
        }
        setTimeLeftMap(newTimeLeftMap);
      } else {
        if (res.status === 404) {
          setError("no_profile");
        } else {
          setError(data.error);
        }
      }
    } catch (err) {
      console.error("Failed to fetch requests:", err);
      setError("Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      fetchRequests();

      // Poll for new requests every 3 seconds
      const pollInterval = setInterval(fetchRequests, 3000);
      return () => clearInterval(pollInterval);
    } else if (sessionStatus === "unauthenticated") {
      setLoading(false);
    }
  }, [sessionStatus, fetchRequests]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeftMap((prev) => {
        const updated: Record<string, number> = {};
        for (const [id, time] of Object.entries(prev)) {
          updated[id] = Math.max(0, time - 1);
        }
        return updated;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleAccept = async (requestId: string) => {
    setProcessingId(requestId);

    try {
      const res = await fetch(`/api/telemedicine/instant/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });

      const data = await res.json();

      if (res.ok) {
        // Redirect to call page
        router.push(`/${lang}/dashboard/consultations/${requestId}/call`);
      } else {
        alert(data.error || "Failed to accept request");
      }
    } catch (err) {
      console.error("Failed to accept request:", err);
      alert("Failed to accept request");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectClick = (request: InstantRequest) => {
    setRejectingRequest(request);
    setRejectionReason("");
  };

  const handleConfirmReject = async () => {
    if (!rejectingRequest) return;

    setProcessingId(rejectingRequest.id);

    try {
      const res = await fetch(`/api/telemedicine/instant/${rejectingRequest.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          rejection_reason: rejectionReason || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // Remove from list
        setRequests((prev) => prev.filter((r) => r.id !== rejectingRequest.id));
        setRejectingRequest(null);
      } else {
        alert(data.error || "Failed to reject request");
      }
    } catch (err) {
      console.error("Failed to reject request:", err);
      alert("Failed to reject request");
    } finally {
      setProcessingId(null);
    }
  };

  // Loading state
  if (sessionStatus === "loading" || loading) {
    return (
      <main className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-8 h-8 border-4 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p>Loading...</p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Not authenticated
  if (!session) {
    return (
      <main className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Card decorator="red" decoratorPosition="top-right">
            <CardHeader>
              <h1 className="text-3xl font-bold">{t.title}</h1>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/70 mb-6">{t.loginRequired}</p>
              <Link href={`/${lang}/login?callbackUrl=/${lang}/dashboard/instant-requests`}>
                <Button>{t.login}</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // No professional profile
  if (error === "no_profile") {
    return (
      <main className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Card decorator="yellow" decoratorPosition="top-right">
            <CardHeader>
              <h1 className="text-3xl font-bold">{t.title}</h1>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/70 mb-6">{t.noProfile}</p>
              <Link href={`/${lang}/claim`}>
                <Button>{t.claimProfile}</Button>
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
          <h1 className="text-4xl font-bold mb-2">{t.title}</h1>
          <p className="text-foreground/70">{t.subtitle}</p>
        </div>

        {/* Request List */}
        {requests.length === 0 ? (
          <Card decorator="blue" decoratorPosition="top-right">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 bg-primary-blue/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-primary-blue"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">{t.noRequests}</h3>
              <p className="text-foreground/60">{t.noRequestsDescription}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => {
              const timeLeft = timeLeftMap[request.id] || 0;
              const isExpired = timeLeft === 0;
              const isProcessing = processingId === request.id;

              return (
                <Card
                  key={request.id}
                  decorator={isExpired ? undefined : "yellow"}
                  decoratorPosition="top-left"
                  className={isExpired ? "opacity-50" : ""}
                >
                  <CardContent>
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Patient Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 bg-primary-blue rounded-full flex items-center justify-center border-2 border-foreground">
                            <span className="text-white font-bold text-lg">
                              {(request.patient.name || "P").charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-xs text-foreground/60 uppercase tracking-wider">
                              {t.patient}
                            </p>
                            <p className="font-bold">
                              {request.patient.name || request.patient.email}
                            </p>
                          </div>
                        </div>

                        {request.chief_complaint && (
                          <div className="bg-gray-50 p-3 mb-3">
                            <p className="text-xs text-foreground/60 uppercase tracking-wider mb-1">
                              {t.reason}
                            </p>
                            <p className="text-sm">{request.chief_complaint}</p>
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-sm">
                          <div>
                            <span className="text-foreground/60">{t.fee}: </span>
                            <span className="font-bold">
                              NPR {Number(request.fee).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Timer and Actions */}
                      <div className="flex flex-col items-end justify-between gap-4">
                        {/* Timer */}
                        <div className="text-right">
                          <p className="text-xs text-foreground/60 uppercase tracking-wider">
                            {t.timeLeft}
                          </p>
                          {isExpired ? (
                            <p className="text-lg font-bold text-foreground/50">
                              {t.expired}
                            </p>
                          ) : (
                            <p
                              className={`text-2xl font-bold ${timeLeft <= 10 ? "text-primary-red animate-pulse" : "text-verified-green"}`}
                            >
                              {timeLeft} {t.seconds}
                            </p>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          {!isExpired && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRejectClick(request)}
                                disabled={isProcessing}
                              >
                                {isProcessing ? t.rejecting : t.reject}
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleAccept(request.id)}
                                disabled={isProcessing}
                              >
                                {isProcessing ? t.accepting : t.accept}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {rejectingRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">{t.confirmReject}</h2>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  {t.rejectionReason}
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder={t.rejectionPlaceholder}
                  className="w-full px-4 py-3 border-2 border-foreground focus:outline-none focus:ring-2 focus:ring-primary-blue resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setRejectingRequest(null)}
                  className="flex-1"
                  disabled={processingId !== null}
                >
                  {t.cancel}
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleConfirmReject}
                  disabled={processingId !== null}
                  className="flex-1 bg-primary-red text-white hover:bg-primary-red/80"
                >
                  {processingId ? t.rejecting : t.reject}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}
