"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PrescriptionItem {
  drug_name: string;
  generic_name?: string;
  dosage: string;
  frequency: string;
  duration: string;
  duration_unit: string;
  quantity: number;
  instructions?: string;
}

interface Prescription {
  id: string;
  prescription_no: string;
  items: PrescriptionItem[];
  instructions: string | null;
  status: "DRAFT" | "ISSUED" | "DISPENSED" | "CANCELLED";
  issued_at: string | null;
  valid_until: string | null;
  created_at: string;
  updated_at: string;
  patient: {
    id: string;
    full_name: string;
    patient_number: string;
    date_of_birth: string | null;
    gender: string | null;
    phone: string | null;
  };
  doctor: {
    id: string;
    full_name: string;
    registration_number: string;
    degree: string | null;
  };
  clinical_note: {
    id: string;
    chief_complaint: string | null;
    diagnoses: unknown;
  } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

type StatusFilter = "" | "DRAFT" | "ISSUED" | "DISPENSED" | "CANCELLED";

export default function PrescriptionsPage() {
  const { data: session, status } = useSession();
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en";

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noClinic, setNoClinic] = useState(false);

  const t = {
    en: {
      title: "Prescriptions",
      subtitle: "View and manage all prescriptions issued at your clinic",
      backToDashboard: "Back to Dashboard",
      searchPlaceholder: "Search by Rx number, patient name, or doctor...",
      search: "Search",
      clear: "Clear",
      allStatuses: "All Statuses",
      statusDraft: "Draft",
      statusIssued: "Issued",
      statusDispensed: "Dispensed",
      statusCancelled: "Cancelled",
      totalPrescriptions: "Total Prescriptions",
      prescriptionNo: "Rx #",
      patient: "Patient",
      doctor: "Doctor",
      items: "Items",
      statusLabel: "Status",
      diagnosis: "Diagnosis",
      issuedAt: "Issued",
      createdAt: "Created",
      actions: "Actions",
      view: "View",
      noPrescriptions: "No prescriptions yet",
      noPrescriptionsMessage: "Prescriptions will appear here once created from consultations.",
      noResults: "No prescriptions found",
      noResultsMessage: "Try a different search term or filter.",
      previous: "Previous",
      next: "Next",
      page: "Page",
      of: "of",
      showing: "Showing",
      to: "to",
      results: "results",
      loginRequired: "Please log in to view prescriptions",
      login: "Login",
      noClinic: "No Verified Clinic",
      noClinicMessage: "You don't have a verified clinic yet. Register your clinic to manage prescriptions.",
      registerClinic: "Register Clinic",
      loading: "Loading...",
      errorLoading: "Failed to load prescriptions",
      retry: "Retry",
      drugs: "drugs",
    },
    ne: {
      title: "प्रेस्क्रिप्सनहरू",
      subtitle: "तपाईंको क्लिनिकमा जारी गरिएका सबै प्रेस्क्रिप्सनहरू हेर्नुहोस् र व्यवस्थापन गर्नुहोस्",
      backToDashboard: "ड्यासबोर्डमा फर्कनुहोस्",
      searchPlaceholder: "Rx नम्बर, बिरामीको नाम, वा डाक्टरद्वारा खोज्नुहोस्...",
      search: "खोज्नुहोस्",
      clear: "खाली गर्नुहोस्",
      allStatuses: "सबै स्थिति",
      statusDraft: "ड्राफ्ट",
      statusIssued: "जारी",
      statusDispensed: "वितरित",
      statusCancelled: "रद्द",
      totalPrescriptions: "कुल प्रेस्क्रिप्सन",
      prescriptionNo: "Rx #",
      patient: "बिरामी",
      doctor: "डाक्टर",
      items: "औषधिहरू",
      statusLabel: "स्थिति",
      diagnosis: "निदान",
      issuedAt: "जारी मिति",
      createdAt: "सिर्जना मिति",
      actions: "कार्यहरू",
      view: "हेर्नुहोस्",
      noPrescriptions: "अझै कुनै प्रेस्क्रिप्सन छैन",
      noPrescriptionsMessage: "परामर्शबाट सिर्जना भएपछि प्रेस्क्रिप्सनहरू यहाँ देखिनेछन्।",
      noResults: "कुनै प्रेस्क्रिप्सन फेला परेन",
      noResultsMessage: "फरक खोज शब्द वा फिल्टर प्रयोग गर्नुहोस्।",
      previous: "अघिल्लो",
      next: "अर्को",
      page: "पृष्ठ",
      of: "मा",
      showing: "देखाउँदै",
      to: "देखि",
      results: "नतिजाहरू",
      loginRequired: "प्रेस्क्रिप्सनहरू हेर्न कृपया लगइन गर्नुहोस्",
      login: "लगइन गर्नुहोस्",
      noClinic: "कुनै प्रमाणित क्लिनिक छैन",
      noClinicMessage: "तपाईंसँग अझै प्रमाणित क्लिनिक छैन। प्रेस्क्रिप्सन व्यवस्थापन गर्न तपाईंको क्लिनिक दर्ता गर्नुहोस्।",
      registerClinic: "क्लिनिक दर्ता गर्नुहोस्",
      loading: "लोड हुँदैछ...",
      errorLoading: "प्रेस्क्रिप्सनहरू लोड गर्न असफल भयो",
      retry: "पुन: प्रयास गर्नुहोस्",
      drugs: "औषधि",
    },
  };

