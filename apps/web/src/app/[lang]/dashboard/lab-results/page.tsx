"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Clinic {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
}

interface Doctor {
  id: string;
  full_name: string;
  registration_number: string;
  degree: string | null;
}

interface LabTest {
  id: string;
  name: string;
  short_name: string | null;
  category: string | null;
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
  status: string;
  completed_at: string | null;
  created_at: string;
  clinic: Clinic;
  ordered_by: Doctor;
  results: LabResult[];
}

const translations = {
  en: {
    title: "My Lab Results",
    loading: "Loading...",
    loginRequired: "Please log in to view your lab results",
    login: "Login",
    noResults: "No lab results found",
    noResultsMessage: "Your lab results will appear here once they are available.",
    // Order details
    orderNumber: "Order #",
    clinic: "Clinic",
    orderedBy: "Ordered By",
    completedAt: "Completed",
    testCount: "Tests",
    // Results
    testName: "Test",
    result: "Result",
    normalRange: "Normal Range",
    flag: "Status",
    remarks: "Remarks",
    viewDetails: "View Details",
    downloadReport: "Download Report",
    // Flags
    normal: "Normal",
    low: "Low",
    high: "High",
    criticalLow: "Critical Low",
    criticalHigh: "Critical High",
    abnormal: "Abnormal",
    // Messages
    allNormal: "All results normal",
    hasAbnormal: "Some results need attention",
  },
  ne: {
    title: "मेरो प्रयोगशाला नतिजाहरू",
    loading: "लोड हुँदैछ...",
    loginRequired: "तपाईंको प्रयोगशाला नतिजा हेर्न कृपया लगइन गर्नुहोस्",
    login: "लगइन गर्नुहोस्",
    noResults: "कुनै प्रयोगशाला नतिजा फेला परेन",
    noResultsMessage: "तपाईंको प्रयोगशाला नतिजाहरू उपलब्ध भएपछि यहाँ देखिनेछन्।",
    // Order details
    orderNumber: "अर्डर #",
    clinic: "क्लिनिक",
    orderedBy: "अर्डर गर्ने",
    completedAt: "सम्पन्न मिति",
    testCount: "परीक्षणहरू",
    // Results
    testName: "परीक्षण",
    result: "नतिजा",
    normalRange: "सामान्य दायरा",
    flag: "स्थिति",
    remarks: "टिप्पणी",
    viewDetails: "विवरण हेर्नुहोस्",
    downloadReport: "रिपोर्ट डाउनलोड गर्नुहोस्",
    // Flags
    normal: "सामान्य",
    low: "कम",
    high: "उच्च",
    criticalLow: "अत्यन्त कम",
    criticalHigh: "अत्यन्त उच्च",
    abnormal: "असामान्य",
    // Messages
    allNormal: "सबै नतिजा सामान्य",
    hasAbnormal: "केही नतिजामा ध्यान दिनुपर्छ",
  },
};

