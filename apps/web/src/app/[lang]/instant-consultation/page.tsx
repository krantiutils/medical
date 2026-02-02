"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Doctor {
  id: string;
  full_name: string;
  full_name_ne: string | null;
  photo_url: string | null;
  slug: string;
  type: "DOCTOR" | "DENTIST" | "PHARMACIST";
  degree: string | null;
  specialties: string[];
  address: string | null;
  telemedicine_fee: string | null;
  verified: boolean;
}

interface InstantRequest {
  id: string;
  status: string;
  acceptance_deadline: string | null;
  doctor: Doctor;
  fee: string;
}

const translations = {
  en: {
    title: "Instant Consultation",
    subtitle: "Connect with available doctors now",
    availableDoctors: "Available Doctors",
    noAvailableDoctors: "No doctors available right now",
    noAvailableDoctorsDescription:
      "Check back later or browse scheduled consultations",
    filterByType: "Filter by Type",
    filterBySpecialty: "Filter by Specialty",
    allTypes: "All Types",
    allSpecialties: "All Specialties",
    consultationFee: "Consultation Fee",
    availableNow: "Available Now",
    startConsultation: "Start Instant Consultation",
    requestSent: "Request Sent",
    waitingForAcceptance: "Waiting for doctor to accept...",
    timeRemaining: "Time remaining",
    requestExpired: "Request Expired",
    requestExpiredDescription:
      "The doctor did not respond in time. Try another doctor.",
    requestRejected: "Request Rejected",
    requestRejectedDescription:
      "The doctor is unable to take your consultation right now.",
    requestAccepted: "Request Accepted!",
    joiningCall: "Joining video call...",
    tryAnotherDoctor: "Try Another Doctor",
    cancel: "Cancel",
    confirmRequest: "Confirm Request",
    confirmRequestDescription:
      "You are about to request an instant consultation with",
    chiefComplaint: "Reason for consultation",
    chiefComplaintPlaceholder: "Describe your symptoms or concerns briefly...",
    fee: "Fee",
    free: "Free",
    proceedToPayment: "Proceed to Payment",
    sendRequest: "Send Request",
    loginRequired: "Please log in to start an instant consultation",
    login: "Login",
    seconds: "seconds",
    doctor: "Doctor",
    dentist: "Dentist",
    pharmacist: "Pharmacist",
    verified: "Verified",
    nprSymbol: "NPR",
  },
  ne: {
    title: "तत्काल परामर्श",
    subtitle: "उपलब्ध डाक्टरहरूसँग अहिले जोडिनुहोस्",
    availableDoctors: "उपलब्ध डाक्टरहरू",
    noAvailableDoctors: "अहिले कुनै डाक्टर उपलब्ध छैनन्",
    noAvailableDoctorsDescription:
      "पछि फेरि जाँच गर्नुहोस् वा तालिकाबद्ध परामर्श हेर्नुहोस्",
    filterByType: "प्रकार अनुसार फिल्टर",
    filterBySpecialty: "विशेषज्ञता अनुसार फिल्टर",
    allTypes: "सबै प्रकार",
    allSpecialties: "सबै विशेषज्ञता",
    consultationFee: "परामर्श शुल्क",
    availableNow: "अहिले उपलब्ध",
    startConsultation: "तत्काल परामर्श सुरु गर्नुहोस्",
    requestSent: "अनुरोध पठाइयो",
    waitingForAcceptance: "डाक्टरले स्वीकार गर्ने कुर्दै...",
    timeRemaining: "बाँकी समय",
    requestExpired: "अनुरोध समाप्त भयो",
    requestExpiredDescription:
      "डाक्टरले समयमा जवाफ दिएनन्। अर्को डाक्टर प्रयास गर्नुहोस्।",
    requestRejected: "अनुरोध अस्वीकृत",
    requestRejectedDescription:
      "डाक्टर अहिले तपाईंको परामर्श लिन असक्षम छन्।",
    requestAccepted: "अनुरोध स्वीकृत!",
    joiningCall: "भिडियो कलमा जोडिँदै...",
    tryAnotherDoctor: "अर्को डाक्टर प्रयास गर्नुहोस्",
    cancel: "रद्द गर्नुहोस्",
    confirmRequest: "अनुरोध पुष्टि गर्नुहोस्",
    confirmRequestDescription:
      "तपाईं यससँग तत्काल परामर्श अनुरोध गर्न लाग्नुभएको छ",
    chiefComplaint: "परामर्शको कारण",
    chiefComplaintPlaceholder:
      "आफ्ना लक्षण वा चिन्ताहरू संक्षेपमा वर्णन गर्नुहोस्...",
    fee: "शुल्क",
    free: "निःशुल्क",
    proceedToPayment: "भुक्तानीमा जानुहोस्",
    sendRequest: "अनुरोध पठाउनुहोस्",
    loginRequired: "तत्काल परामर्श सुरु गर्न कृपया लगइन गर्नुहोस्",
    login: "लगइन गर्नुहोस्",
    seconds: "सेकेन्ड",
    doctor: "डाक्टर",
    dentist: "दन्त चिकित्सक",
    pharmacist: "औषधि विशेषज्ञ",
    verified: "प्रमाणित",
    nprSymbol: "रु",
  },
};

