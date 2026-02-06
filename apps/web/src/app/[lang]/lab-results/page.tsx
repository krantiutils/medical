"use client";

import { useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type LabOrderStatus = "ORDERED" | "SAMPLE_COLLECTED" | "PROCESSING" | "COMPLETED" | "CANCELLED";
type LabResultFlag = "NORMAL" | "LOW" | "HIGH" | "CRITICAL_LOW" | "CRITICAL_HIGH" | "ABNORMAL";

interface LabResult {
  test_name: string;
  category: string | null;
  result_value: string | null;
  unit: string | null;
  normal_range: string | null;
  flag: LabResultFlag | null;
  remarks: string | null;
}

interface LabOrderResponse {
  found: boolean;
  order?: {
    id: string;
    order_number: string;
    status: LabOrderStatus;
    priority: string;
    created_at: string;
    completed_at: string | null;
    patient_name: string;
    clinic: {
      name: string;
      address: string | null;
      phone: string | null;
    };
    results?: LabResult[];
  };
  message?: string;
}

const translations = {
  en: {
    // Header
    label: "Lab Results",
    title: "Check Your",
    titleHighlight: "Lab Results",
    subtitle: "Enter your phone number and order number to view your lab test results",
    // Form
    phoneLabel: "Phone Number",
    phonePlaceholder: "e.g., 9812345678",
    orderLabel: "Order Number",
    orderPlaceholder: "e.g., LAB-20260206-0001",
    checkResults: "Check Results",
    checking: "Checking...",
    // Validation
    phoneRequired: "Phone number is required",
    phoneInvalid: "Invalid phone number format",
    orderRequired: "Order number is required",
    orderInvalid: "Order number format should be LAB-XXXXXXXX-XXXX",
    // Status
    statusLabel: "Status",
    statusOrdered: "Ordered",
    statusSampleCollected: "Sample Collected",
    statusProcessing: "Processing",
    statusCompleted: "Completed",
    statusCancelled: "Cancelled",
    // Results
    resultsTitle: "Test Results",
    testName: "Test",
    result: "Result",
    unit: "Unit",
    normalRange: "Normal Range",
    flag: "Flag",
    noResults: "Results not yet available",
    // Flags
    flagNormal: "Normal",
    flagLow: "Low",
    flagHigh: "High",
    flagCriticalLow: "Critical Low",
    flagCriticalHigh: "Critical High",
    flagAbnormal: "Abnormal",
    // Info
    patientName: "Patient",
    clinicName: "Clinic",
    orderDate: "Order Date",
    completedDate: "Completed",
    priority: "Priority",
    priorityRoutine: "Routine",
    priorityUrgent: "Urgent",
    priorityStat: "STAT",
    // Actions
    print: "Print Results",
    newSearch: "New Search",
    // Messages
    notCompletedMessage: "Your tests are still being processed. Please check back later.",
    // Footer
    helpText: "Having trouble? Contact the clinic directly.",
    homeLink: "Back to Home",
  },
  ne: {
    // Header
    label: "ल्याब रिजल्ट",
    title: "आफ्नो",
    titleHighlight: "ल्याब रिजल्ट हेर्नुहोस्",
    subtitle: "आफ्नो ल्याब टेस्ट रिजल्ट हेर्न फोन नम्बर र अर्डर नम्बर प्रविष्ट गर्नुहोस्",
    // Form
    phoneLabel: "फोन नम्बर",
    phonePlaceholder: "जस्तै: ९८१२३४५६७८",
    orderLabel: "अर्डर नम्बर",
    orderPlaceholder: "जस्तै: LAB-20260206-0001",
    checkResults: "रिजल्ट हेर्नुहोस्",
    checking: "जाँच गर्दै...",
    // Validation
    phoneRequired: "फोन नम्बर आवश्यक छ",
    phoneInvalid: "अमान्य फोन नम्बर",
    orderRequired: "अर्डर नम्बर आवश्यक छ",
    orderInvalid: "अर्डर नम्बर ढाँचा LAB-XXXXXXXX-XXXX हुनुपर्छ",
    // Status
    statusLabel: "स्थिति",
    statusOrdered: "अर्डर गरियो",
    statusSampleCollected: "नमुना संकलन भयो",
    statusProcessing: "प्रशोधन हुँदैछ",
    statusCompleted: "पूर्ण भयो",
    statusCancelled: "रद्द भयो",
    // Results
    resultsTitle: "टेस्ट रिजल्टहरू",
    testName: "टेस्ट",
    result: "रिजल्ट",
    unit: "एकाइ",
    normalRange: "सामान्य दायरा",
    flag: "फ्ल्याग",
    noResults: "रिजल्टहरू अझै उपलब्ध छैनन्",
    // Flags
    flagNormal: "सामान्य",
    flagLow: "कम",
    flagHigh: "उच्च",
    flagCriticalLow: "गम्भीर कम",
    flagCriticalHigh: "गम्भीर उच्च",
    flagAbnormal: "असामान्य",
    // Info
    patientName: "बिरामी",
    clinicName: "क्लिनिक",
    orderDate: "अर्डर मिति",
    completedDate: "पूर्ण भएको मिति",
    priority: "प्राथमिकता",
    priorityRoutine: "सामान्य",
    priorityUrgent: "अर्जेन्ट",
    priorityStat: "तुरुन्त",
    // Actions
    print: "रिजल्ट छाप्नुहोस्",
    newSearch: "नयाँ खोजी",
    // Messages
    notCompletedMessage: "तपाईंको टेस्टहरू अझै प्रशोधन हुँदैछन्। कृपया पछि फेरि हेर्नुहोस्।",
    // Footer
    helpText: "समस्या छ? क्लिनिकमा सीधै सम्पर्क गर्नुहोस्।",
    homeLink: "गृहपृष्ठमा फर्कनुहोस्",
  },
};

export default function LabResultsPage() {
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en";
  const t = translations[lang as keyof typeof translations] || translations.en;

  const resultsRef = useRef<HTMLDivElement>(null);

  // Form state
  const [phone, setPhone] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ phone?: string; order?: string }>({});

  // Results state
  const [result, setResult] = useState<LabOrderResponse | null>(null);

  // Validation
  const validate = (): boolean => {
    const errors: { phone?: string; order?: string } = {};

    if (!phone.trim()) {
      errors.phone = t.phoneRequired;
    } else if (!/^(98|97|96|0)\d{7,9}$/.test(phone.replace(/\s/g, ""))) {
      errors.phone = t.phoneInvalid;
    }

    if (!orderNumber.trim()) {
      errors.order = t.orderRequired;
    } else if (!/^LAB-\d{8}-\d{4}$/.test(orderNumber.trim())) {
      errors.order = t.orderInvalid;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validate()) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const cleanPhone = phone.replace(/\s/g, "");
      const cleanOrder = orderNumber.trim();

      const response = await fetch(
        `/api/lab-results/lookup?phone=${encodeURIComponent(cleanPhone)}&order_number=${encodeURIComponent(cleanOrder)}`
      );

      const data: LabOrderResponse = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to fetch results");
        return;
      }

      setResult(data);
    } catch (err) {
      console.error("Error fetching results:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const handleNewSearch = () => {
    setResult(null);
    setError(null);
    setFieldErrors({});
    setPhone("");
    setOrderNumber("");
  };

  // Get status display
  const getStatusDisplay = (status: LabOrderStatus) => {
    const statusMap: Record<LabOrderStatus, { label: string; color: string }> = {
      ORDERED: { label: t.statusOrdered, color: "bg-gray-100 text-gray-800 border-gray-300" },
      SAMPLE_COLLECTED: { label: t.statusSampleCollected, color: "bg-blue-100 text-blue-800 border-blue-300" },
      PROCESSING: { label: t.statusProcessing, color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
      COMPLETED: { label: t.statusCompleted, color: "bg-green-100 text-green-800 border-green-300" },
      CANCELLED: { label: t.statusCancelled, color: "bg-red-100 text-red-800 border-red-300" },
    };
    return statusMap[status] || statusMap.ORDERED;
  };

  // Get flag display
  const getFlagDisplay = (flag: LabResultFlag | null) => {
    if (!flag) return null;

    const flagMap: Record<LabResultFlag, { label: string; color: string; bgColor: string }> = {
      NORMAL: { label: t.flagNormal, color: "text-green-700", bgColor: "bg-green-50" },
      LOW: { label: t.flagLow, color: "text-blue-700", bgColor: "bg-blue-50" },
      HIGH: { label: t.flagHigh, color: "text-orange-700", bgColor: "bg-orange-50" },
      CRITICAL_LOW: { label: t.flagCriticalLow, color: "text-red-700", bgColor: "bg-red-50" },
      CRITICAL_HIGH: { label: t.flagCriticalHigh, color: "text-red-700", bgColor: "bg-red-50" },
      ABNORMAL: { label: t.flagAbnormal, color: "text-purple-700", bgColor: "bg-purple-50" },
    };
    return flagMap[flag];
  };

  // Get priority display
  const getPriorityDisplay = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return t.priorityUrgent;
      case "STAT":
        return t.priorityStat;
      default:
        return t.priorityRoutine;
    }
  };

  // Print handler
  const handlePrint = () => {
    if (!resultsRef.current || !result?.order) return;

    const printContents = resultsRef.current.innerHTML;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Lab Results - ${result.order.order_number}</title>
            <style>
              body {
                font-family: 'Arial', sans-serif;
                padding: 40px;
                max-width: 800px;
                margin: 0 auto;
                color: #121212;
              }
              .print-header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 3px solid #121212;
                padding-bottom: 20px;
              }
              .print-header h1 {
                font-size: 24px;
                margin: 0 0 8px 0;
                text-transform: uppercase;
                letter-spacing: 1px;
              }
              .print-header p {
                margin: 4px 0;
                font-size: 14px;
                color: #666;
              }
              .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 30px;
              }
              .info-item {
                margin-bottom: 8px;
              }
              .info-label {
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: #666;
                margin-bottom: 2px;
              }
              .info-value {
                font-size: 14px;
                font-weight: 600;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
              }
              th, td {
                border: 2px solid #121212;
                padding: 10px;
                text-align: left;
                font-size: 13px;
              }
              th {
                background-color: #f0f0f0;
                font-weight: bold;
                text-transform: uppercase;
                font-size: 11px;
                letter-spacing: 0.5px;
              }
              .flag-normal { color: #16a34a; }
              .flag-high, .flag-low { color: #ea580c; }
              .flag-critical { color: #dc2626; font-weight: bold; }
              .flag-abnormal { color: #7c3aed; }
              .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 2px solid #121212;
                text-align: center;
                font-size: 12px;
                color: #666;
              }
              @media print {
                body { padding: 20px; }
                @page { margin: 1cm; }
              }
            </style>
          </head>
          <body>
            ${printContents}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="bg-background min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          {/* Left Content */}
          <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16 lg:py-20">
            <div className="max-w-xl">
              <span className="inline-block px-4 py-2 mb-6 text-xs font-bold uppercase tracking-widest bg-primary-blue text-white border-2 border-foreground">
                {t.label}
              </span>

              <h1 className="text-4xl lg:text-6xl font-black uppercase leading-[0.9] tracking-tight mb-6">
                {t.title}
                <span className="block text-primary-blue">{t.titleHighlight}</span>
              </h1>

              <p className="text-lg text-foreground/80 max-w-lg">{t.subtitle}</p>
            </div>
          </div>

          {/* Right Color Block */}
          <div className="hidden lg:flex lg:w-[35%] bg-primary-blue relative">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-1/4 -left-16 w-48 h-48 rounded-full border-8 border-white/20" />
              <div className="absolute bottom-1/4 right-1/4 w-16 h-16 rounded-full bg-primary-yellow" />
              <div className="absolute top-1/3 right-12 w-24 h-24 bg-primary-red -rotate-12" />
              <div className="absolute bottom-16 left-20 w-6 h-6 bg-white" />
            </div>
            <div className="relative z-10 flex flex-col items-center justify-center w-full p-12">
              <div className="text-white text-center">
                <svg
                  className="w-24 h-24 mx-auto mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611l-.628.105a9.001 9.001 0 01-5.854-.113 8.972 8.972 0 00-5.854.113l-.628-.105c-1.717-.293-2.299-2.379-1.067-3.611L5 14.5"
                  />
                </svg>
                <div className="text-2xl font-bold uppercase tracking-wider opacity-80">
                  {lang === "ne" ? "ल्याब" : "Lab"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile accent bar */}
        <div className="lg:hidden h-3 flex">
          <div className="flex-1 bg-primary-blue" />
          <div className="flex-1 bg-primary-red" />
          <div className="flex-1 bg-primary-yellow" />
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 px-6 lg:px-16 border-t-4 border-foreground">
        <div className="max-w-4xl mx-auto">
          {!result ? (
            // Search Form
            <div className="bg-white border-4 border-foreground p-8 shadow-[6px_6px_0_0_#121212]">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Phone Input */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-2">
                    {t.phoneLabel} *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (fieldErrors.phone) {
                        setFieldErrors((prev) => ({ ...prev, phone: undefined }));
                      }
                    }}
                    placeholder={t.phonePlaceholder}
                    className={`w-full px-4 py-3 border-4 ${
                      fieldErrors.phone ? "border-primary-red" : "border-foreground"
                    } focus:outline-none focus:border-primary-blue transition-colors`}
                  />
                  {fieldErrors.phone && (
                    <p className="mt-1 text-sm text-primary-red font-medium">{fieldErrors.phone}</p>
                  )}
                </div>

                {/* Order Number Input */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-2">
                    {t.orderLabel} *
                  </label>
                  <input
                    type="text"
                    value={orderNumber}
                    onChange={(e) => {
                      setOrderNumber(e.target.value.toUpperCase());
                      if (fieldErrors.order) {
                        setFieldErrors((prev) => ({ ...prev, order: undefined }));
                      }
                    }}
                    placeholder={t.orderPlaceholder}
                    className={`w-full px-4 py-3 border-4 ${
                      fieldErrors.order ? "border-primary-red" : "border-foreground"
                    } focus:outline-none focus:border-primary-blue transition-colors font-mono`}
                  />
                  {fieldErrors.order && (
                    <p className="mt-1 text-sm text-primary-red font-medium">{fieldErrors.order}</p>
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-primary-red/10 border-l-4 border-primary-red">
                    <p className="text-primary-red font-medium">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <Button type="submit" variant="primary" size="lg" className="w-full py-4" disabled={loading}>
                  {loading ? t.checking : t.checkResults}
                </Button>
              </form>

              {/* Help text */}
              <p className="mt-6 text-center text-sm text-foreground/60">{t.helpText}</p>
            </div>
          ) : (
            // Results Display
            <div className="space-y-6">
              {/* Results Card */}
              <div
                ref={resultsRef}
                className="bg-white border-4 border-foreground p-8 shadow-[6px_6px_0_0_#121212]"
              >
                {/* Print Header (shown only in print) */}
                <div className="print-header hidden print:block">
                  <h1>{result.order?.clinic.name}</h1>
                  {result.order?.clinic.address && <p>{result.order.clinic.address}</p>}
                  {result.order?.clinic.phone && <p>Tel: {result.order.clinic.phone}</p>}
                </div>

                {/* Order Info */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-1">
                        {t.patientName}
                      </div>
                      <div className="text-lg font-bold">{result.order?.patient_name}</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-1">
                        {t.orderLabel}
                      </div>
                      <div className="text-lg font-mono">{result.order?.order_number}</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-1">
                        {t.clinicName}
                      </div>
                      <div className="font-medium">{result.order?.clinic.name}</div>
                      {result.order?.clinic.address && (
                        <div className="text-sm text-foreground/60">{result.order.clinic.address}</div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-1">
                        {t.statusLabel}
                      </div>
                      <span
                        className={`inline-block px-3 py-1 text-sm font-bold border-2 ${
                          getStatusDisplay(result.order!.status).color
                        }`}
                      >
                        {getStatusDisplay(result.order!.status).label}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-1">
                        {t.orderDate}
                      </div>
                      <div className="font-medium">
                        {new Date(result.order!.created_at).toLocaleDateString(
                          lang === "ne" ? "ne-NP" : "en-US",
                          { year: "numeric", month: "long", day: "numeric" }
                        )}
                      </div>
                    </div>
                    {result.order?.completed_at && (
                      <div>
                        <div className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-1">
                          {t.completedDate}
                        </div>
                        <div className="font-medium">
                          {new Date(result.order.completed_at).toLocaleDateString(
                            lang === "ne" ? "ne-NP" : "en-US",
                            { year: "numeric", month: "long", day: "numeric" }
                          )}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-1">
                        {t.priority}
                      </div>
                      <div className="font-medium">{getPriorityDisplay(result.order!.priority)}</div>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t-4 border-foreground my-8" />

                {/* Results Table or Status Message */}
                {result.order?.status === "COMPLETED" && result.order.results ? (
                  <div>
                    <h2 className="text-xl font-bold uppercase tracking-tight mb-6">{t.resultsTitle}</h2>

                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-foreground text-white">
                            <th className="border-2 border-foreground px-4 py-3 text-left text-xs font-bold uppercase tracking-widest">
                              {t.testName}
                            </th>
                            <th className="border-2 border-foreground px-4 py-3 text-left text-xs font-bold uppercase tracking-widest">
                              {t.result}
                            </th>
                            <th className="border-2 border-foreground px-4 py-3 text-left text-xs font-bold uppercase tracking-widest">
                              {t.unit}
                            </th>
                            <th className="border-2 border-foreground px-4 py-3 text-left text-xs font-bold uppercase tracking-widest">
                              {t.normalRange}
                            </th>
                            <th className="border-2 border-foreground px-4 py-3 text-left text-xs font-bold uppercase tracking-widest">
                              {t.flag}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.order.results.map((test, idx) => {
                            const flagDisplay = getFlagDisplay(test.flag);
                            const isAbnormal =
                              test.flag && !["NORMAL"].includes(test.flag);

                            return (
                              <tr
                                key={idx}
                                className={isAbnormal ? "bg-red-50" : idx % 2 === 0 ? "bg-gray-50" : "bg-white"}
                              >
                                <td className="border-2 border-foreground px-4 py-3 font-medium">
                                  {test.test_name}
                                  {test.category && (
                                    <span className="block text-xs text-foreground/60">{test.category}</span>
                                  )}
                                </td>
                                <td
                                  className={`border-2 border-foreground px-4 py-3 font-bold ${
                                    isAbnormal ? "text-primary-red" : ""
                                  }`}
                                >
                                  {test.result_value || "-"}
                                </td>
                                <td className="border-2 border-foreground px-4 py-3">{test.unit || "-"}</td>
                                <td className="border-2 border-foreground px-4 py-3 text-sm">
                                  {test.normal_range || "-"}
                                </td>
                                <td className="border-2 border-foreground px-4 py-3">
                                  {flagDisplay ? (
                                    <span
                                      className={`inline-block px-2 py-1 text-xs font-bold ${flagDisplay.color} ${flagDisplay.bgColor}`}
                                    >
                                      {flagDisplay.label}
                                    </span>
                                  ) : (
                                    "-"
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-4">
                      {result.order.results.map((test, idx) => {
                        const flagDisplay = getFlagDisplay(test.flag);
                        const isAbnormal = test.flag && !["NORMAL"].includes(test.flag);

                        return (
                          <div
                            key={idx}
                            className={`border-4 border-foreground p-4 ${isAbnormal ? "bg-red-50" : "bg-white"}`}
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <div className="font-bold">{test.test_name}</div>
                                {test.category && (
                                  <div className="text-xs text-foreground/60">{test.category}</div>
                                )}
                              </div>
                              {flagDisplay && (
                                <span
                                  className={`px-2 py-1 text-xs font-bold ${flagDisplay.color} ${flagDisplay.bgColor}`}
                                >
                                  {flagDisplay.label}
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-foreground/60">{t.result}: </span>
                                <span className={`font-bold ${isAbnormal ? "text-primary-red" : ""}`}>
                                  {test.result_value || "-"}
                                </span>
                              </div>
                              <div>
                                <span className="text-foreground/60">{t.unit}: </span>
                                <span>{test.unit || "-"}</span>
                              </div>
                              <div className="col-span-2">
                                <span className="text-foreground/60">{t.normalRange}: </span>
                                <span>{test.normal_range || "-"}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 mx-auto mb-6 bg-primary-yellow/20 rounded-full flex items-center justify-center">
                      <svg
                        className="w-10 h-10 text-primary-yellow"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-lg text-foreground/70">{t.notCompletedMessage}</p>
                  </div>
                )}

                {/* Footer for print */}
                <div className="footer hidden print:block">
                  <p>This is a computer-generated report and does not require a signature.</p>
                  <p>Printed on: {new Date().toLocaleString()}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                {result.order?.status === "COMPLETED" && result.order.results && (
                  <Button variant="primary" size="lg" className="flex-1" onClick={handlePrint}>
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                      />
                    </svg>
                    {t.print}
                  </Button>
                )}
                <Button variant="outline" size="lg" className="flex-1" onClick={handleNewSearch}>
                  {t.newSearch}
                </Button>
              </div>
            </div>
          )}

          {/* Back to home link */}
          <div className="mt-8 text-center">
            <Link href={`/${lang}`} className="text-primary-blue font-bold hover:underline uppercase tracking-wider">
              {t.homeLink}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