  const tr = t[lang as keyof typeof t] || t.en;

  const getStatusLabel = (s: string): string => {
    const labels: Record<string, string> = {
      DRAFT: tr.statusDraft,
      ISSUED: tr.statusIssued,
      DISPENSED: tr.statusDispensed,
      CANCELLED: tr.statusCancelled,
    };
    return labels[s] || s;
  };

  const getStatusColor = (s: string): string => {
    const colors: Record<string, string> = {
      DRAFT: "bg-foreground/20 text-foreground",
      ISSUED: "bg-primary-blue text-white",
      DISPENSED: "bg-green-600 text-white",
      CANCELLED: "bg-primary-red text-white",
    };
    return colors[s] || "bg-foreground/20 text-foreground";
  };

  const fetchPrescriptions = useCallback(
    async (page = 1, search = "", filterStatus: StatusFilter = "") => {
      setLoading(true);
      setError(null);
      setNoClinic(false);

      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: "20",
        });

        if (search) {
          queryParams.set("q", search);
        }

        if (filterStatus) {
          queryParams.set("status", filterStatus);
        }

        const response = await fetch(`/api/clinic/prescriptions?${queryParams}`);

        if (response.status === 404) {
          const data = await response.json();
          if (data.code === "NO_CLINIC") {
            setNoClinic(true);
            return;
          }
        }

        if (!response.ok) {
          throw new Error("Failed to fetch prescriptions");
        }

