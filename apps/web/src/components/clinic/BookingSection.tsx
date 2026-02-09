"use client";

import { useState, useEffect } from "react";
import { ProfessionalType } from "@swasthya/database";
import { getDisplayName } from "@/lib/professional-display";

interface Doctor {
  id: string;
  full_name: string;
  type: ProfessionalType;
  degree: string | null;
  specialties: string[] | null;
  role: string | null;
}

interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
  bookedCount: number;
  maxPatients: number;
}

interface SlotsResponse {
  slots: TimeSlot[];
  doctor: {
    id: string;
    name: string;
    type: ProfessionalType;
  };
  clinic: {
    id: string;
    name: string;
  };
  date: string;
  dayOfWeek: number;
  schedule?: {
    startTime: string;
    endTime: string;
    slotDuration: number;
  };
  message?: string;
}

interface BookingSectionProps {
  clinicId: string;
  doctors: Doctor[];
  translations: {
    bookAppointment: string;
    selectDoctor: string;
    selectDate: string;
    selectTime: string;
    availableSlots: string;
    noSlotsAvailable: string;
    doctorNoSchedule: string;
    loading: string;
    selectDoctorFirst: string;
    selectDateFirst: string;
    slotSelected: string;
    continueBooking: string;
    today: string;
    tomorrow: string;
    noDoctorsAvailable: string;
    slotsRemaining: string;
    fullyBooked: string;
    onLeave: string;
    doctor: string;
    dentist: string;
    pharmacist: string;
    permanent: string;
    visiting: string;
    consultant: string;
  };
  lang: string;
}

// Days of week names
const DAYS_OF_WEEK = {
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  ne: ["आइतबार", "सोमबार", "मंगलबार", "बुधबार", "बिहिबार", "शुक्रबार", "शनिबार"],
};

const MONTHS = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  ne: ["जनवरी", "फेब्रुअरी", "मार्च", "अप्रिल", "मे", "जुन", "जुलाई", "अगस्ट", "सेप्टेम्बर", "अक्टोबर", "नोभेम्बर", "डिसेम्बर"],
};

/**
 * Format date for display
 */
function formatDate(date: Date, lang: string): string {
  const day = date.getDate();
  const month = MONTHS[lang === "ne" ? "ne" : "en"][date.getMonth()];
  const dayOfWeek = DAYS_OF_WEEK[lang === "ne" ? "ne" : "en"][date.getDay()];
  return `${dayOfWeek}, ${month} ${day}`;
}

/**
 * Format date to YYYY-MM-DD for API
 */
function formatDateForApi(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get professional type display label
 */
function getProfessionalTypeLabel(type: ProfessionalType, t: BookingSectionProps["translations"]): string {
  switch (type) {
    case "DOCTOR":
      return t.doctor;
    case "DENTIST":
      return t.dentist;
    case "PHARMACIST":
      return t.pharmacist;
    default:
      return t.doctor;
  }
}

/**
 * Get role display label
 */
function getRoleLabel(role: string | null, t: BookingSectionProps["translations"]): string {
  if (!role) return "";
  switch (role.toLowerCase()) {
    case "permanent":
      return t.permanent;
    case "visiting":
      return t.visiting;
    case "consultant":
      return t.consultant;
    default:
      return role;
  }
}

/**
 * Get professional type color
 */
function getProfessionalTypeColor(type: ProfessionalType): string {
  switch (type) {
    case "DOCTOR":
      return "bg-primary-blue";
    case "DENTIST":
      return "bg-primary-red";
    case "PHARMACIST":
      return "bg-primary-yellow text-foreground";
    default:
      return "bg-primary-blue";
  }
}

/**
 * Generate date options for the next 14 days
 */
function generateDateOptions(t: BookingSectionProps["translations"], lang: string): { date: Date; label: string; value: string }[] {
  const dates: { date: Date; label: string; value: string }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    let label: string;
    if (i === 0) {
      label = `${t.today} - ${formatDate(date, lang)}`;
    } else if (i === 1) {
      label = `${t.tomorrow} - ${formatDate(date, lang)}`;
    } else {
      label = formatDate(date, lang);
    }

    dates.push({
      date,
      label,
      value: formatDateForApi(date),
    });
  }

  return dates;
}

