"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Patient {
  id: string;
  full_name: string;
  patient_number: string;
  phone: string | null;
  gender: string | null;
  date_of_birth: string | null;
}

interface Doctor {
  id: string;
  full_name: string;
  registration_number: string;
}

interface LabTest {
  id: string;
  name: string;
  short_name: string | null;
  category: string | null;
  sample_type: string | null;
  normal_range: string | null;
  unit: string | null;
}

interface LabResult {
  id: string;
  result_value: string | null;
  unit: string | null;
  normal_range: string | null;
  flag: string | null;
  remarks: string | null;
  verified: boolean;
  lab_test: LabTest;
}

interface LabOrder {
  id: string;
  order_number: string;
  priority: string;
  status: string;
  clinical_notes: string | null;
  sample_collected: string | null;
  sample_id: string | null;
  completed_at: string | null;
  created_at: string;
  patient: Patient;
  ordered_by: Doctor;
  results: LabResult[];
}

const translations = {
  en: {
    title: "Lab Dashboard",
    loading: "Loading...",
    loginRequired: "Please log in to access this page",
    login: "Login",
    noClinic: "No Verified Clinic",
    noClinicMessage: "You don't have a verified clinic yet.",
    // Tabs
    pendingOrders: "Pending Orders",
    inProgress: "In Progress",
    completed: "Completed",
    all: "All Orders",
    // Order details
    orderNumber: "Order #",
    patient: "Patient",
    orderedBy: "Ordered By",
    orderedAt: "Ordered",
    priority: "Priority",
    routine: "Routine",
    urgent: "Urgent",
    stat: "STAT",
    status: "Status",
    ordered: "Ordered",
    sampleCollected: "Sample Collected",
    processing: "Processing",
    completedStatus: "Completed",
    cancelled: "Cancelled",
    tests: "Tests",
    clinicalNotes: "Clinical Notes",
    // Actions
    collectSample: "Collect Sample",
    enterResults: "Enter Results",
    viewResults: "View Results",
    markProcessing: "Start Processing",
    printReport: "Print Report",
    // Stats
    todayOrders: "Today's Orders",
    pendingCount: "Pending",
    processingCount: "Processing",
    completedCount: "Completed Today",
    // Filter
    filterByDate: "Filter by Date",
    today: "Today",
    thisWeek: "This Week",
    thisMonth: "This Month",
    noOrders: "No lab orders found",
  },
  ne: {
    title: "प्रयोगशाला ड्यासबोर्ड",
    loading: "लोड हुँदैछ...",
    loginRequired: "यो पृष्ठ पहुँच गर्न कृपया लगइन गर्नुहोस्",
    login: "लगइन गर्नुहोस्",
    noClinic: "कुनै प्रमाणित क्लिनिक छैन",
    noClinicMessage: "तपाईंसँग अझै प्रमाणित क्लिनिक छैन।",
    // Tabs
    pendingOrders: "पेन्डिङ अर्डरहरू",
    inProgress: "प्रक्रियामा",
    completed: "सम्पन्न",
    all: "सबै अर्डरहरू",
    // Order details
    orderNumber: "अर्डर #",
    patient: "बिरामी",
    orderedBy: "अर्डर गर्ने",
    orderedAt: "अर्डर मिति",
    priority: "प्राथमिकता",
    routine: "सामान्य",
    urgent: "अर्जेन्ट",
    stat: "तुरुन्त",
    status: "स्थिति",
    ordered: "अर्डर भयो",
    sampleCollected: "नमूना लिइयो",
    processing: "प्रक्रियामा",
    completedStatus: "सम्पन्न",
    cancelled: "रद्द",
    tests: "परीक्षणहरू",
    clinicalNotes: "क्लिनिकल नोटहरू",
    // Actions
    collectSample: "नमूना लिनुहोस्",
    enterResults: "नतिजा प्रविष्ट गर्नुहोस्",
    viewResults: "नतिजा हेर्नुहोस्",
    markProcessing: "प्रक्रिया सुरु गर्नुहोस्",
    printReport: "रिपोर्ट छाप्नुहोस्",
    // Stats
    todayOrders: "आजका अर्डरहरू",
    pendingCount: "पेन्डिङ",
    processingCount: "प्रक्रियामा",
    completedCount: "आज सम्पन्न",
    // Filter
    filterByDate: "मितिले फिल्टर गर्नुहोस्",
    today: "आज",
    thisWeek: "यो हप्ता",
    thisMonth: "यो महिना",
    noOrders: "कुनै प्रयोगशाला अर्डर फेला परेन",
  },
};