export default function PatientLabResultsPage() {
  const { data: session, status } = useSession();
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en";
  const t = translations[lang as keyof typeof translations] || translations.en;

  const [loading, setLoading] = useState(true);
  const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // Fetch lab results
  const fetchLabResults = useCallback(async () => {
    try {
      const response = await fetch("/api/patient/lab-results");
      if (response.ok) {
        const data = await response.json();
        setLabOrders(data.labOrders || []);
      }
    } catch (error) {
      console.error("Error fetching lab results:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (status === "authenticated") {
      fetchLabResults();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, fetchLabResults]);

  // Get flag color
  const getFlagColor = (flag: string | null): string => {
    switch (flag) {
      case "NORMAL":
        return "bg-verified text-white";
      case "LOW":
        return "bg-primary-blue text-white";
      case "HIGH":
        return "bg-primary-yellow text-foreground";
      case "CRITICAL_LOW":
      case "CRITICAL_HIGH":
        return "bg-primary-red text-white";
      case "ABNORMAL":
        return "bg-orange-500 text-white";
      default:
        return "bg-gray-200 text-gray-600";
    }
  };

  // Get flag label
  const getFlagLabel = (flag: string | null): string => {
    switch (flag) {
      case "NORMAL":
        return t.normal;
      case "LOW":
        return t.low;
      case "HIGH":
        return t.high;
      case "CRITICAL_LOW":
        return t.criticalLow;
      case "CRITICAL_HIGH":
        return t.criticalHigh;
      case "ABNORMAL":
        return t.abnormal;
      default:
        return "-";
    }
  };

  // Check if order has abnormal results
  const hasAbnormalResults = (order: LabOrder): boolean => {
    return order.results.some(
      (r) => r.flag && r.flag !== "NORMAL"
    );
  };

  // Print report
  const handlePrintReport = (order: LabOrder) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const completedDate = order.completed_at
      ? new Date(order.completed_at).toLocaleDateString()
      : "-";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Lab Report - ${order.order_number}</title>
        <style>
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
          body {
            font-family: 'Outfit', Arial, sans-serif;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
            font-size: 14px;
          }
          .header {
            border-bottom: 3px solid #121212;
            padding-bottom: 15px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
          }
          .clinic-name { font-size: 24px; font-weight: bold; color: #1040C0; }
          .order-no { font-size: 18px; font-weight: bold; font-family: monospace; }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th, td {
            border: 2px solid #121212;
            padding: 10px;
            text-align: left;
          }
          th {
            background: #1040C0;
            color: white;
            text-transform: uppercase;
            font-size: 12px;
          }
          .abnormal { background: #FEF3CD; }
          .critical { background: #F8D7DA; }
          .flag {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
          }
          .flag-high, .flag-low { background: #F0C020; color: #121212; }
          .flag-critical { background: #D02020; color: white; }
          .flag-abnormal { background: #FF9800; color: white; }
          .flag-normal { background: #4CAF50; color: white; }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
          .no-print { display: none; }
          @media print { .no-print { display: none !important; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="clinic-name">${order.clinic.name}</div>
            <div>${order.clinic.address || ""}</div>
            <div>${order.clinic.phone || ""}</div>
          </div>
          <div style="text-align: right;">
            <div class="order-no">${order.order_number}</div>
            <div>Report Date: ${completedDate}</div>
          </div>
        </div>

        <div style="margin-bottom: 20px; padding: 10px; background: #f5f5f5; border: 2px solid #121212;">
          <strong>Ordered By:</strong> Dr. ${order.ordered_by.full_name}
          (${order.ordered_by.registration_number})
        </div>

        <table>
          <thead>
            <tr>
              <th>Test</th>
              <th>Result</th>
              <th>Unit</th>
              <th>Normal Range</th>
              <th>Flag</th>
            </tr>
          </thead>
          <tbody>
            ${order.results.map((r) => {
              const flagClass = r.flag === "CRITICAL_LOW" || r.flag === "CRITICAL_HIGH" ? "critical" :
                               r.flag && r.flag !== "NORMAL" ? "abnormal" : "";
              const flagStyle = r.flag === "NORMAL" ? "flag-normal" :
                               r.flag === "LOW" || r.flag === "HIGH" ? "flag-high" :
                               r.flag === "CRITICAL_LOW" || r.flag === "CRITICAL_HIGH" ? "flag-critical" :
                               r.flag === "ABNORMAL" ? "flag-abnormal" : "";
              return `
                <tr class="${flagClass}">
                  <td><strong>${r.lab_test.name}</strong>${r.lab_test.short_name ? ` (${r.lab_test.short_name})` : ""}</td>
                  <td><strong>${r.result_value || "-"}</strong></td>
                  <td>${r.unit || r.lab_test.unit || "-"}</td>
                  <td>${r.normal_range || r.lab_test.normal_range || "-"}</td>
                  <td>${r.flag ? `<span class="flag ${flagStyle}">${r.flag}</span>` : "-"}</td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>

        <div class="footer">
          Generated via Swasthya Healthcare Platform
        </div>

        <div class="no-print" style="text-align: center; margin-top: 20px;">
          <button onclick="window.print()" style="padding: 10px 30px; font-size: 16px; cursor: pointer;">
            Print Report
          </button>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Loading state
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
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
          <Link href={`/${lang}/login?callbackUrl=/${lang}/dashboard/lab-results`}>
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

        {/* No results */}
        {labOrders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <h2 className="text-xl font-bold mb-2">{t.noResults}</h2>
              <p>{t.noResultsMessage}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {labOrders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-4">
                  {/* Order Header */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-lg">{order.order_number}</span>
                        {hasAbnormalResults(order) ? (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-primary-yellow text-foreground">
                            {t.hasAbnormal}
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-verified text-white">
                            {t.allNormal}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {order.clinic.name} • {order.completed_at && new Date(order.completed_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                      >
                        {expandedOrder === order.id ? "Hide" : t.viewDetails}
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handlePrintReport(order)}
                      >
                        {t.downloadReport}
                      </Button>
                    </div>
                  </div>

                  {/* Quick summary */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {order.results.map((result) => (
                      <span
                        key={result.id}
                        className={`px-2 py-1 rounded text-xs font-medium ${getFlagColor(result.flag)}`}
                      >
                        {result.lab_test.short_name || result.lab_test.name}
                      </span>
                    ))}
                  </div>

                  {/* Expanded details */}
                  {expandedOrder === order.id && (
                    <div className="mt-4 pt-4 border-t-2">
                      <div className="text-sm text-gray-500 mb-4">
                        {t.orderedBy}: Dr. {order.ordered_by.full_name} ({order.ordered_by.degree || order.ordered_by.registration_number})
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b-2 border-foreground">
                              <th className="text-left py-2 px-2">{t.testName}</th>
                              <th className="text-left py-2 px-2">{t.result}</th>
                              <th className="text-left py-2 px-2">{t.normalRange}</th>
                              <th className="text-left py-2 px-2">{t.flag}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.results.map((result) => (
                              <tr
                                key={result.id}
                                className={`border-b ${
                                  result.flag === "CRITICAL_LOW" || result.flag === "CRITICAL_HIGH"
                                    ? "bg-red-50"
                                    : result.flag && result.flag !== "NORMAL"
                                    ? "bg-yellow-50"
                                    : ""
                                }`}
                              >
                                <td className="py-2 px-2">
                                  <div className="font-medium">{result.lab_test.name}</div>
                                  {result.lab_test.category && (
                                    <div className="text-xs text-gray-500">{result.lab_test.category}</div>
                                  )}
                                </td>
                                <td className="py-2 px-2 font-bold">
                                  {result.result_value || "-"}
                                  {result.unit && <span className="font-normal text-gray-500 ml-1">{result.unit}</span>}
                                </td>
                                <td className="py-2 px-2 text-gray-600">
                                  {result.normal_range || result.lab_test.normal_range || "-"}
                                </td>
                                <td className="py-2 px-2">
                                  {result.flag ? (
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getFlagColor(result.flag)}`}>
                                      {getFlagLabel(result.flag)}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {order.results.some((r) => r.remarks) && (
                        <div className="mt-4 p-3 bg-gray-50 rounded">
                          <div className="font-medium text-sm mb-2">{t.remarks}:</div>
                          {order.results
                            .filter((r) => r.remarks)
                            .map((r) => (
                              <div key={r.id} className="text-sm text-gray-600">
                                <strong>{r.lab_test.name}:</strong> {r.remarks}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