        const data = await response.json();
        setPrescriptions(data.prescriptions || []);
        setPagination(data.pagination);
      } catch (err) {
        console.error("Error fetching prescriptions:", err);
        setError(tr.errorLoading);
      } finally {
        setLoading(false);
      }
    },
    [tr.errorLoading]
  );

  const handleSearch = () => {
    const trimmed = searchQuery.trim();
    setActiveSearch(trimmed);
    fetchPrescriptions(1, trimmed, statusFilter);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setActiveSearch("");
    fetchPrescriptions(1, "", statusFilter);
  };

  const handleStatusChange = (newStatus: StatusFilter) => {
    setStatusFilter(newStatus);
    fetchPrescriptions(1, activeSearch, newStatus);
  };

  const handlePageChange = (newPage: number) => {
    fetchPrescriptions(newPage, activeSearch, statusFilter);
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchPrescriptions();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, fetchPrescriptions]);

  // Loading state
  if (status === "loading" || (loading && prescriptions.length === 0 && !error && !noClinic)) {
    return (
      <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
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
              <Link href={`/${lang}/login?callbackUrl=/${lang}/clinic/dashboard/prescriptions`}>
                <Button variant="primary">{tr.login}</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // No clinic
  if (noClinic) {
    return (
      <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card decorator="yellow" decoratorPosition="top-right">
            <CardHeader>
              <h1 className="text-3xl font-bold text-foreground">{tr.noClinic}</h1>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/70 mb-6">{tr.noClinicMessage}</p>
              <Link href={`/${lang}/clinic/register`}>
                <Button variant="primary">{tr.registerClinic}</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Error state
  if (error && prescriptions.length === 0) {
    return (
      <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card decorator="red" decoratorPosition="top-right">
            <CardHeader>
              <h1 className="text-3xl font-bold text-foreground">{tr.title}</h1>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/70 mb-6">{error}</p>
              <Button variant="primary" onClick={() => fetchPrescriptions()}>
                {tr.retry}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <Link
              href={`/${lang}/clinic/dashboard`}
              className="text-primary-blue hover:underline text-sm mb-2 inline-block"
            >
              &larr; {tr.backToDashboard}
            </Link>
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground">{tr.title}</h1>
            <p className="text-foreground/60 mt-1">{tr.subtitle}</p>
          </div>
        </div>

        {/* Search Bar & Status Filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex gap-2 flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder={tr.searchPlaceholder}
              className="flex-1 px-4 py-3 border-4 border-foreground bg-white text-foreground placeholder:text-foreground/50 focus:outline-none focus:border-primary-blue"
            />
            <Button variant="primary" onClick={handleSearch} disabled={loading}>
              {tr.search}
            </Button>
            {activeSearch && (
              <Button variant="outline" onClick={handleClearSearch}>
                {tr.clear}
              </Button>
            )}
          </div>
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value as StatusFilter)}
            className="px-4 py-3 border-4 border-foreground bg-white text-foreground font-bold text-sm uppercase tracking-wider focus:outline-none focus:border-primary-blue cursor-pointer"
          >
            <option value="">{tr.allStatuses}</option>
            <option value="DRAFT">{tr.statusDraft}</option>
            <option value="ISSUED">{tr.statusIssued}</option>
            <option value="DISPENSED">{tr.statusDispensed}</option>
            <option value="CANCELLED">{tr.statusCancelled}</option>
          </select>
        </div>

        {/* Stats Bar */}
        <div className="mb-6 flex items-center gap-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border-4 border-foreground shadow-[4px_4px_0_0_#121212]">
            <span className="text-sm font-bold uppercase tracking-wider text-foreground/60">
              {tr.totalPrescriptions}
            </span>
            <span className="text-lg font-bold text-primary-blue">
              {pagination.total}
            </span>
          </div>
        </div>

        {/* Prescription List */}
        {prescriptions.length === 0 && !loading ? (
          <Card decorator="yellow" decoratorPosition="top-right">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 bg-primary-yellow/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-primary-yellow"
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
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                {activeSearch || statusFilter ? tr.noResults : tr.noPrescriptions}
              </h3>
              <p className="text-foreground/60">
                {activeSearch || statusFilter ? tr.noResultsMessage : tr.noPrescriptionsMessage}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Table View */}
            <div className="overflow-x-auto">
              <div className="border-4 border-foreground bg-white shadow-[4px_4px_0_0_#121212]">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-4 border-foreground bg-foreground text-white">
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">
                        {tr.prescriptionNo}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">
                        {tr.patient}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider hidden md:table-cell">
                        {tr.doctor}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider hidden sm:table-cell">
                        {tr.items}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">
                        {tr.statusLabel}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider hidden lg:table-cell">
                        {tr.diagnosis}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider hidden xl:table-cell">
                        {tr.createdAt}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider">
                        {tr.actions}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {prescriptions.map((rx, index) => {
                      const itemsList = Array.isArray(rx.items) ? rx.items : [];
                      const diagnoses = rx.clinical_note?.diagnoses;
                      const diagnosisText = Array.isArray(diagnoses)
                        ? (diagnoses as Array<{ name?: string }>).map((d) => d.name || "").filter(Boolean).join(", ")
                        : typeof diagnoses === "string"
                          ? diagnoses
                          : null;

                      return (
                        <tr
                          key={rx.id}
                          className={`border-b-2 border-foreground/20 hover:bg-foreground/5 transition-colors ${
                            index % 2 === 0 ? "bg-white" : "bg-foreground/[0.02]"
                          }`}
                        >
                          <td className="px-4 py-3">
                            <span className="font-mono font-bold text-primary-blue text-sm">
                              {rx.prescription_no}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-bold text-foreground text-sm">{rx.patient.full_name}</p>
                              <p className="text-xs text-foreground/50">{rx.patient.patient_number}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <div>
                              <p className="text-sm text-foreground/70">{rx.doctor.full_name}</p>
                              {rx.doctor.degree && (
                                <p className="text-xs text-foreground/40">{rx.doctor.degree}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <span className="text-sm text-foreground/70">
                              {itemsList.length} {tr.drugs}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 text-xs font-bold uppercase tracking-wider rounded ${getStatusColor(rx.status)}`}
                            >
                              {getStatusLabel(rx.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <span className="text-sm text-foreground/60 line-clamp-1">
                              {diagnosisText || "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3 hidden xl:table-cell">
                            <span className="text-xs text-foreground/50">
                              {new Date(rx.created_at).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <Link href={`/${lang}/clinic/dashboard/prescriptions/${rx.id}`}>
                                <Button variant="outline" size="sm">
                                  {tr.view}
                                </Button>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-foreground/60">
                  {tr.showing}{" "}
                  <span className="font-bold">{(pagination.page - 1) * pagination.limit + 1}</span>
                  {" "}{tr.to}{" "}
                  <span className="font-bold">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>
                  {" "}{tr.of}{" "}
                  <span className="font-bold">{pagination.total}</span>{" "}
                  {tr.results}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1 || loading}
                  >
                    {tr.previous}
                  </Button>
                  <span className="px-4 py-2 text-sm font-bold text-foreground">
                    {tr.page} {pagination.page} {tr.of} {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages || loading}
                  >
                    {tr.next}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
