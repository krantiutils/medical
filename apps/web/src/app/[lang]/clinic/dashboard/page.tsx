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
      </div>
    </main>
  );
}
