"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ReportSummary {
  totalInvoices: number;
  totalCollection: number;
  totalPending: number;
  totalPaid: number;
  totalPartial: number;
  totalDiscount: number;
  totalTax: number;
  subtotal: number;
}

interface PaymentModeBreakdown {
  [key: string]: { count: number; amount: number };
}

interface PaymentStatusBreakdown {
  [key: string]: { count: number; amount: number };
}

interface DailyData {
  date: string;
  invoiceCount: number;
  totalCollection: number;
  paidAmount: number;
  pendingAmount: number;
}

interface InvoiceRecord {
  id: string;
  invoice_number: string;
  patient_name: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_mode: string;
  payment_status: string;
  created_at: string;
}

interface Clinic {
  id: string;
  name: string;
}

// Translations
const translations = {
  en: {
    title: "Billing Reports",
    subtitle: "View collection summary and reports",
    dateRange: "Date Range",
    from: "From",
    to: "To",
    apply: "Apply",
    today: "Today",
    thisWeek: "This Week",
    thisMonth: "This Month",
    last30Days: "Last 30 Days",
    summary: "Collection Summary",
    totalInvoices: "Total Invoices",
    totalCollection: "Total Collection",
    paidAmount: "Paid Amount",
    pendingAmount: "Pending Amount",
    totalDiscount: "Total Discount",
    totalTax: "Total Tax",
    paymentModeBreakdown: "Payment Mode Breakdown",
    paymentMode: "Payment Mode",
    count: "Count",
    amount: "Amount",
    cash: "Cash",
    card: "Card",
    upi: "UPI",
    bankTransfer: "Bank Transfer",
    insurance: "Insurance",
    credit: "Credit (Khata)",
    dailyCollection: "Daily Collection",
    date: "Date",
    invoices: "Invoices",
    collected: "Collected",
    paid: "Paid",
    pending: "Pending",
    exportCSV: "Export to CSV",
    exporting: "Exporting...",
    noData: "No data available",
    noDataMessage: "No invoices found for the selected date range.",
    loginRequired: "Please log in to access reports",
    login: "Login",
    loading: "Loading...",
    errorLoading: "Failed to load report data",
    retry: "Retry",
    noClinic: "No Verified Clinic",
    noClinicMessage: "You don't have a verified clinic yet.",
    back: "Back to Dashboard",
    invoiceDetails: "Invoice Details",
    invoiceNumber: "Invoice #",
    patient: "Patient",
    status: "Status",
    statusPaid: "Paid",
    statusPending: "Pending",
    statusPartial: "Partial",
    statusRefunded: "Refunded",
    statusCancelled: "Cancelled",
  },
  ne: {
    title: "बिलिङ रिपोर्टहरू",
    subtitle: "संग्रह सारांश र रिपोर्टहरू हेर्नुहोस्",
    dateRange: "मिति दायरा",
    from: "देखि",
    to: "सम्म",
    apply: "लागू गर्नुहोस्",
    today: "आज",
    thisWeek: "यो हप्ता",
    thisMonth: "यो महिना",
    last30Days: "गत ३० दिन",
    summary: "संग्रह सारांश",
    totalInvoices: "कुल इनभ्वाइसहरू",
    totalCollection: "कुल संग्रह",
    paidAmount: "भुक्तान रकम",
    pendingAmount: "बाँकी रकम",
    totalDiscount: "कुल छुट",
    totalTax: "कुल कर",
    paymentModeBreakdown: "भुक्तानी मोड विश्लेषण",
    paymentMode: "भुक्तानी मोड",
    count: "संख्या",
    amount: "रकम",
    cash: "नगद",
    card: "कार्ड",
    upi: "यूपीआई",
    bankTransfer: "बैंक ट्रान्सफर",
    insurance: "बीमा",
    credit: "उधारो (खाता)",
    dailyCollection: "दैनिक संग्रह",
    date: "मिति",
    invoices: "इनभ्वाइसहरू",
    collected: "संग्रहित",
    paid: "भुक्तान भयो",
    pending: "बाँकी",
    exportCSV: "CSV मा निर्यात गर्नुहोस्",
    exporting: "निर्यात हुँदैछ...",
    noData: "कुनै डेटा उपलब्ध छैन",
    noDataMessage: "चयन गरिएको मिति दायरामा कुनै इनभ्वाइस भेटिएन।",
    loginRequired: "रिपोर्टहरू पहुँच गर्न कृपया लगइन गर्नुहोस्",
    login: "लगइन गर्नुहोस्",
    loading: "लोड हुँदैछ...",
    errorLoading: "रिपोर्ट डेटा लोड गर्न असफल भयो",
    retry: "पुन: प्रयास गर्नुहोस्",
    noClinic: "कुनै प्रमाणित क्लिनिक छैन",
    noClinicMessage: "तपाईंसँग अझै प्रमाणित क्लिनिक छैन।",
    back: "ड्यासबोर्डमा फर्कनुहोस्",
    invoiceDetails: "इनभ्वाइस विवरणहरू",
    invoiceNumber: "इनभ्वाइस #",
    patient: "बिरामी",
    status: "स्थिति",
    statusPaid: "भुक्तान भयो",
    statusPending: "बाँकी",
    statusPartial: "आंशिक",
    statusRefunded: "फिर्ता भयो",
    statusCancelled: "रद्द भयो",
  },
};

