"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Clinic {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
}

interface MedicalRecord {
  id: string;
  title: string;
  record_type: string;
  file_url: string;
  file_size: number;
  notes: string | null;
  record_date: string | null;
  uploaded_at: string;
  clinic: Clinic;
}

const RECORD_TYPE_LABELS: Record<string, { en: string; ne: string }> = {
  LAB_REPORT: { en: "Lab Report", ne: "प्रयोगशाला रिपोर्ट" },
  PRESCRIPTION: { en: "Prescription", ne: "प्रेस्क्रिप्सन" },
  IMAGING: { en: "Imaging", ne: "इमेजिङ" },
  DISCHARGE_SUMMARY: { en: "Discharge Summary", ne: "डिस्चार्ज सारांश" },
  OTHER: { en: "Other", ne: "अन्य" },
};

const RECORD_TYPE_COLORS: Record<string, string> = {
  LAB_REPORT: "bg-primary-blue text-white",
  PRESCRIPTION: "bg-verified text-white",
  IMAGING: "bg-primary-yellow text-foreground",
  DISCHARGE_SUMMARY: "bg-primary-red text-white",
  OTHER: "bg-gray-500 text-white",
};

const translations = {
  en: {
    title: "My Medical Records",
    loading: "Loading...",
    loginRequired: "Please log in to view your medical records",
    login: "Login",
    noRecords: "No medical records found",
    noRecordsMessage:
      "Your medical records will appear here once they are uploaded by your clinic.",
    clinic: "Clinic",
    uploadedOn: "Uploaded",
    recordDate: "Record Date",
    fileSize: "File Size",
    notes: "Notes",
    viewFile: "View File",
    downloadFile: "Download",
    filterAll: "All",
    filterLabel: "Filter by type",
  },
  ne: {
    title: "मेरो मेडिकल रेकर्डहरू",
    loading: "लोड हुँदैछ...",
    loginRequired: "तपाईंको मेडिकल रेकर्ड हेर्न कृपया लगइन गर्नुहोस्",
    login: "लगइन गर्नुहोस्",
    noRecords: "कुनै मेडिकल रेकर्ड फेला परेन",
    noRecordsMessage:
      "तपाईंको क्लिनिकले अपलोड गरेपछि तपाईंका मेडिकल रेकर्डहरू यहाँ देखिनेछन्।",
    clinic: "क्लिनिक",
    uploadedOn: "अपलोड मिति",
    recordDate: "रेकर्ड मिति",
    fileSize: "फाइल साइज",
    notes: "टिप्पणी",
    viewFile: "फाइल हेर्नुहोस्",
    downloadFile: "डाउनलोड",
    filterAll: "सबै",
    filterLabel: "प्रकार अनुसार फिल्टर",
  },
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PatientMedicalRecordsPage() {
  const { data: session, status } = useSession();
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en";
  const t = translations[lang as keyof typeof translations] || translations.en;

  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [filterType, setFilterType] = useState<string>("");

  const fetchRecords = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filterType) queryParams.set("type", filterType);
      const response = await fetch(
        `/api/patient/medical-records?${queryParams}`
      );
      if (response.ok) {
        const data = await response.json();
        setRecords(data.records || []);
      }
    } catch (error) {
      console.error("Error fetching medical records:", error);
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchRecords();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, fetchRecords]);

  const getRecordTypeLabel = (type: string): string => {
    const labels = RECORD_TYPE_LABELS[type];
    if (!labels) return type;
    return lang === "ne" ? labels.ne : labels.en;
  };

  // Loading state
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-10 bg-gray-200 rounded w-full"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-2xl mx-auto text-center py-16">
          <h1 className="text-2xl font-bold mb-2">{t.loginRequired}</h1>
          <Link
            href={`/${lang}/login?callbackUrl=/${lang}/dashboard/medical-records`}
          >
            <Button variant="primary" className="mt-4">
              {t.login}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <h1 className="text-2xl font-bold mb-6">{t.title}</h1>

        {/* Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterType("")}
              className={`px-3 py-1.5 text-sm font-medium rounded border-2 border-foreground transition-colors ${
                filterType === ""
                  ? "bg-foreground text-background"
                  : "bg-background text-foreground hover:bg-foreground/5"
              }`}
            >
              {t.filterAll}
            </button>
            {Object.keys(RECORD_TYPE_LABELS).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 text-sm font-medium rounded border-2 border-foreground transition-colors ${
                  filterType === type
                    ? "bg-foreground text-background"
                    : "bg-background text-foreground hover:bg-foreground/5"
                }`}
              >
                {getRecordTypeLabel(type)}
              </button>
            ))}
          </div>
        </div>

        {/* No records */}
        {records.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h2 className="text-xl font-bold mb-2">{t.noRecords}</h2>
              <p>{t.noRecordsMessage}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {records.map((record) => (
              <Card key={record.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg">{record.title}</h3>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${RECORD_TYPE_COLORS[record.record_type] || "bg-gray-200"}`}
                        >
                          {getRecordTypeLabel(record.record_type)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 space-y-1">
                        <div>
                          {t.clinic}: {record.clinic.name}
                        </div>
                        <div>
                          {t.uploadedOn}:{" "}
                          {new Date(record.uploaded_at).toLocaleDateString(
                            lang === "ne" ? "ne-NP" : "en-US"
                          )}
                        </div>
                        {record.record_date && (
                          <div>
                            {t.recordDate}:{" "}
                            {new Date(record.record_date).toLocaleDateString(
                              lang === "ne" ? "ne-NP" : "en-US"
                            )}
                          </div>
                        )}
                        <div>
                          {t.fileSize}: {formatFileSize(record.file_size)}
                        </div>
                      </div>
                      {record.notes && (
                        <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          {t.notes}: {record.notes}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <a
                        href={record.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" size="sm">
                          {t.viewFile}
                        </Button>
                      </a>
                      <a href={record.file_url} download>
                        <Button variant="primary" size="sm">
                          {t.downloadFile}
                        </Button>
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