export default function LabDashboardPage() {
  const { data: session, status } = useSession();
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en";
  const t = translations[lang as keyof typeof translations] || translations.en;

  const [loading, setLoading] = useState(true);
  const [noClinic, setNoClinic] = useState(false);
  const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
  const [activeTab, setActiveTab] = useState<"pending" | "processing" | "completed" | "all">("pending");
  const [stats, setStats] = useState({
    pending: 0,
    processing: 0,
    completedToday: 0,
    totalToday: 0,
  });

  // Fetch lab orders
  const fetchLabOrders = useCallback(async (statusFilter?: string) => {
    try {
      let url = "/api/clinic/lab-orders?limit=50";
      if (statusFilter && statusFilter !== "all") {
        url += `&status=${statusFilter}`;
      }
      const response = await fetch(url);

      if (response.status === 404) {
        const data = await response.json();
        if (data.code === "NO_CLINIC") {
          setNoClinic(true);
          return;
        }
      }

      if (response.ok) {
        const data = await response.json();
        setLabOrders(data.labOrders || []);
      }
    } catch (error) {
      console.error("Error fetching lab orders:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate stats from orders
  const calculateStats = useCallback((orders: LabOrder[]) => {
    const today = new Date().toDateString();
    const todayOrders = orders.filter(
      (o) => new Date(o.created_at).toDateString() === today
    );

    setStats({
      pending: orders.filter((o) => o.status === "ORDERED" || o.status === "SAMPLE_COLLECTED").length,
      processing: orders.filter((o) => o.status === "PROCESSING").length,
      completedToday: todayOrders.filter((o) => o.status === "COMPLETED").length,
      totalToday: todayOrders.length,
    });
  }, []);

  // Update order status
  const updateOrderStatus = async (orderId: string, newStatus: string, additionalData?: Record<string, unknown>) => {
    try {
      const response = await fetch(`/api/clinic/lab-orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          ...additionalData,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setLabOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, ...data.labOrder } : o))
        );
      }
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  // Handle collect sample
  const handleCollectSample = (orderId: string) => {
    const sampleId = `SPL-${Date.now().toString(36).toUpperCase()}`;
    updateOrderStatus(orderId, "SAMPLE_COLLECTED", {
      sample_collected: new Date().toISOString(),
      sample_id: sampleId,
    });
  };

  // Handle start processing
  const handleStartProcessing = (orderId: string) => {
    updateOrderStatus(orderId, "PROCESSING");
  };

  // Initial load
  useEffect(() => {
    if (status === "authenticated") {
      fetchLabOrders().then(() => {
        // Also fetch all orders for stats
        fetch("/api/clinic/lab-orders?limit=100")
          .then((res) => res.json())
          .then((data) => {
            if (data.labOrders) {
              calculateStats(data.labOrders);
            }
          })
          .catch(console.error);
      });
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, fetchLabOrders, calculateStats]);

  // Update orders when tab changes
  useEffect(() => {
    if (status === "authenticated") {
      const statusMap: Record<string, string | undefined> = {
        pending: "ORDERED",
        processing: "PROCESSING",
        completed: "COMPLETED",
        all: undefined,
      };
      fetchLabOrders(statusMap[activeTab]);
    }
  }, [activeTab, status, fetchLabOrders]);

  // Get status color
  const getStatusColor = (orderStatus: string): string => {
    switch (orderStatus) {
      case "ORDERED":
        return "bg-primary-yellow text-foreground";
      case "SAMPLE_COLLECTED":
        return "bg-primary-blue text-white";
      case "PROCESSING":
        return "bg-orange-500 text-white";
      case "COMPLETED":
        return "bg-verified text-white";
      case "CANCELLED":
        return "bg-gray-400 text-white";
      default:
        return "bg-gray-200 text-gray-600";
    }
  };

  // Get status label
  const getStatusLabel = (orderStatus: string): string => {
    switch (orderStatus) {
      case "ORDERED":
        return t.ordered;
      case "SAMPLE_COLLECTED":
        return t.sampleCollected;
      case "PROCESSING":
        return t.processing;
      case "COMPLETED":
        return t.completedStatus;
      case "CANCELLED":
        return t.cancelled;
      default:
        return orderStatus;
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case "STAT":
        return "bg-primary-red text-white";
      case "URGENT":
        return "bg-primary-yellow text-foreground";
      default:
        return "";
    }
  };

  // Calculate patient age
  const getAge = (dob: string | null): string => {
    if (!dob) return "-";
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return `${age}y`;
  };

  // Loading state
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
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
          <Link href={`/${lang}/login?callbackUrl=/${lang}/clinic/dashboard/lab`}>
            <Button variant="primary" className="mt-4">
              {t.login}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // No clinic
  if (noClinic) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-2xl mx-auto text-center py-16">
          <h1 className="text-2xl font-bold mb-2">{t.noClinic}</h1>
          <p className="text-gray-600">{t.noClinicMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{t.title}</h1>
          <Link href={`/${lang}/clinic/dashboard`}>
            <Button variant="outline">← Back to Dashboard</Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card decorator="yellow" decoratorPosition="top-right">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-primary-yellow">{stats.pending}</div>
              <div className="text-sm text-gray-600">{t.pendingCount}</div>
            </CardContent>
          </Card>
          <Card decorator="blue" decoratorPosition="top-right">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-primary-blue">{stats.processing}</div>
              <div className="text-sm text-gray-600">{t.processingCount}</div>
            </CardContent>
          </Card>
          <Card decorator="red" decoratorPosition="top-right">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-verified">{stats.completedToday}</div>
              <div className="text-sm text-gray-600">{t.completedCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold">{stats.totalToday}</div>
              <div className="text-sm text-gray-600">{t.todayOrders}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex border-b-2 border-foreground mb-6 overflow-x-auto">
          {(["pending", "processing", "completed", "all"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? "bg-foreground text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              {tab === "pending"
                ? t.pendingOrders
                : tab === "processing"
                ? t.inProgress
                : tab === "completed"
                ? t.completed
                : t.all}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {labOrders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <p className="text-lg">{t.noOrders}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {labOrders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    {/* Order Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono font-bold text-lg">{order.order_number}</span>
                        {order.priority !== "ROUTINE" && (
                          <span className={`px-2 py-1 rounded text-xs font-bold ${getPriorityColor(order.priority)}`}>
                            {order.priority === "STAT" ? t.stat : t.urgent}
                          </span>
                        )}
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-500">{t.patient}:</span>
                          <div className="font-medium">{order.patient.full_name}</div>
                          <div className="text-gray-500">
                            #{order.patient.patient_number} • {getAge(order.patient.date_of_birth)} • {order.patient.gender || "-"}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">{t.orderedBy}:</span>
                          <div className="font-medium">{order.ordered_by.full_name.startsWith("Dr.") ? "" : "Dr. "}{order.ordered_by.full_name}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">{t.orderedAt}:</span>
                          <div>{new Date(order.created_at).toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">{t.tests}:</span>
                          <div className="font-medium">{order.results.length} test(s)</div>
                        </div>
                      </div>

                      {/* Tests List */}
                      <div className="flex flex-wrap gap-2">
                        {order.results.map((result) => (
                          <span
                            key={result.id}
                            className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-sm"
                          >
                            {result.lab_test.short_name || result.lab_test.name}
                          </span>
                        ))}
                      </div>

                      {order.clinical_notes && (
                        <div className="mt-2 text-sm text-gray-600 italic">
                          {t.clinicalNotes}: {order.clinical_notes}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap lg:flex-col gap-2">
                      {order.status === "ORDERED" && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleCollectSample(order.id)}
                        >
                          {t.collectSample}
                        </Button>
                      )}
                      {order.status === "SAMPLE_COLLECTED" && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleStartProcessing(order.id)}
                        >
                          {t.markProcessing}
                        </Button>
                      )}
                      {(order.status === "SAMPLE_COLLECTED" || order.status === "PROCESSING") && (
                        <Link href={`/${lang}/clinic/dashboard/lab/${order.id}`}>
                          <Button variant="primary" size="sm">
                            {t.enterResults}
                          </Button>
                        </Link>
                      )}
                      {order.status === "COMPLETED" && (
                        <Link href={`/${lang}/clinic/dashboard/lab/${order.id}`}>
                          <Button variant="outline" size="sm">
                            {t.viewResults}
                          </Button>
                        </Link>
                      )}
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