const PAYMENT_MODE_LABELS: Record<string, { en: string; ne: string }> = {
  CASH: { en: "Cash", ne: "नगद" },
  CARD: { en: "Card", ne: "कार्ड" },
  UPI: { en: "UPI", ne: "यूपीआई" },
  BANK_TRANSFER: { en: "Bank Transfer", ne: "बैंक ट्रान्सफर" },
  INSURANCE: { en: "Insurance", ne: "बीमा" },
  CREDIT: { en: "Credit (Khata)", ne: "उधारो (खाता)" },
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PAID: "bg-verified text-white",
  PENDING: "bg-primary-yellow text-foreground",
  PARTIAL: "bg-primary-blue text-white",
  REFUNDED: "bg-foreground/20 text-foreground",
  CANCELLED: "bg-primary-red text-white",
};

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en";
  const t = translations[lang as keyof typeof translations] || translations.en;

  // Date range state
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  // Data state
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [paymentModeBreakdown, setPaymentModeBreakdown] = useState<PaymentModeBreakdown | null>(null);
  const [paymentStatusBreakdown, setPaymentStatusBreakdown] = useState<PaymentStatusBreakdown | null>(null);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noClinic, setNoClinic] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNoClinic(false);

    try {
      const params = new URLSearchParams({
        dateFrom,
        dateTo,
      });

      const response = await fetch(`/api/clinic/reports?${params}`);

      if (response.status === 404) {
        const data = await response.json();
        if (data.code === "NO_CLINIC") {
          setNoClinic(true);
          return;
        }
      }

      if (!response.ok) {
        throw new Error("Failed to fetch report data");
      }

      const data = await response.json();
      setClinic(data.clinic);
      setSummary(data.summary);
      setPaymentModeBreakdown(data.paymentModeBreakdown);
      setPaymentStatusBreakdown(data.paymentStatusBreakdown);
      setDailyData(data.dailyData);
      setInvoices(data.invoices);
    } catch (err) {
      console.error("Error fetching report data:", err);
      setError(t.errorLoading);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, t.errorLoading]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchReportData();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, fetchReportData]);

  // Quick date range presets
  const setDateRange = (preset: string) => {
    const today = new Date();
    let from = new Date();

    switch (preset) {
      case "today":
        from = today;
        break;
      case "thisWeek":
        from.setDate(today.getDate() - today.getDay());
        break;
      case "thisMonth":
        from = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case "last30Days":
      default:
        from.setDate(today.getDate() - 30);
        break;
    }

    setDateFrom(from.toISOString().split("T")[0]);
    setDateTo(today.toISOString().split("T")[0]);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `NPR ${amount.toLocaleString("en-NP", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(lang === "ne" ? "ne-NP" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Export to CSV
  const handleExportCSV = async () => {
    if (!invoices.length || !clinic) return;

    setExporting(true);

    try {
      // Build CSV content
      const headers = [
        "Invoice Number",
        "Date",
        "Patient",
        "Subtotal",
        "Discount",
        "Tax",
        "Total",
        "Payment Mode",
        "Status",
      ];

      const rows = invoices.map((inv) => [
        inv.invoice_number,
        new Date(inv.created_at).toLocaleDateString(),
        inv.patient_name,
        inv.subtotal.toFixed(2),
        inv.discount.toFixed(2),
        inv.tax.toFixed(2),
        inv.total.toFixed(2),
        PAYMENT_MODE_LABELS[inv.payment_mode]?.en || inv.payment_mode,
        inv.payment_status,
      ]);

      // Add summary rows
      rows.push([]);
      rows.push(["Summary"]);
      rows.push(["Total Invoices", String(summary?.totalInvoices || 0)]);
      rows.push(["Total Collection", formatCurrency(summary?.totalCollection || 0)]);
      rows.push(["Paid Amount", formatCurrency(summary?.totalPaid || 0)]);
      rows.push(["Pending Amount", formatCurrency(summary?.totalPending || 0)]);
      rows.push(["Total Discount", formatCurrency(summary?.totalDiscount || 0)]);
      rows.push(["Total Tax", formatCurrency(summary?.totalTax || 0)]);

      // Convert to CSV string
      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row
            .map((cell) => {
              // Escape cells that contain commas or quotes
              if (typeof cell === "string" && (cell.includes(",") || cell.includes('"'))) {
                return `"${cell.replace(/"/g, '""')}"`;
              }
              return cell;
            })
            .join(",")
        ),
      ].join("\n");

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `billing-report-${clinic.name.replace(/\s+/g, "-")}-${dateFrom}-to-${dateTo}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error exporting CSV:", err);
    } finally {
      setExporting(false);
    }
  };

  // Get payment status label
  const getPaymentStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PAID: t.statusPaid,
      PENDING: t.statusPending,
      PARTIAL: t.statusPartial,
      REFUNDED: t.statusRefunded,
      CANCELLED: t.statusCancelled,
    };
    return labels[status] || status;
  };

  // Loading state
  if (status === "loading" || loading) {
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
              <h1 className="text-3xl font-bold text-foreground">{t.title}</h1>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/70 mb-6">{t.loginRequired}</p>
              <Link href={`/${lang}/login?callbackUrl=/${lang}/clinic/dashboard/reports`}>
                <Button variant="primary">{t.login}</Button>
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
              <h1 className="text-3xl font-bold text-foreground">{t.noClinic}</h1>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/70 mb-6">{t.noClinicMessage}</p>
              <Link href={`/${lang}/clinic/dashboard`}>
                <Button variant="primary">{t.back}</Button>
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
              <h1 className="text-3xl font-bold text-foreground">{t.title}</h1>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/70 mb-6">{error}</p>
              <Button variant="primary" onClick={fetchReportData}>
                {t.retry}
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
              className="inline-flex items-center text-foreground/70 hover:text-foreground mb-2 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {t.back}
            </Link>
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground">{t.title}</h1>
            <p className="text-foreground/60">{t.subtitle}</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button
              variant="primary"
              onClick={handleExportCSV}
              disabled={exporting || !invoices.length}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {exporting ? t.exporting : t.exportCSV}
            </Button>
          </div>
        </div>

        {/* Date Range Filter */}
        <Card decorator="blue" decoratorPosition="top-left" className="mb-8">
          <CardHeader>
            <h2 className="text-lg font-bold uppercase tracking-wider">{t.dateRange}</h2>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-end">
              {/* Quick presets */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setDateRange("today")}
                  className="px-3 py-2 border-2 border-foreground bg-white text-sm font-bold hover:bg-foreground hover:text-white transition-colors"
                >
                  {t.today}
                </button>
                <button
                  onClick={() => setDateRange("thisWeek")}
                  className="px-3 py-2 border-2 border-foreground bg-white text-sm font-bold hover:bg-foreground hover:text-white transition-colors"
                >
                  {t.thisWeek}
                </button>
                <button
                  onClick={() => setDateRange("thisMonth")}
                  className="px-3 py-2 border-2 border-foreground bg-white text-sm font-bold hover:bg-foreground hover:text-white transition-colors"
                >
                  {t.thisMonth}
                </button>
                <button
                  onClick={() => setDateRange("last30Days")}
                  className="px-3 py-2 border-2 border-foreground bg-white text-sm font-bold hover:bg-foreground hover:text-white transition-colors"
                >
                  {t.last30Days}
                </button>
              </div>

              {/* Custom date inputs */}
              <div className="flex items-center gap-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-foreground/60 mb-1">
                    {t.from}
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="p-2 border-2 border-foreground bg-white text-foreground font-medium focus:outline-none focus:border-primary-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-foreground/60 mb-1">
                    {t.to}
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="p-2 border-2 border-foreground bg-white text-foreground font-medium focus:outline-none focus:border-primary-blue"
                  />
                </div>
                <Button variant="primary" onClick={fetchReportData} className="self-end">
                  {t.apply}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <Card decorator="blue" decoratorPosition="top-left">
              <CardContent className="py-4">
                <p className="text-xs font-bold uppercase tracking-wider text-foreground/60">
                  {t.totalInvoices}
                </p>
                <p className="text-2xl font-black text-primary-blue">{summary.totalInvoices}</p>
              </CardContent>
            </Card>
            <Card decorator="blue" decoratorPosition="top-left">
              <CardContent className="py-4">
                <p className="text-xs font-bold uppercase tracking-wider text-foreground/60">
                  {t.totalCollection}
                </p>
                <p className="text-2xl font-black text-primary-blue">
                  {formatCurrency(summary.totalCollection)}
                </p>
              </CardContent>
            </Card>
            <Card decorator="blue" decoratorPosition="top-left">
              <CardContent className="py-4">
                <p className="text-xs font-bold uppercase tracking-wider text-foreground/60">
                  {t.paidAmount}
                </p>
                <p className="text-2xl font-black text-verified">{formatCurrency(summary.totalPaid)}</p>
              </CardContent>
            </Card>
            <Card decorator="yellow" decoratorPosition="top-left">
              <CardContent className="py-4">
                <p className="text-xs font-bold uppercase tracking-wider text-foreground/60">
                  {t.pendingAmount}
                </p>
                <p className="text-2xl font-black text-primary-yellow">{formatCurrency(summary.totalPending)}</p>
              </CardContent>
            </Card>
            <Card decorator="red" decoratorPosition="top-left">
              <CardContent className="py-4">
                <p className="text-xs font-bold uppercase tracking-wider text-foreground/60">
                  {t.totalDiscount}
                </p>
                <p className="text-2xl font-black text-primary-red">{formatCurrency(summary.totalDiscount)}</p>
              </CardContent>
            </Card>
            <Card decorator="blue" decoratorPosition="top-left">
              <CardContent className="py-4">
                <p className="text-xs font-bold uppercase tracking-wider text-foreground/60">
                  {t.totalTax}
                </p>
                <p className="text-2xl font-black text-foreground/70">{formatCurrency(summary.totalTax)}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* No data message */}
        {summary && summary.totalInvoices === 0 && (
          <Card decorator="yellow" decoratorPosition="top-right" className="mb-8">
            <CardContent className="py-12 text-center">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-foreground/20"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="text-xl font-bold mb-2">{t.noData}</h3>
              <p className="text-foreground/60">{t.noDataMessage}</p>
            </CardContent>
          </Card>
        )}

        {/* Content Grid */}
        {summary && summary.totalInvoices > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Payment Mode Breakdown */}
            <div className="lg:col-span-1">
              <Card decorator="red" decoratorPosition="top-right">
                <CardHeader>
                  <h2 className="text-lg font-bold uppercase tracking-wider">{t.paymentModeBreakdown}</h2>
                </CardHeader>
                <CardContent>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-foreground">
                        <th className="text-left py-2 text-xs font-bold uppercase tracking-wider">{t.paymentMode}</th>
                        <th className="text-center py-2 text-xs font-bold uppercase tracking-wider">{t.count}</th>
                        <th className="text-right py-2 text-xs font-bold uppercase tracking-wider">{t.amount}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentModeBreakdown &&
                        Object.entries(paymentModeBreakdown)
                          .filter(([, data]) => data.count > 0)
                          .sort((a, b) => b[1].amount - a[1].amount)
                          .map(([mode, data]) => (
                            <tr key={mode} className="border-b border-foreground/10">
                              <td className="py-3">
                                {PAYMENT_MODE_LABELS[mode]?.[lang as keyof typeof PAYMENT_MODE_LABELS["CASH"]] ||
                                  mode}
                              </td>
                              <td className="py-3 text-center font-bold">{data.count}</td>
                              <td className="py-3 text-right font-bold text-primary-blue">
                                {formatCurrency(data.amount)}
                              </td>
                            </tr>
                          ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Daily Collection */}
            <div className="lg:col-span-2">
              <Card decorator="blue" decoratorPosition="top-left">
                <CardHeader>
                  <h2 className="text-lg font-bold uppercase tracking-wider">{t.dailyCollection}</h2>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-foreground">
                          <th className="text-left py-2 text-xs font-bold uppercase tracking-wider">{t.date}</th>
                          <th className="text-center py-2 text-xs font-bold uppercase tracking-wider">{t.invoices}</th>
                          <th className="text-right py-2 text-xs font-bold uppercase tracking-wider">{t.collected}</th>
                          <th className="text-right py-2 text-xs font-bold uppercase tracking-wider">{t.paid}</th>
                          <th className="text-right py-2 text-xs font-bold uppercase tracking-wider">{t.pending}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dailyData.map((day) => (
                          <tr key={day.date} className="border-b border-foreground/10 hover:bg-foreground/5">
                            <td className="py-3 font-medium">{formatDate(day.date)}</td>
                            <td className="py-3 text-center">{day.invoiceCount}</td>
                            <td className="py-3 text-right font-bold">{formatCurrency(day.totalCollection)}</td>
                            <td className="py-3 text-right text-verified">{formatCurrency(day.paidAmount)}</td>
                            <td className="py-3 text-right text-primary-yellow">{formatCurrency(day.pendingAmount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Invoice Details Table */}
        {invoices.length > 0 && (
          <Card decorator="yellow" decoratorPosition="top-right" className="mt-8">
            <CardHeader>
              <h2 className="text-lg font-bold uppercase tracking-wider">{t.invoiceDetails}</h2>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-foreground">
                      <th className="text-left py-2 text-xs font-bold uppercase tracking-wider">{t.invoiceNumber}</th>
                      <th className="text-left py-2 text-xs font-bold uppercase tracking-wider">{t.date}</th>
                      <th className="text-left py-2 text-xs font-bold uppercase tracking-wider">{t.patient}</th>
                      <th className="text-right py-2 text-xs font-bold uppercase tracking-wider">{t.amount}</th>
                      <th className="text-center py-2 text-xs font-bold uppercase tracking-wider">{t.paymentMode}</th>
                      <th className="text-center py-2 text-xs font-bold uppercase tracking-wider">{t.status}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.slice(0, 20).map((invoice) => (
                      <tr key={invoice.id} className="border-b border-foreground/10 hover:bg-foreground/5">
                        <td className="py-3 font-bold">{invoice.invoice_number}</td>
                        <td className="py-3">{formatDate(invoice.created_at)}</td>
                        <td className="py-3">{invoice.patient_name}</td>
                        <td className="py-3 text-right font-bold text-primary-blue">
                          {formatCurrency(invoice.total)}
                        </td>
                        <td className="py-3 text-center">
                          <span className="px-2 py-1 bg-foreground/10 text-xs font-bold">
                            {PAYMENT_MODE_LABELS[invoice.payment_mode]?.[
                              lang as keyof typeof PAYMENT_MODE_LABELS["CASH"]
                            ] || invoice.payment_mode}
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <span
                            className={`px-2 py-1 text-xs font-bold uppercase ${
                              PAYMENT_STATUS_COLORS[invoice.payment_status] || "bg-foreground/20"
                            }`}
                          >
                            {getPaymentStatusLabel(invoice.payment_status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {invoices.length > 20 && (
                <p className="mt-4 text-center text-foreground/60 text-sm">
                  Showing 20 of {invoices.length} invoices. Export to CSV for complete list.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
