"use client";

import { useState } from "react";
import Link from "next/link";
import { getDisplayName } from "@/lib/professional-display";

interface Schedule {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  doctor: {
    id: string;
    slug: string;
    full_name: string;
    photo_url: string | null;
    specialties: string[];
    degree: string | null;
    type: string;
  };
}

interface OPDScheduleSectionProps {
  schedules: Schedule[];
  lang: string;
}

const DAY_NAMES: Record<string, { en: string; ne: string }> = {
  "0": { en: "Sunday", ne: "आइतबार" },
  "1": { en: "Monday", ne: "सोमबार" },
  "2": { en: "Tuesday", ne: "मंगलबार" },
  "3": { en: "Wednesday", ne: "बुधबार" },
  "4": { en: "Thursday", ne: "बिहिबार" },
  "5": { en: "Friday", ne: "शुक्रबार" },
  "6": { en: "Saturday", ne: "शनिबार" },
};

function getProfilePath(type: string): string {
  switch (type) {
    case "DOCTOR":
      return "doctors";
    case "DENTIST":
      return "dentists";
    case "PHARMACIST":
      return "pharmacists";
    default:
      return "doctors";
  }
}

export function OPDScheduleSection({ schedules, lang }: OPDScheduleSectionProps) {
  // Derive unique specialties from all doctors in the schedules
  const allSpecialties = new Set<string>();
  for (const schedule of schedules) {
    for (const s of schedule.doctor.specialties) {
      allSpecialties.add(s);
    }
  }
  const specialties = Array.from(allSpecialties).sort();

  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("all");

  // Group schedules by doctor, then by day
  const doctorMap = new Map<
    string,
    {
      doctor: Schedule["doctor"];
      days: { day_of_week: number; start_time: string; end_time: string }[];
    }
  >();

  for (const schedule of schedules) {
    const doctorId = schedule.doctor.id;
    if (!doctorMap.has(doctorId)) {
      doctorMap.set(doctorId, {
        doctor: schedule.doctor,
        days: [],
      });
    }
    doctorMap.get(doctorId)!.days.push({
      day_of_week: schedule.day_of_week,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
    });
  }

  // Filter by selected specialty
  const filteredDoctors = Array.from(doctorMap.values()).filter((entry) => {
    if (selectedSpecialty === "all") return true;
    return entry.doctor.specialties.includes(selectedSpecialty);
  });

  return (
    <div>
      {/* Specialty Filter */}
      {specialties.length > 0 && (
        <div className="mb-6">
          <label className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2 block">
            {lang === "ne" ? "विशेषज्ञता अनुसार फिल्टर" : "Filter by Specialty"}
          </label>
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="px-4 py-2 border-2 border-foreground bg-white focus:outline-none focus:border-primary-blue"
          >
            <option value="all">{lang === "ne" ? "सबै" : "All"}</option>
            {specialties.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Doctor Cards */}
      {filteredDoctors.length === 0 ? (
        <p className="text-foreground/60 text-center py-4">
          {lang === "ne"
            ? "यस विशेषज्ञतामा कुनै डाक्टर भेटिएन"
            : "No doctors found for this specialty"}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredDoctors.map(({ doctor, days }) => {
            const displayName = getDisplayName(doctor as { full_name: string; type: "DOCTOR" | "DENTIST" | "PHARMACIST" });

            // Sort days
            const sortedDays = [...days].sort(
              (a, b) => a.day_of_week - b.day_of_week
            );

            return (
              <div
                key={doctor.id}
                className="border-4 border-foreground bg-white p-4 shadow-[4px_4px_0_0_#121212]"
              >
                <div className="flex gap-4 mb-3">
                  {/* Photo */}
                  <div className="flex-shrink-0">
                    {doctor.photo_url ? (
                      <img
                        src={doctor.photo_url}
                        alt={displayName}
                        className="w-16 h-16 object-cover border-2 border-foreground"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-muted border-2 border-foreground flex items-center justify-center">
                        <span className="text-2xl font-bold text-foreground/40">
                          {doctor.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground truncate">
                      {displayName}
                    </h3>
                    {doctor.degree && (
                      <p className="text-sm text-foreground/60 truncate">
                        {doctor.degree}
                      </p>
                    )}
                    {/* Specialty pills */}
                    {doctor.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {doctor.specialties.slice(0, 2).map((s, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-primary-blue/10 text-primary-blue border border-primary-blue text-xs font-bold"
                          >
                            {s}
                          </span>
                        ))}
                        {doctor.specialties.length > 2 && (
                          <span className="px-2 py-0.5 bg-foreground/5 text-foreground/60 border border-foreground/20 text-xs font-bold">
                            +{doctor.specialties.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* OPD Schedule */}
                <div className="border-t-2 border-foreground/10 pt-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2">
                    {lang === "ne" ? "OPD तालिका" : "OPD Schedule"}
                  </p>
                  <div className="space-y-1">
                    {sortedDays.map((day, i) => (
                      <div
                        key={i}
                        className="flex justify-between text-sm"
                      >
                        <span className="font-medium">
                          {DAY_NAMES[String(day.day_of_week)]?.[lang === "ne" ? "ne" : "en"] || `Day ${day.day_of_week}`}
                        </span>
                        <span className="text-foreground/70">
                          {day.start_time} - {day.end_time}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Book Link */}
                <div className="mt-3 pt-3 border-t border-foreground/10">
                  <Link
                    href={`/${lang}/${getProfilePath(doctor.type)}/${doctor.slug}`}
                    className="text-sm font-bold text-primary-blue hover:underline flex items-center gap-1"
                  >
                    {lang === "ne" ? "प्रोफाइल हेर्नुहोस्" : "View Profile"}
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
