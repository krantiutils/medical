"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDisplayName } from "@/lib/professional-display";

interface VerificationRequest {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  government_id_url: string | null;
  certificate_url: string | null;
  admin_notes: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by_name: string | null;
  professional: {
    id: string;
    type: string;
    registration_number: string;
    full_name: string;
    slug: string;
  };
}

export default function DashboardClaimsPage() {
  const { data: session, status } = useSession();
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en";

  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);

  // Translations
  const t = {
    en: {
      title: "My Verification Requests",
      subtitle: "Track the status of your profile verification claims",
      noRequests: "No Verification Requests",
      noRequestsMessage: "You haven't submitted any verification requests yet. Search for your profile and start the claim process.",
      claimProfile: "Claim Your Profile",
      statusPending: "Pending Review",
      statusApproved: "Approved",
      statusRejected: "Rejected",
      professional: "Professional",
      registrationNumber: "Registration Number",
      submittedAt: "Submitted",
      reviewedAt: "Reviewed",
      reviewedBy: "Reviewed By",
      rejectionReason: "Rejection Reason",
      viewProfile: "View Profile",
      viewDocuments: "View Documents",
      submitNewRequest: "Submit New Request",
      governmentId: "Government ID",
      certificate: "Professional Certificate",
      closeModal: "Close",
      loginRequired: "Please log in to view your verification requests",
      login: "Login",
      doctor: "Doctor",
      dentist: "Dentist",
      pharmacist: "Pharmacist",
      editProfile: "Edit Profile",
      dashboardNav: "Dashboard",
    },
    ne: {
      title: "मेरा प्रमाणीकरण अनुरोधहरू",
      subtitle: "तपाईंको प्रोफाइल प्रमाणीकरण दाबीहरूको स्थिति ट्र्याक गर्नुहोस्",
      noRequests: "कुनै प्रमाणीकरण अनुरोधहरू छैनन्",
      noRequestsMessage: "तपाईंले अझै कुनै प्रमाणीकरण अनुरोधहरू पेश गर्नुभएको छैन। आफ्नो प्रोफाइल खोज्नुहोस् र दाबी प्रक्रिया सुरु गर्नुहोस्।",
      claimProfile: "आफ्नो प्रोफाइल दाबी गर्नुहोस्",
      statusPending: "समीक्षा विचाराधीन",
      statusApproved: "स्वीकृत",
      statusRejected: "अस्वीकृत",
      professional: "पेशेवर",
      registrationNumber: "दर्ता नम्बर",
      submittedAt: "पेश गरिएको",
      reviewedAt: "समीक्षा गरिएको",
      reviewedBy: "समीक्षा गर्ने",
      rejectionReason: "अस्वीकृतिको कारण",
      viewProfile: "प्रोफाइल हेर्नुहोस्",
      viewDocuments: "कागजातहरू हेर्नुहोस्",
      submitNewRequest: "नयाँ अनुरोध पेश गर्नुहोस्",
      governmentId: "सरकारी परिचय पत्र",
      certificate: "पेशागत प्रमाणपत्र",
      closeModal: "बन्द गर्नुहोस्",
      loginRequired: "कृपया आफ्नो प्रमाणीकरण अनुरोधहरू हेर्न लगइन गर्नुहोस्",
      login: "लगइन गर्नुहोस्",
      doctor: "चिकित्सक",
      dentist: "दन्त चिकित्सक",
      pharmacist: "फार्मासिस्ट",
      editProfile: "प्रोफाइल सम्पादन",
      dashboardNav: "ड्यासबोर्ड",
    },
  };

  const tr = t[lang as keyof typeof t] || t.en;

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/dashboard/claims");

      if (!response.ok) {
        throw new Error("Failed to fetch claims");
      }

      const data = await response.json();
      setRequests(data.requests || []);
    } catch (err) {
      console.error("Error fetching claims:", err);
      setError("Failed to load verification requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchRequests();
    }
  }, [status, fetchRequests]);

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-2 bg-primary-yellow/20 text-primary-yellow border-2 border-primary-yellow px-3 py-1">
            <div className="w-2 h-2 bg-primary-yellow rounded-full animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider">{tr.statusPending}</span>
          </span>
        );
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-2 bg-verified/10 text-verified border-2 border-verified px-3 py-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-xs font-bold uppercase tracking-wider">{tr.statusApproved}</span>
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-2 bg-primary-red/10 text-primary-red border-2 border-primary-red px-3 py-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="text-xs font-bold uppercase tracking-wider">{tr.statusRejected}</span>
          </span>
        );
      default:
        return null;
    }
  };

  // Loading state
  if (status === "loading" || (status === "authenticated" && loading)) {
    return (
      <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
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
              <Link href={`/${lang}/login?callbackUrl=/${lang}/dashboard/claims`}>
                <Button variant="primary">{tr.login}</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">{tr.title}</h1>
            <p className="text-foreground/70">{tr.subtitle}</p>
          </div>
          <div className="flex gap-2 mt-4 sm:mt-0">
            <Link href={`/${lang}/dashboard/profile`}>
              <Button variant="outline">{tr.editProfile}</Button>
            </Link>
            <Link href={`/${lang}/claim`}>
              <Button variant="primary">{tr.claimProfile}</Button>
            </Link>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-primary-red/10 border-2 border-primary-red text-primary-red p-4 mb-6">
            {error}
          </div>
        )}

        {/* No requests */}
        {!loading && requests.length === 0 && (
          <Card decorator="yellow" decoratorPosition="top-right">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 bg-primary-yellow/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-primary-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">{tr.noRequests}</h2>
              <p className="text-foreground/60 mb-6 max-w-md mx-auto">{tr.noRequestsMessage}</p>
              <Link href={`/${lang}/claim`}>
                <Button variant="primary">{tr.claimProfile}</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Requests list */}
        {!loading && requests.length > 0 && (
          <div className="space-y-4">
            {requests.map((request) => (
              <Card
                key={request.id}
                decorator={request.status === "APPROVED" ? "blue" : request.status === "REJECTED" ? "red" : "yellow"}
                decoratorPosition="top-left"
              >
                <CardContent className="py-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    {/* Professional info */}
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-foreground/10 border-2 border-foreground flex items-center justify-center flex-shrink-0">
                          <span className="text-lg font-bold">{request.professional.full_name.charAt(0)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={`text-xs font-bold uppercase tracking-widest ${getTypeColor(request.professional.type)}`}>
                            {getTypeLabel(request.professional.type)}
                          </span>
                          <h3 className="text-lg font-bold text-foreground truncate">
                            {getDisplayName(request.professional)}
                          </h3>
                          <p className="text-sm text-foreground/60">
                            {tr.registrationNumber}: {request.professional.registration_number}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Status and dates */}
                    <div className="lg:text-right">
                      <div className="mb-2">{getStatusBadge(request.status)}</div>
                      <p className="text-xs text-foreground/60">
                        {tr.submittedAt}: {formatDate(request.submitted_at)}
                      </p>
                      {request.reviewed_at && (
                        <p className="text-xs text-foreground/60">
                          {tr.reviewedAt}: {formatDate(request.reviewed_at)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Rejection reason */}
                  {request.status === "REJECTED" && request.admin_notes && (
                    <div className="mt-4 pt-4 border-t-2 border-foreground/10">
                      <div className="bg-primary-red/5 border-l-4 border-primary-red p-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-primary-red mb-1">
                          {tr.rejectionReason}
                        </p>
                        <p className="text-foreground">{request.admin_notes}</p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-4 pt-4 border-t-2 border-foreground/10 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedRequest(request)}>
                      {tr.viewDocuments}
                    </Button>
                    <Link href={`/${lang}/doctor/${request.professional.slug}`}>
                      <Button variant="ghost" size="sm">{tr.viewProfile}</Button>
                    </Link>
                    {request.status === "REJECTED" && (
                      <Link href={`/${lang}/claim/${request.professional.id}/verify`}>
                        <Button variant="primary" size="sm">{tr.submitNewRequest}</Button>
                      </Link>
                    )}
                    {request.status === "APPROVED" && (
                      <Link href={`/${lang}/dashboard/profile`}>
                        <Button variant="primary" size="sm">{tr.editProfile}</Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Document viewer modal */}
        {selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-background border-4 border-foreground shadow-[8px_8px_0_0_#121212] max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-foreground">
                    {getDisplayName(selectedRequest.professional)}
                  </h3>
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="w-10 h-10 border-2 border-foreground flex items-center justify-center hover:bg-foreground/10"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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

                {/* Request details */}
                <div className="mt-6 pt-6 border-t-2 border-foreground/20">
                  <div className="flex items-center justify-between">
                    <div>
                      {getStatusBadge(selectedRequest.status)}
                    </div>
                    <div className="text-right text-sm text-foreground/60">
                      <p>{tr.submittedAt}: {formatDate(selectedRequest.submitted_at)}</p>
                      {selectedRequest.reviewed_at && (
                        <p>{tr.reviewedAt}: {formatDate(selectedRequest.reviewed_at)}</p>
                      )}
                    </div>
                  </div>

                  {/* Rejection reason in modal */}
                  {selectedRequest.status === "REJECTED" && selectedRequest.admin_notes && (
                    <div className="mt-4 bg-primary-red/5 border-l-4 border-primary-red p-4">
                      <p className="text-xs font-bold uppercase tracking-widest text-primary-red mb-1">
                        {tr.rejectionReason}
                      </p>
                      <p className="text-foreground">{selectedRequest.admin_notes}</p>
                    </div>
                  )}
                </div>

                {/* Modal actions */}
                <div className="mt-6 pt-6 border-t-2 border-foreground/20 flex flex-wrap gap-4 justify-end">
                  <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                    {tr.closeModal}
                  </Button>
                  {selectedRequest.status === "REJECTED" && (
                    <Link href={`/${lang}/claim/${selectedRequest.professional.id}/verify`}>
                      <Button variant="primary">{tr.submitNewRequest}</Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
