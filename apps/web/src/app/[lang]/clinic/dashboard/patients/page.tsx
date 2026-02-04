"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Patient {
  id: string;
  patient_number: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  gender: string | null;
  date_of_birth: string | null;
  blood_group: string | null;
  address: string | null;
  photo_url: string | null;
  created_at: string;
  _count: {
    appointments: number;
    invoices: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function PatientRegistryPage() {
  const { data: session, status } = useSession();
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en";

  const [patients, setPatients] = useState<Patient[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noClinic, setNoClinic] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const t = {
    en: {
      title: "Patient Registry",
      subtitle: "View and manage all patients registered at your clinic",
      backToDashboard: "Back to Dashboard",
      addPatient: "Add Patient",
      searchPlaceholder: "Search by name, phone, or patient number...",
      search: "Search",
      clear: "Clear",
      totalPatients: "Total Patients",
      patientNumber: "Patient #",
      name: "Name",
      phone: "Phone",
      email: "Email",
      gender: "Gender",
      age: "Age",
      bloodGroup: "Blood Group",
      address: "Address",
      appointments: "Appointments",
      invoices: "Invoices",
      registered: "Registered",
      actions: "Actions",
      edit: "Edit",
      delete: "Delete",
      deleteConfirm: "Are you sure you want to delete this patient? This action cannot be undone.",
      deleting: "Deleting...",
      noPatients: "No patients registered yet",
      noPatientsMessage: "Add your first patient to get started with your clinic registry.",
      noResults: "No patients found",
      noResultsMessage: "Try a different search term.",
      previous: "Previous",
      next: "Next",
      page: "Page",
      of: "of",
      showing: "Showing",
      to: "to",
      results: "results",
      loginRequired: "Please log in to view the patient registry",
      login: "Login",
      noClinic: "No Verified Clinic",
      noClinicMessage: "You don't have a verified clinic yet. Register your clinic to manage patients.",
      registerClinic: "Register Clinic",
      loading: "Loading...",
      errorLoading: "Failed to load patients",
      retry: "Retry",
      male: "Male",
      female: "Female",
      other: "Other",
      years: "yrs",
      cannotDelete: "Cannot delete",
      hasRecords: "This patient has existing records and cannot be deleted.",
    },
    ne: {
      title: "बिरामी रजिस्ट्री",
      subtitle: "तपाईंको क्लिनिकमा दर्ता भएका सबै बिरामीहरू हेर्नुहोस् र व्यवस्थापन गर्नुहोस्",
      backToDashboard: "ड्यासबोर्डमा फर्कनुहोस्",
      addPatient: "बिरामी थप्नुहोस्",
      searchPlaceholder: "नाम, फोन, वा बिरामी नम्बरद्वारा खोज्नुहोस्...",
      search: "खोज्नुहोस्",
      clear: "खाली गर्नुहोस्",
      totalPatients: "कुल बिरामीहरू",
      patientNumber: "बिरामी #",
      name: "नाम",
      phone: "फोन",
      email: "इमेल",
      gender: "लिङ्ग",
      age: "उमेर",
      bloodGroup: "रक्त समूह",
      address: "ठेगाना",
      appointments: "अपोइन्टमेन्टहरू",
      invoices: "बिलहरू",
      registered: "दर्ता मिति",
      actions: "कार्यहरू",
      edit: "सम्पादन",
      delete: "मेटाउनुहोस्",
      deleteConfirm: "के तपाई निश्चित हुनुहुन्छ कि यो बिरामीलाई मेटाउन चाहनुहुन्छ? यो कार्य पूर्ववत गर्न सकिँदैन।",
      deleting: "मेटाउँदै...",
      noPatients: "अझै कुनै बिरामी दर्ता भएको छैन",
      noPatientsMessage: "तपाईंको क्लिनिक रजिस्ट्री सुरु गर्न पहिलो बिरामी थप्नुहोस्।",
      noResults: "कुनै बिरामी फेला परेन",
      noResultsMessage: "फरक खोज शब्द प्रयोग गर्नुहोस्।",
      previous: "अघिल्लो",
      next: "अर्को",
      page: "पृष्ठ",
      of: "मा",
      showing: "देखाउँदै",
      to: "देखि",
      results: "नतिजाहरू",
      loginRequired: "बिरामी रजिस्ट्री हेर्न कृपया लगइन गर्नुहोस्",
      login: "लगइन गर्नुहोस्",
      noClinic: "कुनै प्रमाणित क्लिनिक छैन",
      noClinicMessage: "तपाईंसँग अझै प्रमाणित क्लिनिक छैन। बिरामीहरू व्यवस्थापन गर्न तपाईंको क्लिनिक दर्ता गर्नुहोस्।",
      registerClinic: "क्लिनिक दर्ता गर्नुहोस्",
      loading: "लोड हुँदैछ...",
      errorLoading: "बिरामीहरू लोड गर्न असफल भयो",
      retry: "पुन: प्रयास गर्नुहोस्",
      male: "पुरुष",
      female: "महिला",
      other: "अन्य",
      years: "वर्ष",
      cannotDelete: "मेटाउन सकिँदैन",
      hasRecords: "यो बिरामीको अवस्थित रेकर्डहरू छन् र मेटाउन सकिँदैन।",
    },
  };

  const tr = t[lang as keyof typeof t] || t.en;

  const calculateAge = (dob: string): string => {
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return `${age} ${tr.years}`;
  };

  const getGenderLabel = (gender: string): string => {
    const labels: Record<string, string> = {
      Male: tr.male,
      Female: tr.female,
      Other: tr.other,
    };
    return labels[gender] || gender;
  };

  const getGenderColor = (gender: string): string => {
    const colors: Record<string, string> = {
      Male: "bg-primary-blue",
      Female: "bg-primary-red",
      Other: "bg-primary-yellow",
    };
    return colors[gender] || "bg-foreground/20";
  };

  const fetchPatients = useCallback(
    async (page = 1, search = "") => {
      setLoading(true);
      setError(null);
      setNoClinic(false);

      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: "20",
          sort: "created_at",
          order: "desc",
        });

        if (search) {
          queryParams.set("q", search);
        }

        const response = await fetch(`/api/clinic/patients?${queryParams}`);

        if (response.status === 404) {
          const data = await response.json();
          if (data.code === "NO_CLINIC") {
            setNoClinic(true);
            return;
          }
        }

        if (!response.ok) {
          throw new Error("Failed to fetch patients");
        }

        const data = await response.json();
        setPatients(data.patients || []);
        setPagination(data.pagination);
      } catch (err) {
        console.error("Error fetching patients:", err);
        setError(tr.errorLoading);
      } finally {
        setLoading(false);
      }
    },
    [tr.errorLoading]
  );

  const handleSearch = () => {
    setActiveSearch(searchQuery.trim());
    fetchPatients(1, searchQuery.trim());
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setActiveSearch("");
    fetchPatients(1, "");
  };

  const handlePageChange = (newPage: number) => {
    fetchPatients(newPage, activeSearch);
  };

  const handleDelete = async (patientId: string) => {
    if (!confirm(tr.deleteConfirm)) return;

    setDeleting(patientId);

    try {
      const response = await fetch(`/api/clinic/patients/${patientId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        if (data.code === "HAS_RECORDS") {
          alert(tr.hasRecords);
          return;
        }
        throw new Error(data.error || "Failed to delete patient");
      }

      // Refresh the list
      fetchPatients(pagination.page, activeSearch);
    } catch (err) {
      console.error("Error deleting patient:", err);
      alert(err instanceof Error ? err.message : "Failed to delete patient");
    } finally {
      setDeleting(null);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchPatients();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, fetchPatients]);

  // Loading state
  if (status === "loading" || (loading && patients.length === 0 && !error && !noClinic)) {
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
              <Link href={`/${lang}/login?callbackUrl=/${lang}/clinic/dashboard/patients`}>
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
  if (error && patients.length === 0) {
    return (
      <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card decorator="red" decoratorPosition="top-right">
            <CardHeader>
              <h1 className="text-3xl font-bold text-foreground">{tr.title}</h1>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/70 mb-6">{error}</p>
              <Button variant="primary" onClick={() => fetchPatients()}>
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
          <div className="mt-4 sm:mt-0">
            <Link href={`/${lang}/clinic/dashboard/patients/new`}>
              <Button variant="primary">
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
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                {tr.addPatient}
              </Button>
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder={tr.searchPlaceholder}
              className="flex-1 px-4 py-3 border-4 border-foreground bg-white text-foreground placeholder:text-foreground/50 focus:outline-none focus:border-primary-blue"
            />
            <Button
              variant="primary"
              onClick={handleSearch}
              disabled={loading}
            >
              {tr.search}
            </Button>
            {activeSearch && (
              <Button variant="outline" onClick={handleClearSearch}>
                {tr.clear}
              </Button>
            )}
          </div>
        </div>

        {/* Stats Bar */}
        <div className="mb-6 flex items-center gap-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border-4 border-foreground shadow-[4px_4px_0_0_#121212]">
            <span className="text-sm font-bold uppercase tracking-wider text-foreground/60">
              {tr.totalPatients}
            </span>
            <span className="text-lg font-bold text-primary-blue">
              {pagination.total}
            </span>
          </div>
        </div>

        {/* Patient List */}
        {patients.length === 0 && !loading ? (
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
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                {activeSearch ? tr.noResults : tr.noPatients}
              </h3>
              <p className="text-foreground/60 mb-6">
                {activeSearch ? tr.noResultsMessage : tr.noPatientsMessage}
              </p>
              {!activeSearch && (
                <Link href={`/${lang}/clinic/dashboard/patients/new`}>
                  <Button variant="primary">{tr.addPatient}</Button>
                </Link>
              )}
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
                        {tr.patientNumber}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">
                        {tr.name}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider hidden sm:table-cell">
                        {tr.phone}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider hidden md:table-cell">
                        {tr.gender}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider hidden md:table-cell">
                        {tr.age}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider hidden lg:table-cell">
                        {tr.bloodGroup}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider hidden lg:table-cell">
                        {tr.appointments}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider hidden xl:table-cell">
                        {tr.registered}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider">
                        {tr.actions}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map((patient, index) => (
                      <tr
                        key={patient.id}
                        className={`border-b-2 border-foreground/20 hover:bg-foreground/5 transition-colors ${
                          index % 2 === 0 ? "bg-white" : "bg-foreground/[0.02]"
                        }`}
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono font-bold text-primary-blue text-sm">
                            {patient.patient_number}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              patient.gender ? getGenderColor(patient.gender) : "bg-foreground/20"
                            }`}>
                              <span className="text-white font-bold text-sm">
                                {patient.full_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-bold text-foreground text-sm">{patient.full_name}</p>
                              {patient.email && (
                                <p className="text-xs text-foreground/50">{patient.email}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="text-sm text-foreground/70">
                            {patient.phone || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {patient.gender ? (
                            <span className={`px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-white rounded ${getGenderColor(patient.gender)}`}>
                              {getGenderLabel(patient.gender)}
                            </span>
                          ) : (
                            <span className="text-sm text-foreground/40">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-sm text-foreground/70">
                            {patient.date_of_birth ? calculateAge(patient.date_of_birth) : "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {patient.blood_group ? (
                            <span className="px-2 py-0.5 text-xs font-bold text-primary-red bg-primary-red/10 rounded border border-primary-red/30">
                              {patient.blood_group}
                            </span>
                          ) : (
                            <span className="text-sm text-foreground/40">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className="text-sm text-foreground/70">
                            {patient._count.appointments}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden xl:table-cell">
                          <span className="text-xs text-foreground/50">
                            {new Date(patient.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/${lang}/clinic/dashboard/patients/${patient.id}`}>
                              <Button variant="outline" size="sm">
                                {tr.edit}
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(patient.id)}
                              disabled={deleting === patient.id}
                              className="text-primary-red hover:bg-primary-red/10"
                            >
                              {deleting === patient.id ? tr.deleting : tr.delete}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
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