export function BookingSection({
  clinicId,
  doctors,
  translations: t,
  lang,
}: BookingSectionProps) {
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const dateOptions = generateDateOptions(t, lang);

  // Fetch available slots when doctor and date are selected
  useEffect(() => {
    async function fetchSlots() {
      if (!selectedDoctor || !selectedDate) {
        setSlots([]);
        setSelectedSlot(null);
        return;
      }

      setLoading(true);
      setError(null);
      setMessage(null);
      setSelectedSlot(null);

      try {
        const response = await fetch(
          `/api/clinic/${clinicId}/slots?doctor_id=${selectedDoctor}&date=${selectedDate}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch slots");
        }

        const data: SlotsResponse = await response.json();

        setSlots(data.slots);
        if (data.message) {
          setMessage(data.message);
        }
      } catch (err) {
        console.error("Error fetching slots:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch slots");
        setSlots([]);
      } finally {
        setLoading(false);
      }
    }

    fetchSlots();
  }, [clinicId, selectedDoctor, selectedDate]);

  // Reset date and slot when doctor changes
  useEffect(() => {
    setSelectedDate("");
    setSelectedSlot(null);
    setSlots([]);
  }, [selectedDoctor]);

  // Count available slots
  const availableSlotCount = slots.filter((slot) => slot.available).length;

  // If no doctors, show empty state
  if (!doctors || doctors.length === 0) {
    return (
      <div className="text-center py-8">
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
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p className="text-foreground/60">{t.noDoctorsAvailable}</p>
      </div>
    );
  }

  const selectedDoctorData = doctors.find((d) => d.id === selectedDoctor);

  return (
    <div className="space-y-6">
      {/* Step 1: Select Doctor */}
      <div>
        <label
          htmlFor="doctor-select"
          className="block text-sm font-bold uppercase tracking-wider text-foreground/60 mb-2"
        >
          {t.selectDoctor}
        </label>
        <select
          id="doctor-select"
          value={selectedDoctor}
          onChange={(e) => setSelectedDoctor(e.target.value)}
          className="w-full p-3 border-4 border-foreground bg-white text-foreground font-medium focus:outline-none focus:border-primary-blue transition-colors"
        >
          <option value="">{t.selectDoctor}...</option>
          {doctors.map((doctor) => {
            const displayName = getDisplayName(doctor);
            const specialty =
              doctor.specialties && doctor.specialties.length > 0
                ? doctor.specialties[0]
                : doctor.degree;

            return (
              <option key={doctor.id} value={doctor.id}>
                {displayName}
                {specialty ? ` - ${specialty}` : ""}
                {doctor.role ? ` (${getRoleLabel(doctor.role, t)})` : ""}
              </option>
            );
          })}
        </select>

        {/* Selected Doctor Info */}
        {selectedDoctorData && (
          <div className="mt-3 p-3 border-2 border-foreground/20 bg-background/50">
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-white border border-foreground ${getProfessionalTypeColor(selectedDoctorData.type)}`}
              >
                {getProfessionalTypeLabel(selectedDoctorData.type, t)}
              </span>
              {selectedDoctorData.role && (
                <span className="px-2 py-0.5 text-xs font-medium bg-foreground/10 border border-foreground/20 text-foreground/70">
                  {getRoleLabel(selectedDoctorData.role, t)}
                </span>
              )}
            </div>
            <p className="font-bold mt-2">
              {getDisplayName(selectedDoctorData)}
            </p>
            {selectedDoctorData.specialties && selectedDoctorData.specialties.length > 0 && (
              <p className="text-sm text-foreground/70">{selectedDoctorData.specialties.join(", ")}</p>
            )}
            {selectedDoctorData.degree && (
              <p className="text-sm text-foreground/70">{selectedDoctorData.degree}</p>
            )}
          </div>
        )}
      </div>

      {/* Step 2: Select Date */}
      {selectedDoctor && (
        <div>
          <label
            htmlFor="date-select"
            className="block text-sm font-bold uppercase tracking-wider text-foreground/60 mb-2"
          >
            {t.selectDate}
          </label>
          <select
            id="date-select"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full p-3 border-4 border-foreground bg-white text-foreground font-medium focus:outline-none focus:border-primary-blue transition-colors"
          >
            <option value="">{t.selectDate}...</option>
            {dateOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Step 3: Select Time Slot */}
      {selectedDoctor && selectedDate && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-bold uppercase tracking-wider text-foreground/60">
              {t.selectTime}
            </label>
            {!loading && slots.length > 0 && (
              <span className="text-sm text-foreground/70">
                {availableSlotCount} {t.availableSlots}
              </span>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="py-8 text-center">
              <div className="inline-block w-8 h-8 border-4 border-primary-blue border-t-transparent rounded-full animate-spin mb-2"></div>
              <p className="text-foreground/60">{t.loading}</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-4 bg-primary-red/10 border-2 border-primary-red text-primary-red">
              {error}
            </div>
          )}

          {/* Message (e.g., no schedule for this day) */}
          {!loading && !error && message && slots.length === 0 && (
            <div className="py-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary-yellow/20 rounded-full flex items-center justify-center">
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
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-foreground/60">{t.doctorNoSchedule}</p>
            </div>
          )}

          {/* No Slots Available */}
          {!loading && !error && !message && slots.length === 0 && (
            <div className="py-8 text-center">
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-foreground/60">{t.noSlotsAvailable}</p>
            </div>
          )}

          {/* Time Slots Grid */}
          {!loading && !error && slots.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {slots.map((slot, index) => {
                const isSelected = selectedSlot?.start === slot.start && selectedSlot?.end === slot.end;
                const remainingSlots = slot.maxPatients - slot.bookedCount;

                return (
                  <button
                    key={index}
                    onClick={() => slot.available && setSelectedSlot(slot)}
                    disabled={!slot.available}
                    className={`
                      relative p-3 border-2 font-medium text-sm transition-all
                      ${
                        isSelected
                          ? "border-primary-blue bg-primary-blue text-white shadow-[4px_4px_0_0_#121212]"
                          : slot.available
                            ? "border-foreground bg-white hover:border-primary-blue hover:bg-primary-blue/5"
                            : "border-foreground/30 bg-foreground/5 text-foreground/40 cursor-not-allowed"
                      }
                    `}
                    aria-label={`${slot.start} - ${slot.end}${!slot.available ? ` (${t.fullyBooked})` : ""}`}
                  >
                    <span className="block">{slot.start}</span>
                    {slot.available && remainingSlots < slot.maxPatients && (
                      <span className="block text-xs mt-1 text-foreground/60">
                        {remainingSlots} {t.slotsRemaining}
                      </span>
                    )}
                    {!slot.available && (
                      <span className="block text-xs mt-1">
                        {t.fullyBooked}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Selected Slot Summary & Continue Button */}
      {selectedSlot && (
        <div className="mt-6 p-4 bg-verified/10 border-2 border-verified">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-verified mb-1">
                {t.slotSelected}
              </p>
              <p className="font-bold text-lg">
                {selectedSlot.start} - {selectedSlot.end}
              </p>
              <p className="text-sm text-foreground/70">
                {formatDate(new Date(selectedDate + "T00:00:00"), lang)}
              </p>
            </div>
            <a
              href={`/${lang}/clinic/${clinicId}/book?doctor=${selectedDoctor}&date=${selectedDate}&slot=${selectedSlot.start}-${selectedSlot.end}`}
              className="inline-flex items-center justify-center px-6 py-3 bg-verified text-white font-bold uppercase tracking-wider border-2 border-foreground shadow-[4px_4px_0_0_#121212] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#121212] transition-all"
            >
              {t.continueBooking}
              <svg
                className="w-5 h-5 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </a>
          </div>
        </div>
      )}

      {/* Prompt to select doctor/date */}
      {!selectedDoctor && (
        <div className="text-center py-4 text-foreground/60">
          <p>{t.selectDoctorFirst}</p>
        </div>
      )}

      {selectedDoctor && !selectedDate && (
        <div className="text-center py-4 text-foreground/60">
          <p>{t.selectDateFirst}</p>
        </div>
      )}
    </div>
  );
}