export default function InstantConsultationPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const lang = (params?.lang as "en" | "ne") || "en";
  const t = translations[lang];

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("");

  // Modal state
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Active request state
  const [activeRequest, setActiveRequest] = useState<InstantRequest | null>(
    null
  );
  const [timeLeft, setTimeLeft] = useState(0);

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (typeFilter) queryParams.set("type", typeFilter);
      if (specialtyFilter) queryParams.set("specialty", specialtyFilter);

      const res = await fetch(
        `/api/telemedicine/instant/available-doctors?${queryParams.toString()}`
      );
      const data = await res.json();
      setDoctors(data.doctors || []);
      setSpecialties(data.specialties || []);
    } catch (error) {
      console.error("Failed to fetch doctors:", error);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, specialtyFilter]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  // Poll for active request status
  useEffect(() => {
    if (!activeRequest) return;

    const checkStatus = async () => {
      try {
        const res = await fetch(
          `/api/telemedicine/instant/${activeRequest.id}`
        );
        const data = await res.json();

        if (data.consultation) {
          const consultation = data.consultation;

          if (consultation.status === "WAITING") {
            // Request accepted - redirect to call
            router.push(`/${lang}/dashboard/consultations/${consultation.id}/call`);
            return;
          }

          if (
            consultation.status === "REJECTED" ||
            consultation.status === "EXPIRED"
          ) {
            setActiveRequest({
              ...activeRequest,
              status: consultation.status,
            });
            return;
          }

          // Update deadline time
          if (consultation.acceptance_deadline) {
            const deadline = new Date(consultation.acceptance_deadline);
            const now = new Date();
            const remaining = Math.max(
              0,
              Math.floor((deadline.getTime() - now.getTime()) / 1000)
            );
            setTimeLeft(remaining);

            if (remaining === 0) {
              setActiveRequest({
                ...activeRequest,
                status: "EXPIRED",
              });
            }
          }
        }
      } catch (error) {
        console.error("Failed to check status:", error);
      }
    };

    const interval = setInterval(checkStatus, 2000); // Poll every 2 seconds
    checkStatus(); // Check immediately

    return () => clearInterval(interval);
  }, [activeRequest, lang, router]);

  const handleStartConsultation = (doctor: Doctor) => {
    if (sessionStatus !== "authenticated") {
      return;
    }
    setSelectedDoctor(doctor);
    setChiefComplaint("");
  };

  const handleSubmitRequest = async () => {
    if (!selectedDoctor || !session?.user) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/telemedicine/instant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctor_id: selectedDoctor.id,
          chief_complaint: chiefComplaint,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setActiveRequest({
          id: data.consultation.id,
          status: "PENDING_ACCEPTANCE",
          acceptance_deadline: data.acceptanceDeadline,
          doctor: selectedDoctor,
          fee: data.consultation.fee,
        });
        setTimeLeft(data.timeoutSeconds || 60);
        setSelectedDoctor(null);
      } else {
        alert(data.error || "Failed to send request");
      }
    } catch (error) {
      console.error("Failed to submit request:", error);
      alert("Failed to send request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRequest = () => {
    setActiveRequest(null);
    setTimeLeft(0);
  };

  const handleTryAnother = () => {
    setActiveRequest(null);
    setTimeLeft(0);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "DOCTOR":
        return t.doctor;
      case "DENTIST":
        return t.dentist;
      case "PHARMACIST":
        return t.pharmacist;
      default:
        return type;
    }
  };

  // Show login prompt if not authenticated
  if (sessionStatus === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (sessionStatus === "unauthenticated") {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              <h1 className="text-2xl font-bold mb-4">{t.loginRequired}</h1>
              <Link href={`/${lang}/login?callbackUrl=/${lang}/instant-consultation`}>
                <Button>{t.login}</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show active request status
  if (activeRequest) {
    const isPending = activeRequest.status === "PENDING_ACCEPTANCE";
    const isExpired = activeRequest.status === "EXPIRED";
    const isRejected = activeRequest.status === "REJECTED";

    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              {isPending && (
                <>
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary-yellow flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-foreground border-t-transparent rounded-full animate-spin" />
                  </div>
                  <h1 className="text-2xl font-bold mb-2">{t.requestSent}</h1>
                  <p className="text-gray-600 mb-4">{t.waitingForAcceptance}</p>
                  <div className="mb-6">
                    <p className="text-sm text-gray-500">{t.timeRemaining}</p>
                    <p className="text-3xl font-bold text-primary-red">
                      {timeLeft} {t.seconds}
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                    {activeRequest.doctor.photo_url ? (
                      <Image
                        src={activeRequest.doctor.photo_url}
                        alt={activeRequest.doctor.full_name}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary-blue text-white flex items-center justify-center font-bold">
                        {activeRequest.doctor.full_name.charAt(0)}
                      </div>
                    )}
                    <div className="text-left">
                      <p className="font-semibold">
                        {lang === "ne" && activeRequest.doctor.full_name_ne
                          ? activeRequest.doctor.full_name_ne
                          : activeRequest.doctor.full_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {getTypeLabel(activeRequest.doctor.type)}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={handleCancelRequest}>
                    {t.cancel}
                  </Button>
                </>
              )}

              {isExpired && (
                <>
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gray-300 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold mb-2">{t.requestExpired}</h1>
                  <p className="text-gray-600 mb-6">
                    {t.requestExpiredDescription}
                  </p>
                  <Button onClick={handleTryAnother}>
                    {t.tryAnotherDoctor}
                  </Button>
                </>
              )}

              {isRejected && (
                <>
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary-red flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-white"
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
                  </div>
                  <h1 className="text-2xl font-bold mb-2">{t.requestRejected}</h1>
                  <p className="text-gray-600 mb-6">
                    {t.requestRejectedDescription}
                  </p>
                  <Button onClick={handleTryAnother}>
                    {t.tryAnotherDoctor}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-primary-blue text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-black uppercase mb-4">
            {t.title}
          </h1>
          <p className="text-xl opacity-90">{t.subtitle}</p>
        </div>
      </section>

      {/* Filters */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-4 mb-8">
          <div>
            <label className="block text-sm font-medium mb-1">
              {t.filterByType}
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border-2 border-foreground bg-white focus:outline-none focus:ring-2 focus:ring-primary-blue"
            >
              <option value="">{t.allTypes}</option>
              <option value="DOCTOR">{t.doctor}</option>
              <option value="DENTIST">{t.dentist}</option>
              <option value="PHARMACIST">{t.pharmacist}</option>
            </select>
          </div>

          {specialties.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1">
                {t.filterBySpecialty}
              </label>
              <select
                value={specialtyFilter}
                onChange={(e) => setSpecialtyFilter(e.target.value)}
                className="px-4 py-2 border-2 border-foreground bg-white focus:outline-none focus:ring-2 focus:ring-primary-blue"
              >
                <option value="">{t.allSpecialties}</option>
                {specialties.map((specialty) => (
                  <option key={specialty} value={specialty}>
                    {specialty}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Doctors List */}
        <h2 className="text-2xl font-bold mb-6">
          {t.availableDoctors} ({doctors.length})
        </h2>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p>Loading...</p>
          </div>
        ) : doctors.length === 0 ? (
          <Card className="p-8 text-center">
            <h3 className="text-xl font-bold mb-2">{t.noAvailableDoctors}</h3>
            <p className="text-gray-600">{t.noAvailableDoctorsDescription}</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doctor) => (
              <Card
                key={doctor.id}
                decorator={
                  doctor.type === "DOCTOR"
                    ? "blue"
                    : doctor.type === "DENTIST"
                      ? "red"
                      : "yellow"
                }
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    {doctor.photo_url ? (
                      <Image
                        src={doctor.photo_url}
                        alt={doctor.full_name}
                        width={64}
                        height={64}
                        className="w-16 h-16 rounded-full object-cover border-2 border-foreground"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary-blue text-white flex items-center justify-center text-xl font-bold border-2 border-foreground">
                        {doctor.full_name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">
                        {lang === "ne" && doctor.full_name_ne
                          ? doctor.full_name_ne
                          : doctor.full_name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 bg-primary-blue text-white uppercase">
                          {getTypeLabel(doctor.type)}
                        </span>
                        {doctor.verified && (
                          <span className="text-xs px-2 py-0.5 bg-verified-green text-white">
                            {t.verified}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {doctor.degree && (
                    <p className="text-sm text-gray-600 mb-2">{doctor.degree}</p>
                  )}

                  {doctor.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {doctor.specialties.slice(0, 3).map((specialty) => (
                        <span
                          key={specialty}
                          className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">
                        {t.consultationFee}
                      </p>
                      <p className="font-bold text-lg">
                        {doctor.telemedicine_fee
                          ? `${t.nprSymbol} ${Number(doctor.telemedicine_fee).toLocaleString()}`
                          : t.free}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleStartConsultation(doctor)}
                    >
                      {t.startConsultation}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Confirmation Modal */}
      {selectedDoctor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">{t.confirmRequest}</h2>
              <p className="text-gray-600 mb-4">
                {t.confirmRequestDescription}
              </p>

              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg mb-6">
                {selectedDoctor.photo_url ? (
                  <Image
                    src={selectedDoctor.photo_url}
                    alt={selectedDoctor.full_name}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary-blue text-white flex items-center justify-center text-xl font-bold">
                    {selectedDoctor.full_name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-bold text-lg">
                    {lang === "ne" && selectedDoctor.full_name_ne
                      ? selectedDoctor.full_name_ne
                      : selectedDoctor.full_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {getTypeLabel(selectedDoctor.type)}
                  </p>
                  <p className="text-sm font-medium mt-1">
                    {t.fee}:{" "}
                    {selectedDoctor.telemedicine_fee
                      ? `${t.nprSymbol} ${Number(selectedDoctor.telemedicine_fee).toLocaleString()}`
                      : t.free}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  {t.chiefComplaint}
                </label>
                <textarea
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  placeholder={t.chiefComplaintPlaceholder}
                  className="w-full px-4 py-3 border-2 border-foreground focus:outline-none focus:ring-2 focus:ring-primary-blue resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setSelectedDoctor(null)}
                  className="flex-1"
                >
                  {t.cancel}
                </Button>
                <Button
                  onClick={handleSubmitRequest}
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? "..." : t.sendRequest}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
