"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";

interface BookConsultationButtonProps {
  doctorId: string;
  doctorName: string;
  fee: number;
  isAvailableNow: boolean;
  telemedicineEnabled: boolean;
}

export function BookConsultationButton({
  doctorId,
  doctorName,
  fee,
  isAvailableNow,
  telemedicineEnabled,
}: BookConsultationButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en";

  const [showModal, setShowModal] = useState(false);
  const [bookingType, setBookingType] = useState<"scheduled" | "instant">("scheduled");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Family member state
  const [familyMembers, setFamilyMembers] = useState<{ id: string; name: string; relation: string }[]>([]);
  const [selectedFamilyMemberId, setSelectedFamilyMemberId] = useState("");
  const [familyMembersLoaded, setFamilyMembersLoaded] = useState(false);

  const t = {
    en: {
      bookVideoConsultation: "Book Video Consultation",
      availableNow: "Available Now",
      loginToBook: "Login to Book",
      scheduleConsultation: "Schedule Consultation",
      instantConsultation: "Instant Consultation",
      instantDesc: "Connect with the doctor right now",
      scheduledDesc: "Book a slot for a later time",
      selectDate: "Select Date",
      selectTime: "Select Time",
      chiefComplaint: "What brings you in today?",
      chiefComplaintPlaceholder: "Describe your symptoms or reason for consultation...",
      consultationFee: "Consultation Fee",
      proceedToPayment: "Proceed to Payment",
      bookNow: "Connect Now",
      cancel: "Cancel",
      bookingWith: "Video consultation with",
      errorBooking: "Failed to book consultation. Please try again.",
      invalidTime: "Please select a valid date and time (at least 30 minutes from now)",
      bookingFor: "Booking For",
      myself: "Myself",
      familyMember: "Family Member",
      selectFamilyMember: "Select family member",
    },
    ne: {
      bookVideoConsultation: "भिडियो परामर्श बुक गर्नुहोस्",
      availableNow: "अहिले उपलब्ध",
      loginToBook: "बुक गर्न लगइन गर्नुहोस्",
      scheduleConsultation: "परामर्श समय तालिका",
      instantConsultation: "तत्काल परामर्श",
      instantDesc: "अहिले नै डाक्टरसँग जडान हुनुहोस्",
      scheduledDesc: "पछिको समयको लागि स्लट बुक गर्नुहोस्",
      selectDate: "मिति छान्नुहोस्",
      selectTime: "समय छान्नुहोस्",
      chiefComplaint: "आज तपाईंलाई के समस्या छ?",
      chiefComplaintPlaceholder: "तपाईंको लक्षण वा परामर्शको कारण वर्णन गर्नुहोस्...",
      consultationFee: "परामर्श शुल्क",
      proceedToPayment: "भुक्तानीमा जानुहोस्",
      bookNow: "अहिले जडान गर्नुहोस्",
      cancel: "रद्द गर्नुहोस्",
      bookingWith: "भिडियो परामर्श",
      errorBooking: "परामर्श बुक गर्न असफल। कृपया पुन: प्रयास गर्नुहोस्।",
      invalidTime: "कृपया मान्य मिति र समय छान्नुहोस् (अहिलेबाट कम्तिमा ३० मिनेट)",
      bookingFor: "कसको लागि बुकिङ",
      myself: "आफ्नो लागि",
      familyMember: "परिवारको सदस्य",
      selectFamilyMember: "परिवारको सदस्य छान्नुहोस्",
    },
  };

  const tr = t[lang as keyof typeof t] || t.en;

  // Fetch family members when modal opens
  const handleOpenModal = () => {
    setShowModal(true);
    if (!familyMembersLoaded) {
      fetch("/api/patient/family-members")
        .then((res) => res.json())
        .then((data) => {
          setFamilyMembers(
            (data.family_members || []).map((m: { id: string; name: string; relation: string }) => ({
              id: m.id,
              name: m.name,
              relation: m.relation,
            }))
          );
          setFamilyMembersLoaded(true);
        })
        .catch((err) => console.error("Error fetching family members:", err));
    }
  };

  if (!telemedicineEnabled) {
    return null;
  }

  const handleBooking = async () => {
    setLoading(true);
    setError(null);

    try {
      let scheduled_at: string | null = null;

      if (bookingType === "scheduled") {
        if (!scheduledDate || !scheduledTime) {
          setError(tr.invalidTime);
          setLoading(false);
          return;
        }

        const dateTime = new Date(`${scheduledDate}T${scheduledTime}`);
        const now = new Date();
        const minTime = new Date(now.getTime() + 30 * 60 * 1000);

        if (dateTime < minTime) {
          setError(tr.invalidTime);
          setLoading(false);
          return;
        }

        scheduled_at = dateTime.toISOString();
      }

      const response = await fetch("/api/telemedicine/consultations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          doctor_id: doctorId,
          type: bookingType === "instant" ? "INSTANT" : "SCHEDULED",
          scheduled_at,
          chief_complaint: chiefComplaint || null,
          family_member_id: selectedFamilyMemberId || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || tr.errorBooking);
        return;
      }

      // Redirect to consultation page
      router.push(`/${lang}/dashboard/consultations/${data.consultation.id}`);
    } catch (err) {
      console.error("Booking error:", err);
      setError(tr.errorBooking);
    } finally {
      setLoading(false);
    }
  };

  // Generate min date (today) and min time for scheduling
  const now = new Date();
  const minDate = now.toISOString().split("T")[0];

  if (!session) {
    return (
      <Button
        variant="primary"
        onClick={() => router.push(`/${lang}/login?callbackUrl=/${lang}/doctor/${doctorId}`)}
        className="w-full"
      >
        <svg
          className="w-5 h-5 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
        {tr.loginToBook}
      </Button>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <Button
          variant="primary"
          onClick={handleOpenModal}
          className="w-full"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          {tr.bookVideoConsultation}
        </Button>

        {isAvailableNow && (
          <div className="flex items-center justify-center gap-2 text-verified text-sm font-bold">
            <span className="w-2 h-2 bg-verified rounded-full animate-pulse" />
            {tr.availableNow}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-4 border-foreground shadow-[8px_8px_0_0_#121212] max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-4 border-b-4 border-foreground bg-primary-blue">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-primary-blue"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-white/70 uppercase tracking-wider">{tr.bookingWith}</p>
                    <h3 className="text-lg font-bold text-white">{doctorName}</h3>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white hover:text-white/80"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Booking Type Selection */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setBookingType("scheduled")}
                  className={`p-3 border-2 text-left transition-all ${
                    bookingType === "scheduled"
                      ? "border-primary-blue bg-primary-blue/10"
                      : "border-foreground/30 hover:border-foreground/50"
                  }`}
                >
                  <svg
                    className={`w-6 h-6 mb-1 ${
                      bookingType === "scheduled" ? "text-primary-blue" : "text-foreground/60"
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="font-bold text-sm">{tr.scheduleConsultation}</p>
                  <p className="text-xs text-foreground/60">{tr.scheduledDesc}</p>
                </button>

                {isAvailableNow && (
                  <button
                    type="button"
                    onClick={() => setBookingType("instant")}
                    className={`p-3 border-2 text-left transition-all ${
                      bookingType === "instant"
                        ? "border-verified bg-verified/10"
                        : "border-foreground/30 hover:border-foreground/50"
                    }`}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <svg
                        className={`w-6 h-6 ${
                          bookingType === "instant" ? "text-verified" : "text-foreground/60"
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      <span className="w-2 h-2 bg-verified rounded-full animate-pulse" />
                    </div>
                    <p className="font-bold text-sm">{tr.instantConsultation}</p>
                    <p className="text-xs text-foreground/60">{tr.instantDesc}</p>
                  </button>
                )}
              </div>

              {/* Date/Time for scheduled */}
              {bookingType === "scheduled" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-foreground/60 mb-1">
                      {tr.selectDate}
                    </label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={minDate}
                      className="w-full px-3 py-2 bg-white border-2 border-foreground focus:outline-none focus:border-primary-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-foreground/60 mb-1">
                      {tr.selectTime}
                    </label>
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full px-3 py-2 bg-white border-2 border-foreground focus:outline-none focus:border-primary-blue"
                    />
                  </div>
                </div>
              )}

              {/* Family Member Selector */}
              {familyMembers.length > 0 && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-foreground/60 mb-1">
                    {tr.bookingFor}
                  </label>
                  <select
                    value={selectedFamilyMemberId}
                    onChange={(e) => setSelectedFamilyMemberId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border-2 border-foreground focus:outline-none focus:border-primary-blue"
                  >
                    <option value="">{tr.myself}</option>
                    {familyMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.relation.toLowerCase()})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Chief Complaint */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-foreground/60 mb-1">
                  {tr.chiefComplaint}
                </label>
                <textarea
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  placeholder={tr.chiefComplaintPlaceholder}
                  rows={3}
                  className="w-full px-3 py-2 bg-white border-2 border-foreground focus:outline-none focus:border-primary-blue resize-none"
                />
              </div>

              {/* Fee Display */}
              <div className="flex items-center justify-between p-3 bg-foreground/5 border-2 border-foreground/10">
                <span className="font-bold">{tr.consultationFee}</span>
                <span className="text-xl font-bold text-primary-blue">
                  NPR {fee.toLocaleString()}
                </span>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-primary-red/10 border-2 border-primary-red text-primary-red text-sm">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="flex-1"
                >
                  {tr.cancel}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleBooking}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    </span>
                  ) : bookingType === "instant" ? (
                    tr.bookNow
                  ) : (
                    tr.proceedToPayment
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
