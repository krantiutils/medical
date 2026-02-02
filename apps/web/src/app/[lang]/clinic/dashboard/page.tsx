"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Clinic {
  id: string;
  name: string;
  slug: string;
  type: string;
  logo_url: string | null;
  verified: boolean;
}

interface DashboardStats {
  todayAppointments: number;
  patientsInQueue: number;
  totalPatients: number;
  totalDoctors: number;
}

export default function ClinicDashboardPage() {
  const { data: session, status } = useSession();
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en";

  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noClinic, setNoClinic] = useState(false);

  // Translations
  const t = {
    en: {
      title: "Clinic Dashboard",
      subtitle: "Manage your clinic operations",
      todayAppointments: "Today's Appointments",
      patientsInQueue: "Patients in Queue",
      totalPatients: "Total Patients",
      totalDoctors: "Clinic Doctors",
      welcomeBack: "Welcome back",
      noClinic: "No Verified Clinic",
      noClinicMessage: "You don't have a verified clinic yet. Register your clinic to access the dashboard.",
      registerClinic: "Register Clinic",
      pendingClinic: "Your clinic registration is pending verification.",
      viewClinic: "View Clinic",
      loginRequired: "Please log in to access the clinic dashboard",
      login: "Login",
      loading: "Loading...",
      errorLoading: "Failed to load dashboard data",
      retry: "Retry",
      scheduled: "scheduled",
      inQueue: "in queue",
      registered: "registered",
      affiliated: "affiliated",
      clinic: "Clinic",
      polyclinic: "Polyclinic",
      hospital: "Hospital",
      pharmacy: "Pharmacy",
      quickActions: "Quick Actions",
      addPatient: "Add Patient",
      addPatientDesc: "Register a new patient",
      viewQueue: "View Queue",
      viewQueueDesc: "Manage today's appointments",
      manageSchedules: "Manage Schedules",
      manageSchedulesDesc: "Configure doctor schedules",
      manageDoctors: "Manage Doctors",
      manageDoctorsDesc: "Add or remove clinic doctors",
      billing: "Billing",
      billingDesc: "Create invoices and receipts",
      services: "Services",
      servicesDesc: "Manage service catalog",
      reports: "Reports",
      reportsDesc: "View billing reports and analytics",
      consultations: "Consultations",
      consultationsDesc: "Manage patient consultations",
      ipd: "IPD Management",
      ipdDesc: "Wards, beds, and admissions",
    },
    ne: {
      title: "क्लिनिक ड्यासबोर्ड",
      subtitle: "तपाईंको क्लिनिक व्यवस्थापन गर्नुहोस्",
      todayAppointments: "आजका अपोइन्टमेन्टहरू",
      patientsInQueue: "लाइनमा बिरामीहरू",
      totalPatients: "कुल बिरामीहरू",
      totalDoctors: "क्लिनिक डाक्टरहरू",
      welcomeBack: "स्वागत छ",
      noClinic: "कुनै प्रमाणित क्लिनिक छैन",
      noClinicMessage: "तपाईंसँग अझै प्रमाणित क्लिनिक छैन। ड्यासबोर्ड पहुँच गर्न तपाईंको क्लिनिक दर्ता गर्नुहोस्।",
      registerClinic: "क्लिनिक दर्ता गर्नुहोस्",
      pendingClinic: "तपाईंको क्लिनिक दर्ता प्रमाणीकरणको लागि पर्खिरहेको छ।",
      viewClinic: "क्लिनिक हेर्नुहोस्",
      loginRequired: "क्लिनिक ड्यासबोर्ड पहुँच गर्न कृपया लगइन गर्नुहोस्",
      login: "लगइन गर्नुहोस्",
      loading: "लोड हुँदैछ...",
      errorLoading: "ड्यासबोर्ड डेटा लोड गर्न असफल भयो",
      retry: "पुन: प्रयास गर्नुहोस्",
      scheduled: "निर्धारित",
      inQueue: "लाइनमा",
      registered: "दर्ता भएका",
      affiliated: "सम्बद्ध",
      clinic: "क्लिनिक",
      polyclinic: "पोलिक्लिनिक",
      hospital: "अस्पताल",
      pharmacy: "फार्मेसी",
      quickActions: "द्रुत कार्यहरू",
      addPatient: "बिरामी थप्नुहोस्",
      addPatientDesc: "नयाँ बिरामी दर्ता गर्नुहोस्",
      viewQueue: "लाइन हेर्नुहोस्",
      viewQueueDesc: "आजका अपोइन्टमेन्टहरू व्यवस्थापन गर्नुहोस्",
      manageSchedules: "तालिका व्यवस्थापन",
      manageSchedulesDesc: "डाक्टर तालिका कन्फिगर गर्नुहोस्",
      manageDoctors: "डाक्टर व्यवस्थापन",
      manageDoctorsDesc: "क्लिनिक डाक्टर थप्नुहोस् वा हटाउनुहोस्",
      billing: "बिलिङ",
      billingDesc: "इनभ्वाइस र रसिदहरू बनाउनुहोस्",
      services: "सेवाहरू",
      servicesDesc: "सेवा क्याटलग व्यवस्थापन गर्नुहोस्",
      reports: "रिपोर्टहरू",
      reportsDesc: "बिलिङ रिपोर्टहरू र विश्लेषण हेर्नुहोस्",
      consultations: "परामर्शहरू",
      consultationsDesc: "बिरामी परामर्श व्यवस्थापन गर्नुहोस्",
      ipd: "IPD व्यवस्थापन",
      ipdDesc: "वार्ड, बेड, र भर्ना",
    },
  };

  const tr = t[lang as keyof typeof t] || t.en;

  const getClinicTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      CLINIC: tr.clinic,
      POLYCLINIC: tr.polyclinic,
      HOSPITAL: tr.hospital,
      PHARMACY: tr.pharmacy,
    };
    return labels[type] || type;
  };

  const getClinicTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      CLINIC: "text-primary-blue",
      POLYCLINIC: "text-primary-blue",
      HOSPITAL: "text-primary-red",
      PHARMACY: "text-verified",
    };
    return colors[type] || "text-foreground";
  };

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNoClinic(false);

    try {
      const response = await fetch("/api/clinic/dashboard");

      if (response.status === 404) {
        const data = await response.json();
        if (data.code === "NO_CLINIC") {
          setNoClinic(true);
          return;
        }
      }

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const data = await response.json();
      setClinic(data.clinic);
      setStats(data.stats);
    } catch (err) {
      console.error("Error fetching dashboard:", err);
      setError(tr.errorLoading);
    } finally {
      setLoading(false);
    }
  }, [tr.errorLoading]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchDashboardData();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, fetchDashboardData]);

  // Loading state
  if (status === "loading" || loading) {
    return (
      <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
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
              <Link href={`/${lang}/login?callbackUrl=/${lang}/clinic/dashboard`}>
                <Button variant="primary">{tr.login}</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // No clinic found
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
  if (error) {
    return (
      <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card decorator="red" decoratorPosition="top-right">
            <CardHeader>
              <h1 className="text-3xl font-bold text-foreground">{tr.title}</h1>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/70 mb-6">{error}</p>
              <Button variant="primary" onClick={fetchDashboardData}>
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div className="flex items-center gap-4">
            {/* Clinic Logo */}
            <div className="w-16 h-16 bg-primary-blue rounded-full flex items-center justify-center border-4 border-foreground overflow-hidden flex-shrink-0">
              {clinic?.logo_url ? (
                <Image
                  src={clinic.logo_url}
                  alt={clinic.name}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-bold text-2xl">
                  {clinic?.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <span
                className={`inline-block text-xs font-bold uppercase tracking-widest ${getClinicTypeColor(
                  clinic?.type || ""
                )} mb-1`}
              >
                {getClinicTypeLabel(clinic?.type || "")}
              </span>
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground">
                {clinic?.name}
              </h1>
              <p className="text-foreground/60 text-sm">
                {tr.welcomeBack}, {session.user?.name || session.user?.email}
              </p>
            </div>
          </div>
          <div className="mt-4 sm:mt-0">
            <Link href={`/${lang}/clinic/${clinic?.slug}`}>
              <Button variant="outline">{tr.viewClinic}</Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Today's Appointments */}
          <Card decorator="blue" decoratorPosition="top-left" className="hover:-translate-y-1 transition-transform">
            <CardContent className="py-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2">
                    {tr.todayAppointments}
                  </p>
                  <p className="text-4xl font-black text-foreground">
                    {stats?.todayAppointments ?? 0}
                  </p>
                  <p className="text-sm text-foreground/50 mt-1">{tr.scheduled}</p>
                </div>
                <div className="w-12 h-12 bg-primary-blue/10 rounded-full flex items-center justify-center">
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
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Patients in Queue */}
          <Card decorator="red" decoratorPosition="top-left" className="hover:-translate-y-1 transition-transform">
            <CardContent className="py-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2">
                    {tr.patientsInQueue}
                  </p>
                  <p className="text-4xl font-black text-foreground">
                    {stats?.patientsInQueue ?? 0}
                  </p>
                  <p className="text-sm text-foreground/50 mt-1">{tr.inQueue}</p>
                </div>
                <div className="w-12 h-12 bg-primary-red/10 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-primary-red"
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
              </div>
            </CardContent>
          </Card>

          {/* Total Patients */}
          <Card decorator="yellow" decoratorPosition="top-left" className="hover:-translate-y-1 transition-transform">
            <CardContent className="py-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2">
                    {tr.totalPatients}
                  </p>
                  <p className="text-4xl font-black text-foreground">
                    {stats?.totalPatients ?? 0}
                  </p>
                  <p className="text-sm text-foreground/50 mt-1">{tr.registered}</p>
                </div>
                <div className="w-12 h-12 bg-primary-yellow/10 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-primary-yellow"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Doctors */}
          <Card decorator="blue" decoratorPosition="top-left" className="hover:-translate-y-1 transition-transform">
            <CardContent className="py-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2">
                    {tr.totalDoctors}
                  </p>
                  <p className="text-4xl font-black text-foreground">
                    {stats?.totalDoctors ?? 0}
                  </p>
                  <p className="text-sm text-foreground/50 mt-1">{tr.affiliated}</p>
                </div>
                <div className="w-12 h-12 bg-verified/10 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-verified"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4">{tr.quickActions}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Add Patient */}
            <Link href={`/${lang}/clinic/dashboard/patients/new`}>
              <Card className="hover:-translate-y-1 transition-transform cursor-pointer group">
                <CardContent className="py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-primary-blue rounded-lg flex items-center justify-center border-2 border-foreground shadow-[4px_4px_0_0_#121212] group-hover:shadow-[2px_2px_0_0_#121212] group-hover:translate-x-[2px] group-hover:translate-y-[2px] transition-all">
                      <svg
                        className="w-7 h-7 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-lg">{tr.addPatient}</h3>
                      <p className="text-sm text-foreground/60">{tr.addPatientDesc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Consultations */}
            <Link href={`/${lang}/clinic/dashboard/consultations`}>
              <Card className="hover:-translate-y-1 transition-transform cursor-pointer group">
                <CardContent className="py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-primary-red rounded-lg flex items-center justify-center border-2 border-foreground shadow-[4px_4px_0_0_#121212] group-hover:shadow-[2px_2px_0_0_#121212] group-hover:translate-x-[2px] group-hover:translate-y-[2px] transition-all">
                      <svg
                        className="w-7 h-7 text-white"
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
                    <div>
                      <h3 className="font-bold text-foreground text-lg">{tr.consultations}</h3>
                      <p className="text-sm text-foreground/60">{tr.consultationsDesc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* View Queue */}
            <Link href={`/${lang}/clinic/dashboard/queue`}>
              <Card className="hover:-translate-y-1 transition-transform cursor-pointer group">
                <CardContent className="py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-primary-red rounded-lg flex items-center justify-center border-2 border-foreground shadow-[4px_4px_0_0_#121212] group-hover:shadow-[2px_2px_0_0_#121212] group-hover:translate-x-[2px] group-hover:translate-y-[2px] transition-all">
                      <svg
                        className="w-7 h-7 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-lg">{tr.viewQueue}</h3>
                      <p className="text-sm text-foreground/60">{tr.viewQueueDesc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Manage Schedules */}
            <Link href={`/${lang}/clinic/dashboard/schedules`}>
              <Card className="hover:-translate-y-1 transition-transform cursor-pointer group">
                <CardContent className="py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-primary-yellow rounded-lg flex items-center justify-center border-2 border-foreground shadow-[4px_4px_0_0_#121212] group-hover:shadow-[2px_2px_0_0_#121212] group-hover:translate-x-[2px] group-hover:translate-y-[2px] transition-all">
                      <svg
                        className="w-7 h-7 text-foreground"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-lg">{tr.manageSchedules}</h3>
                      <p className="text-sm text-foreground/60">{tr.manageSchedulesDesc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Manage Doctors */}
            <Link href={`/${lang}/clinic/dashboard/doctors`}>
              <Card className="hover:-translate-y-1 transition-transform cursor-pointer group">
                <CardContent className="py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-verified rounded-lg flex items-center justify-center border-2 border-foreground shadow-[4px_4px_0_0_#121212] group-hover:shadow-[2px_2px_0_0_#121212] group-hover:translate-x-[2px] group-hover:translate-y-[2px] transition-all">
                      <svg
                        className="w-7 h-7 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-lg">{tr.manageDoctors}</h3>
                      <p className="text-sm text-foreground/60">{tr.manageDoctorsDesc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Services */}
            <Link href={`/${lang}/clinic/dashboard/services`}>
              <Card className="hover:-translate-y-1 transition-transform cursor-pointer group">
                <CardContent className="py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-primary-blue rounded-lg flex items-center justify-center border-2 border-foreground shadow-[4px_4px_0_0_#121212] group-hover:shadow-[2px_2px_0_0_#121212] group-hover:translate-x-[2px] group-hover:translate-y-[2px] transition-all">
                      <svg
                        className="w-7 h-7 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-lg">{tr.services}</h3>
                      <p className="text-sm text-foreground/60">{tr.servicesDesc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Billing */}
            <Link href={`/${lang}/clinic/dashboard/billing`}>
              <Card className="hover:-translate-y-1 transition-transform cursor-pointer group">
                <CardContent className="py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-primary-red rounded-lg flex items-center justify-center border-2 border-foreground shadow-[4px_4px_0_0_#121212] group-hover:shadow-[2px_2px_0_0_#121212] group-hover:translate-x-[2px] group-hover:translate-y-[2px] transition-all">
                      <svg
                        className="w-7 h-7 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-lg">{tr.billing}</h3>
                      <p className="text-sm text-foreground/60">{tr.billingDesc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Reports */}
            <Link href={`/${lang}/clinic/dashboard/reports`}>
              <Card className="hover:-translate-y-1 transition-transform cursor-pointer group">
                <CardContent className="py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-primary-yellow rounded-lg flex items-center justify-center border-2 border-foreground shadow-[4px_4px_0_0_#121212] group-hover:shadow-[2px_2px_0_0_#121212] group-hover:translate-x-[2px] group-hover:translate-y-[2px] transition-all">
                      <svg
                        className="w-7 h-7 text-foreground"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-lg">{tr.reports}</h3>
                      <p className="text-sm text-foreground/60">{tr.reportsDesc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* IPD Management */}
            <Link href={`/${lang}/clinic/dashboard/ipd`}>
              <Card className="hover:-translate-y-1 transition-transform cursor-pointer group">
                <CardContent className="py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-primary-red rounded-lg flex items-center justify-center border-2 border-foreground shadow-[4px_4px_0_0_#121212] group-hover:shadow-[2px_2px_0_0_#121212] group-hover:translate-x-[2px] group-hover:translate-y-[2px] transition-all">
                      <svg
                        className="w-7 h-7 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-lg">{tr.ipd}</h3>
                      <p className="text-sm text-foreground/60">{tr.ipdDesc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
