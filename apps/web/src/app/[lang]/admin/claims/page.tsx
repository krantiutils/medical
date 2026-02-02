"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface VerificationRequest {
  id: string;
  status: string;
  government_id_url: string | null;
  certificate_url: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  professional: {
    id: string;
    type: string;
    registration_number: string;
    full_name: string;
    slug: string;
  };
}

export default function AdminClaimsPage() {
  const { data: session, status } = useSession();
  const params = useParams<{ lang: string }>();
  const router = useRouter();
  const lang = params?.lang || "en";

  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);

  // Translations
  const t = {
    en: {
      title: "Claims Dashboard",
      subtitle: "Review and manage profile verification requests",
      pendingClaims: "Pending Claims",
      noPending: "No pending verification requests",
      userEmail: "User Email",
      userName: "User Name",
      professional: "Professional",
      registrationNumber: "Registration Number",
      submittedAt: "Submitted",
      viewDocuments: "View Documents",
      approve: "Approve",
      reject: "Reject",
      approving: "Approving...",
      rejecting: "Rejecting...",
      governmentId: "Government ID",
      certificate: "Professional Certificate",
      closeModal: "Close",
      confirmApprove: "Are you sure you want to approve this claim?",
      confirmReject: "Are you sure you want to reject this claim?",
      accessDenied: "Access Denied",
      accessDeniedMessage: "You do not have permission to access this page.",
      goHome: "Go Home",
      loginRequired: "Please log in to access this page",
      login: "Login",
      viewProfile: "View Profile",
      doctor: "Doctor",
      dentist: "Dentist",
      pharmacist: "Pharmacist",
    },
    ne: {
      title: "दाबी ड्यासबोर्ड",
      subtitle: "प्रोफाइल प्रमाणीकरण अनुरोधहरू समीक्षा र व्यवस्थापन गर्नुहोस्",
      pendingClaims: "विचाराधीन दाबीहरू",
      noPending: "कुनै विचाराधीन प्रमाणीकरण अनुरोधहरू छैनन्",
      userEmail: "प्रयोगकर्ता इमेल",
      userName: "प्रयोगकर्ता नाम",
      professional: "पेशेवर",
      registrationNumber: "दर्ता नम्बर",
      submittedAt: "पेश गरिएको",
      viewDocuments: "कागजातहरू हेर्नुहोस्",
      approve: "स्वीकृत गर्नुहोस्",
      reject: "अस्वीकार गर्नुहोस्",
      approving: "स्वीकृत गर्दै...",
      rejecting: "अस्वीकार गर्दै...",
      governmentId: "सरकारी परिचय पत्र",
      certificate: "पेशागत प्रमाणपत्र",
      closeModal: "बन्द गर्नुहोस्",
      confirmApprove: "के तपाईं यो दाबी स्वीकृत गर्न निश्चित हुनुहुन्छ?",
      confirmReject: "के तपाईं यो दाबी अस्वीकार गर्न निश्चित हुनुहुन्छ?",
      accessDenied: "पहुँच अस्वीकृत",
      accessDeniedMessage: "तपाईंसँग यो पृष्ठमा पहुँच गर्न अनुमति छैन।",
      goHome: "गृहपृष्ठमा जानुहोस्",
      loginRequired: "यो पृष्ठमा पहुँच गर्न लगइन गर्नुहोस्",
      login: "लगइन गर्नुहोस्",
      viewProfile: "प्रोफाइल हेर्नुहोस्",
      doctor: "चिकित्सक",
      dentist: "दन्त चिकित्सक",
      pharmacist: "फार्मासिस्ट",
    },
  };

  const tr = t[lang as keyof typeof t] || t.en;

  const fetchPendingRequests = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/claims");

      if (!response.ok) {
        if (response.status === 401) {
          setError("Unauthorized");
          return;
        }
        if (response.status === 403) {
          setError("Forbidden");
          return;
        }
        throw new Error("Failed to fetch claims");
      }

      const data = await response.json();
      setRequests(data.requests || []);
    } catch (err) {
      console.error("Error fetching claims:", err);
      setError("Failed to load claims");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      fetchPendingRequests();
    }
  }, [status, session?.user?.role, fetchPendingRequests]);

  const handleAction = async (requestId: string, action: "approve" | "reject") => {
    const confirmMessage = action === "approve" ? tr.confirmApprove : tr.confirmReject;
    if (!confirm(confirmMessage)) return;

    setActionLoading(requestId);

    try {
      const response = await fetch(`/api/admin/claims/${requestId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        throw new Error("Action failed");
      }

      // Remove the request from the list
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      setSelectedRequest(null);
    } catch (err) {
      console.error("Error processing action:", err);
      alert("Failed to process action. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(lang === "ne" ? "ne-NP" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      DOCTOR: tr.doctor,
      DENTIST: tr.dentist,
      PHARMACIST: tr.pharmacist,
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      DOCTOR: "text-primary-blue",
      DENTIST: "text-primary-red",
      PHARMACIST: "text-primary-yellow",
    };
    return colors[type] || "text-foreground";
  };

  // Loading state
  if (status === "loading") {
    return (
      <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <Card decorator="blue" decoratorPosition="top-right">
            <CardContent className="py-12 text-center">
              <div className="animate-pulse">
                <div className="w-12 h-12 bg-primary-blue/20 rounded-full mx-auto mb-4" />
                <div className="h-4 bg-foreground/10 rounded w-48 mx-auto" />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Not authenticated
  if (!session) {
    return (
      <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card decorator="red" decoratorPosition="top-right">
            <CardHeader>
              <h1 className="text-3xl font-bold text-foreground">{tr.title}</h1>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/70 mb-6">{tr.loginRequired}</p>
              <Link href={`/${lang}/login?callbackUrl=/${lang}/admin/claims`}>
                <Button variant="primary">{tr.login}</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Not admin
  if (session.user?.role !== "ADMIN") {
    return (
      <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card decorator="red" decoratorPosition="top-right">
            <CardHeader>
              <h1 className="text-3xl font-bold text-foreground">{tr.accessDenied}</h1>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/70 mb-6">{tr.accessDeniedMessage}</p>
              <Link href={`/${lang}`}>
                <Button variant="primary">{tr.goHome}</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">{tr.title}</h1>
          <p className="text-foreground/70">{tr.subtitle}</p>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-primary-red/10 border-2 border-primary-red text-primary-red p-4 mb-6">
            {error}
          </div>
        )}

        {/* Claims list */}
        <Card decorator="blue" decoratorPosition="top-right">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">{tr.pendingClaims}</h2>
              <span className="text-sm text-foreground/60 bg-primary-blue/10 px-3 py-1 border-2 border-primary-blue">
                {requests.length}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-foreground/5 rounded" />
                ))}
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-primary-blue/10 rounded-full mx-auto mb-4 flex items-center justify-center">
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-foreground/60">{tr.noPending}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="border-4 border-foreground bg-white p-4 shadow-[4px_4px_0_0_#121212]"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Professional info */}
                      <div className="flex-1">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-foreground/10 border-2 border-foreground flex items-center justify-center flex-shrink-0">
                            <span className="text-lg font-bold">
                              {request.professional.full_name.charAt(0)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <span
                              className={`text-xs font-bold uppercase tracking-widest ${getTypeColor(
                                request.professional.type
                              )}`}
                            >
                              {getTypeLabel(request.professional.type)}
                            </span>
                            <h3 className="text-lg font-bold text-foreground truncate">
                              {request.professional.type === "PHARMACIST"
                                ? request.professional.full_name
                                : `Dr. ${request.professional.full_name}`}
                            </h3>
                            <p className="text-sm text-foreground/60">
                              {tr.registrationNumber}: {request.professional.registration_number}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* User info */}
                      <div className="lg:text-right">
                        <p className="text-sm font-bold text-foreground">
                          {request.user.name || request.user.email}
                        </p>
                        <p className="text-xs text-foreground/60">{request.user.email}</p>
                        <p className="text-xs text-foreground/40 mt-1">
                          {tr.submittedAt}: {formatDate(request.submitted_at)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 lg:flex-col lg:items-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedRequest(request)}
                        >
                          {tr.viewDocuments}
                        </Button>
                        <Link href={`/${lang}/doctor/${request.professional.slug}`} target="_blank">
                          <Button variant="ghost" size="sm">
                            {tr.viewProfile}
                          </Button>
                        </Link>
                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleAction(request.id, "approve")}
                            disabled={actionLoading === request.id}
                          >
                            {actionLoading === request.id ? tr.approving : tr.approve}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAction(request.id, "reject")}
                            disabled={actionLoading === request.id}
                            className="border-primary-red text-primary-red hover:bg-primary-red/10"
                          >
                            {actionLoading === request.id ? tr.rejecting : tr.reject}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Document viewer modal */}
        {selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-background border-4 border-foreground shadow-[8px_8px_0_0_#121212] max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-foreground">
                    {selectedRequest.professional.type === "PHARMACIST"
                      ? selectedRequest.professional.full_name
                      : `Dr. ${selectedRequest.professional.full_name}`}
                  </h3>
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="w-10 h-10 border-2 border-foreground flex items-center justify-center hover:bg-foreground/10"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Government ID */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-3">
                      {tr.governmentId}
                    </h4>
                    {selectedRequest.government_id_url ? (
                      <div className="border-4 border-foreground bg-white">
                        {selectedRequest.government_id_url.endsWith(".pdf") ? (
                          <div className="p-4 text-center">
                            <a
                              href={selectedRequest.government_id_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-blue underline font-bold"
                            >
                              View PDF Document
                            </a>
                          </div>
                        ) : (
                          <img
                            src={selectedRequest.government_id_url}
                            alt="Government ID"
                            className="w-full h-auto"
                          />
                        )}
                      </div>
                    ) : (
                      <div className="border-4 border-foreground/20 border-dashed p-8 text-center text-foreground/40">
                        No document uploaded
                      </div>
                    )}
                  </div>

                  {/* Certificate */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-3">
                      {tr.certificate}
                    </h4>
                    {selectedRequest.certificate_url ? (
                      <div className="border-4 border-foreground bg-white">
                        {selectedRequest.certificate_url.endsWith(".pdf") ? (
                          <div className="p-4 text-center">
                            <a
                              href={selectedRequest.certificate_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-blue underline font-bold"
                            >
                              View PDF Document
                            </a>
                          </div>
                        ) : (
                          <img
                            src={selectedRequest.certificate_url}
                            alt="Professional Certificate"
                            className="w-full h-auto"
                          />
                        )}
                      </div>
                    ) : (
                      <div className="border-4 border-foreground/20 border-dashed p-8 text-center text-foreground/40">
                        No document uploaded
                      </div>
                    )}
                  </div>
                </div>

                {/* User details */}
                <div className="mt-6 pt-6 border-t-2 border-foreground/20">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-widest text-foreground/60">
                        {tr.userName}
                      </span>
                      <p className="text-foreground font-bold">
                        {selectedRequest.user.name || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-widest text-foreground/60">
                        {tr.userEmail}
                      </span>
                      <p className="text-foreground font-bold">{selectedRequest.user.email}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 pt-6 border-t-2 border-foreground/20 flex flex-wrap gap-4 justify-end">
                  <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                    {tr.closeModal}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleAction(selectedRequest.id, "reject")}
                    disabled={actionLoading === selectedRequest.id}
                    className="border-primary-red text-primary-red hover:bg-primary-red/10"
                  >
                    {actionLoading === selectedRequest.id ? tr.rejecting : tr.reject}
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => handleAction(selectedRequest.id, "approve")}
                    disabled={actionLoading === selectedRequest.id}
                  >
                    {actionLoading === selectedRequest.id ? tr.approving : tr.approve}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
