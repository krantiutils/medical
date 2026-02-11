"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";

interface DoctorQueue {
  doctor: {
    id: string;
    name: string;
  };
  currentToken: number | null;
  currentPatient: string | null;
  waitingTokens: { token: number; patient: string }[];
}

interface QueueData {
  clinic: {
    id: string;
    name: string;
    slug: string;
  };
  queues: DoctorQueue[];
  timestamp: string;
}

// Translations
const translations = {
  en: {
    queueDisplay: "Queue Display",
    nowServing: "Now Serving",
    waiting: "Waiting",
    noActiveQueue: "No active queue",
    doctor: "Dr.",
    token: "Token",
    loading: "Loading queue...",
    errorLoading: "Failed to load queue",
    clinicNotFound: "Clinic not found",
    lastUpdated: "Last updated",
    noPatients: "No patients waiting",
  },
  ne: {
    queueDisplay: "लाइन प्रदर्शन",
    nowServing: "अहिले सेवा गर्दै",
    waiting: "प्रतीक्षामा",
    noActiveQueue: "कुनै सक्रिय लाइन छैन",
    doctor: "डा.",
    token: "टोकन",
    loading: "लाइन लोड हुँदैछ...",
    errorLoading: "लाइन लोड गर्न असफल भयो",
    clinicNotFound: "क्लिनिक फेला परेन",
    lastUpdated: "अन्तिम अपडेट",
    noPatients: "कुनै बिरामी प्रतीक्षामा छैन",
  },
};

// Color palette for doctor cards
const DOCTOR_COLORS = [
  { bg: "bg-primary-blue", text: "text-white", border: "border-primary-blue" },
  { bg: "bg-primary-red", text: "text-white", border: "border-primary-red" },
  { bg: "bg-verified", text: "text-white", border: "border-verified" },
  { bg: "bg-primary-yellow", text: "text-foreground", border: "border-primary-yellow" },
];

export default function QueueDisplayPage() {
  const params = useParams<{ lang: string; slug: string }>();
  const lang = params?.lang || "en";
  const slug = params?.slug;
  const t = translations[lang as keyof typeof translations] || translations.en;

  const [queueData, setQueueData] = useState<QueueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchQueue = useCallback(async () => {
    if (!slug) return;

    try {
      const response = await fetch(`/api/clinic/${slug}/queue`);

      if (response.status === 404) {
        setError(t.clinicNotFound);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch queue");
      }

      const data = await response.json();
      setQueueData(data);
      setLastRefresh(new Date());
      setError(null);
    } catch (err) {
      console.error("Error fetching queue:", err);
      setError(t.errorLoading);
    } finally {
      setLoading(false);
    }
  }, [slug, t.clinicNotFound, t.errorLoading]);

  // Initial fetch
  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchQueue();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchQueue]);

  // Format time for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(lang === "ne" ? "ne-NP" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Loading state
  if (loading) {
    return (
      <main className="min-h-screen bg-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 border-8 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto mb-8" />
          <p className="text-4xl font-bold text-white">{t.loading}</p>
        </div>
      </main>
    );
  }

  // Error state
  if (error) {
    return (
      <main className="min-h-screen bg-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-primary-red rounded-full flex items-center justify-center mx-auto mb-8">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <p className="text-4xl font-bold text-white">{error}</p>
        </div>
      </main>
    );
  }

  // No data
  if (!queueData) {
    return (
      <main className="min-h-screen bg-foreground flex items-center justify-center">
        <p className="text-4xl font-bold text-white">{t.noActiveQueue}</p>
      </main>
    );
  }

  const { clinic, queues } = queueData;

  return (
    <main className="min-h-screen bg-foreground p-8 overflow-hidden">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl lg:text-6xl font-black text-white tracking-tight">
              {clinic.name}
            </h1>
            <p className="text-2xl lg:text-3xl text-white/60 font-bold mt-2">
              {t.queueDisplay}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xl text-white/40 font-medium">{t.lastUpdated}</p>
            <p className="text-3xl lg:text-4xl text-white font-bold tabular-nums">
              {formatTime(lastRefresh)}
            </p>
          </div>
        </div>
        <div className="h-2 bg-primary-blue mt-6" />
      </header>

      {/* Queue Grid */}
      {queues.length === 0 ? (
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-5xl font-bold text-white/60">{t.noPatients}</p>
        </div>
      ) : (
        <div
          className={`grid gap-8 ${
            queues.length === 1
              ? "grid-cols-1"
              : queues.length === 2
              ? "grid-cols-1 lg:grid-cols-2"
              : queues.length === 3
              ? "grid-cols-1 lg:grid-cols-3"
              : "grid-cols-1 lg:grid-cols-2 xl:grid-cols-4"
          }`}
        >
          {queues.map((queue, index) => {
            const colorScheme = DOCTOR_COLORS[index % DOCTOR_COLORS.length];

            return (
              <div
                key={queue.doctor.id}
                className="bg-white border-8 border-foreground"
              >
                {/* Doctor Header */}
                <div className={`${colorScheme.bg} ${colorScheme.text} p-6`}>
                  <h2 className="text-3xl lg:text-4xl font-black truncate">
                    {t.doctor} {queue.doctor.name.replace(/^Dr\.\s*/, "")}
                  </h2>
                </div>

                {/* Now Serving */}
                <div className="p-6 border-b-4 border-foreground/10">
                  <p className="text-lg font-bold uppercase tracking-widest text-foreground/60 mb-4">
                    {t.nowServing}
                  </p>
                  {queue.currentToken !== null ? (
                    <div className="flex items-center gap-6">
                      <div
                        className={`w-32 h-32 ${colorScheme.bg} ${colorScheme.text} flex items-center justify-center border-4 border-foreground shadow-[6px_6px_0_0_#121212]`}
                      >
                        <span className="text-6xl font-black">
                          {queue.currentToken}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-2xl lg:text-3xl font-bold text-foreground truncate">
                          {queue.currentPatient}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="w-32 h-32 bg-foreground/10 flex items-center justify-center border-4 border-foreground/20">
                      <span className="text-5xl font-black text-foreground/30">
                        --
                      </span>
                    </div>
                  )}
                </div>

                {/* Waiting Queue */}
                <div className="p-6">
                  <p className="text-lg font-bold uppercase tracking-widest text-foreground/60 mb-4">
                    {t.waiting}
                  </p>
                  {queue.waitingTokens.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {queue.waitingTokens.slice(0, 8).map((item) => (
                        <div
                          key={item.token}
                          className={`w-16 h-16 ${colorScheme.bg} ${colorScheme.text} flex items-center justify-center border-2 border-foreground opacity-70`}
                        >
                          <span className="text-2xl font-black">{item.token}</span>
                        </div>
                      ))}
                      {queue.waitingTokens.length > 8 && (
                        <div className="w-16 h-16 bg-foreground/10 flex items-center justify-center border-2 border-foreground/20">
                          <span className="text-xl font-bold text-foreground/60">
                            +{queue.waitingTokens.length - 8}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xl text-foreground/40 font-medium">
                      {t.noPatients}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer - Current date */}
      <footer className="fixed bottom-0 left-0 right-0 bg-foreground/95 border-t-4 border-primary-blue p-4">
        <p className="text-center text-2xl font-bold text-white">
          {new Date().toLocaleDateString(lang === "ne" ? "ne-NP" : "en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </footer>
    </main>
  );
}
