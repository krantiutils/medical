"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";

interface Doctor {
  id: string;
  full_name: string;
  full_name_ne: string | null;
  type: string;
  photo_url: string | null;
  specialties: string[];
  degree: string | null;
  role?: string | null;
}

interface CheckIn {
  id: string;
  doctor_id: string;
  clinic_id: string;
  checked_in: string;
  checked_out: string | null;
  notes: string | null;
  doctor: Doctor;
}

export default function CheckInPage() {
  const { lang } = useParams<{ lang: string }>();
  const isNe = lang === "ne";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [affiliatedDoctors, setAffiliatedDoctors] = useState<Doctor[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isToday = selectedDate === new Date().toISOString().split("T")[0];

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/clinic/checkin?date=${selectedDate}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load");
      }
      const data = await res.json();
      setCheckIns(data.checkIns);
      setAffiliatedDoctors(data.affiliatedDoctors);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCheckIn = async (doctorId: string) => {
    setActionLoading(doctorId);
    try {
      const res = await fetch("/api/clinic/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to check in");
      }
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Check-in failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckOut = async (checkInId: string) => {
    setActionLoading(checkInId);
    try {
      const res = await fetch("/api/clinic/checkin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkInId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to check out");
      }
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Check-out failed");
    } finally {
      setActionLoading(null);
    }
  };

  // Build status map for each doctor
  const doctorStatusMap = new Map<string, { status: "not_checked_in" | "checked_in" | "checked_out"; checkIn?: CheckIn }>();

  for (const doc of affiliatedDoctors) {
    doctorStatusMap.set(doc.id, { status: "not_checked_in" });
  }

  for (const ci of checkIns) {
    if (ci.checked_out) {
      doctorStatusMap.set(ci.doctor_id, { status: "checked_out", checkIn: ci });
    } else {
      doctorStatusMap.set(ci.doctor_id, { status: "checked_in", checkIn: ci });
    }
  }

  const statusIndicator = (status: "not_checked_in" | "checked_in" | "checked_out") => {
    switch (status) {
      case "checked_in":
        return <span className="w-3 h-3 rounded-full bg-verified inline-block" title={isNe ? "चेक इन" : "Checked In"} />;
      case "checked_out":
        return <span className="w-3 h-3 rounded-full bg-primary-red inline-block" title={isNe ? "चेक आउट" : "Checked Out"} />;
      default:
        return <span className="w-3 h-3 rounded-full bg-foreground/20 inline-block" title={isNe ? "अनुपस्थित" : "Not Checked In"} />;
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString(isNe ? "ne-NP" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-3 border-4 border-foreground/20 border-t-primary-blue rounded-full animate-spin" />
          <p className="text-foreground/60 font-bold text-sm">{isNe ? "लोड हुँदैछ..." : "Loading..."}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-primary-red font-bold mb-2">{error}</p>
          <button
            type="button"
            onClick={fetchData}
            className="px-4 py-2 text-sm font-bold bg-primary-blue text-white border-2 border-foreground"
          >
            {isNe ? "पुन: प्रयास" : "Retry"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          {isNe ? "डाक्टर चेक-इन" : "Doctor Check-In"}
        </h1>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-3 py-2 border-2 border-foreground/20 text-sm font-bold focus:border-primary-blue focus:outline-none"
        />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="border-4 border-foreground p-4 shadow-[4px_4px_0_0_#121212]">
          <p className="text-xs font-bold uppercase tracking-widest text-foreground/60">
            {isNe ? "कुल डाक्टर" : "Total Doctors"}
          </p>
          <p className="text-3xl font-bold mt-1">{affiliatedDoctors.length}</p>
        </div>
        <div className="border-4 border-verified p-4 shadow-[4px_4px_0_0_#121212]">
          <p className="text-xs font-bold uppercase tracking-widest text-verified">
            {isNe ? "चेक इन" : "Checked In"}
          </p>
          <p className="text-3xl font-bold mt-1 text-verified">
            {Array.from(doctorStatusMap.values()).filter((s) => s.status === "checked_in").length}
          </p>
        </div>
        <div className="border-4 border-primary-red p-4 shadow-[4px_4px_0_0_#121212]">
          <p className="text-xs font-bold uppercase tracking-widest text-primary-red">
            {isNe ? "चेक आउट" : "Checked Out"}
          </p>
          <p className="text-3xl font-bold mt-1 text-primary-red">
            {Array.from(doctorStatusMap.values()).filter((s) => s.status === "checked_out").length}
          </p>
        </div>
      </div>

      {/* Doctor list */}
      {affiliatedDoctors.length === 0 ? (
        <div className="text-center py-12 border-4 border-dashed border-foreground/20">
          <p className="text-foreground/60 font-bold">
            {isNe ? "कुनै सम्बद्ध डाक्टर छैनन्" : "No affiliated doctors"}
          </p>
          <p className="text-foreground/40 text-sm mt-1">
            {isNe ? "पहिले डाक्टर थप्नुहोस्" : "Add doctors from the Doctors page first"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {affiliatedDoctors.map((doctor) => {
            const entry = doctorStatusMap.get(doctor.id);
            const status = entry?.status || "not_checked_in";
            const checkIn = entry?.checkIn;
            const doctorName = isNe ? doctor.full_name_ne || doctor.full_name : doctor.full_name;
            const isActionLoading = actionLoading === doctor.id || actionLoading === checkIn?.id;

            return (
              <div
                key={doctor.id}
                className="flex items-center gap-4 p-4 border-4 border-foreground/10 hover:border-foreground/20 transition-colors"
              >
                {/* Status indicator */}
                <div className="flex-shrink-0">
                  {statusIndicator(status)}
                </div>

                {/* Doctor photo */}
                <div className="w-10 h-10 flex-shrink-0 bg-foreground/10 overflow-hidden">
                  {doctor.photo_url ? (
                    <img src={doctor.photo_url} alt={doctorName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-foreground/40 text-sm font-bold">
                      {doctorName.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Doctor info */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{doctorName}</p>
                  <p className="text-xs text-foreground/60">
                    {doctor.specialties.length > 0 ? doctor.specialties.join(", ") : doctor.degree || doctor.type}
                    {doctor.role && <span className="ml-1 text-foreground/40">({doctor.role})</span>}
                  </p>
                </div>

                {/* Timestamps */}
                {checkIn && (
                  <div className="text-right text-xs text-foreground/60 flex-shrink-0">
                    <p>{isNe ? "आगमन:" : "In:"} {formatTime(checkIn.checked_in)}</p>
                    {checkIn.checked_out && (
                      <p>{isNe ? "प्रस्थान:" : "Out:"} {formatTime(checkIn.checked_out)}</p>
                    )}
                  </div>
                )}

                {/* Action button */}
                {isToday && (
                  <div className="flex-shrink-0">
                    {status === "not_checked_in" && (
                      <button
                        type="button"
                        onClick={() => handleCheckIn(doctor.id)}
                        disabled={!!isActionLoading}
                        className="px-3 py-1.5 text-xs font-bold bg-verified text-white border-2 border-foreground shadow-[2px_2px_0_0_#121212] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_#121212] active:translate-y-0 active:shadow-none transition-all disabled:opacity-50"
                      >
                        {isActionLoading
                          ? (isNe ? "..." : "...")
                          : (isNe ? "चेक इन" : "Check In")}
                      </button>
                    )}
                    {status === "checked_in" && checkIn && (
                      <button
                        type="button"
                        onClick={() => handleCheckOut(checkIn.id)}
                        disabled={!!isActionLoading}
                        className="px-3 py-1.5 text-xs font-bold bg-primary-red text-white border-2 border-foreground shadow-[2px_2px_0_0_#121212] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_#121212] active:translate-y-0 active:shadow-none transition-all disabled:opacity-50"
                      >
                        {isActionLoading
                          ? (isNe ? "..." : "...")
                          : (isNe ? "चेक आउट" : "Check Out")}
                      </button>
                    )}
                    {status === "checked_out" && (
                      <span className="text-xs font-bold text-foreground/40 uppercase">
                        {isNe ? "सकियो" : "Done"}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
