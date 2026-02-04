"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDoctorName } from "@/lib/format-name";

interface Patient {
  id: string;
  full_name: string;
  patient_number: string;
  phone: string | null;
  gender: string | null;
  date_of_birth: string | null;
  blood_group: string | null;
}

interface Doctor {
  id: string;
  full_name: string;
  registration_number: string;
  degree: string | null;
}

interface ClinicalNote {
  id: string;
  chief_complaint: string | null;
  diagnoses: { icd10_code: string; description: string; is_primary: boolean }[] | null;
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
  entered_at: string | null;
  verified_at: string | null;
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
  clinical_note: ClinicalNote | null;
  results: LabResult[];
}

type LabResultFlag = "NORMAL" | "LOW" | "HIGH" | "CRITICAL_LOW" | "CRITICAL_HIGH" | "ABNORMAL";

const translations = {
  en: {
    title: "Lab Order",
    loading: "Loading...",
    loginRequired: "Please log in to access this page",
    login: "Login",
    noClinic: "No Verified Clinic",
    noClinicMessage: "You don't have a verified clinic yet.",
    notFound: "Lab order not found",
    back: "Back to Lab Dashboard",
    // Order info
    orderNumber: "Order #",
    patient: "Patient",
    patientNumber: "Patient #",
    age: "Age",
    gender: "Gender",
    bloodGroup: "Blood Group",
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
    completed: "Completed",
    cancelled: "Cancelled",
    sampleId: "Sample ID",
    clinicalNotes: "Clinical Notes",
    chiefComplaint: "Chief Complaint",
    diagnoses: "Diagnoses",
    // Results
    enterResults: "Enter Results",
    resultsEntry: "Results Entry",
    testName: "Test",
    result: "Result",
    unit: "Unit",
    normalRange: "Normal Range",
    flag: "Flag",
    remarks: "Remarks",
    verified: "Verified",
    save: "Save",
    saving: "Saving...",
    saveAll: "Save All Results",
    markComplete: "Mark Complete",
    completing: "Completing...",
    verify: "Verify",
    unverify: "Unverify",
    printReport: "Print Report",
    // Flags
    selectFlag: "Select flag",
    normal: "Normal",
    low: "Low",
    high: "High",
    criticalLow: "Critical Low",
    criticalHigh: "Critical High",
    abnormal: "Abnormal",
    // Messages
    saveSuccess: "Results saved successfully",
    completeSuccess: "Order marked as complete",
    error: "An error occurred",
    allResultsRequired: "All test results must be entered before completing",
    male: "Male",
    female: "Female",
    other: "Other",
    years: "years",
  },
  ne: {
    title: "प्रयोगशाला अर्डर",
    loading: "लोड हुँदैछ...",
    loginRequired: "यो पृष्ठ पहुँच गर्न कृपया लगइन गर्नुहोस्",
    login: "लगइन गर्नुहोस्",
    noClinic: "कुनै प्रमाणित क्लिनिक छैन",
    noClinicMessage: "तपाईंसँग अझै प्रमाणित क्लिनिक छैन।",
    notFound: "प्रयोगशाला अर्डर फेला परेन",
    back: "प्रयोगशाला ड्यासबोर्डमा फर्कनुहोस्",
    // Order info
    orderNumber: "अर्डर #",
    patient: "बिरामी",
    patientNumber: "बिरामी #",
    age: "उमेर",
    gender: "लिङ्ग",
    bloodGroup: "रक्त समूह",
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
    completed: "सम्पन्न",
    cancelled: "रद्द",
    sampleId: "नमूना ID",
    clinicalNotes: "क्लिनिकल नोटहरू",
    chiefComplaint: "मुख्य समस्या",
    diagnoses: "निदान",
    // Results
    enterResults: "नतिजा प्रविष्ट गर्नुहोस्",
    resultsEntry: "नतिजा प्रविष्टि",
    testName: "परीक्षण",
    result: "नतिजा",
    unit: "एकाइ",
    normalRange: "सामान्य दायरा",
    flag: "चिन्ह",
    remarks: "टिप्पणी",
    verified: "प्रमाणित",
    save: "बचत गर्नुहोस्",
    saving: "बचत गर्दै...",
    saveAll: "सबै नतिजा बचत गर्नुहोस्",
    markComplete: "सम्पन्न चिन्ह लगाउनुहोस्",
    completing: "सम्पन्न गर्दै...",
    verify: "प्रमाणित गर्नुहोस्",
    unverify: "प्रमाणीकरण हटाउनुहोस्",
    printReport: "रिपोर्ट छाप्नुहोस्",
    // Flags
    selectFlag: "चिन्ह छान्नुहोस्",
    normal: "सामान्य",
    low: "कम",
    high: "उच्च",
    criticalLow: "अत्यन्त कम",
    criticalHigh: "अत्यन्त उच्च",
    abnormal: "असामान्य",
    // Messages
    saveSuccess: "नतिजा सफलतापूर्वक बचत भयो",
    completeSuccess: "अर्डर सम्पन्न भयो",
    error: "त्रुटि भयो",
    allResultsRequired: "सम्पन्न गर्नु अघि सबै परीक्षण नतिजा प्रविष्ट गर्नुपर्छ",
    male: "पुरुष",
    female: "महिला",
    other: "अन्य",
    years: "वर्ष",
  },
};

export default function LabOrderDetailPage() {
  const { data: session, status } = useSession();
  const params = useParams<{ lang: string; id: string }>();
  const router = useRouter();
  const lang = params?.lang || "en";
  const orderId = params?.id;
  const t = translations[lang as keyof typeof translations] || translations.en;

  const [loading, setLoading] = useState(true);
  const [noClinic, setNoClinic] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [labOrder, setLabOrder] = useState<LabOrder | null>(null);
  const [resultInputs, setResultInputs] = useState<Record<string, {
    result_value: string;
    unit: string;
    normal_range: string;
    flag: string;
    remarks: string;
  }>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [completing, setCompleting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch lab order
  const fetchLabOrder = useCallback(async () => {
    if (!orderId) return;

    try {
      const response = await fetch(`/api/clinic/lab-orders/${orderId}`);

      if (response.status === 404) {
        const data = await response.json();
        if (data.code === "NO_CLINIC") {
          setNoClinic(true);
        } else {
          setNotFound(true);
        }
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setLabOrder(data.labOrder);

        // Initialize result inputs from existing data
        const inputs: Record<string, {
          result_value: string;
          unit: string;
          normal_range: string;
          flag: string;
          remarks: string;
        }> = {};
        data.labOrder.results.forEach((result: LabResult) => {
          inputs[result.id] = {
            result_value: result.result_value || "",
            unit: result.unit || result.lab_test.unit || "",
            normal_range: result.normal_range || result.lab_test.normal_range || "",
            flag: result.flag || "",
            remarks: result.remarks || "",
          };
        });
        setResultInputs(inputs);
      }
    } catch (error) {
      console.error("Error fetching lab order:", error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  // Save individual result
  const saveResult = async (resultId: string) => {
    setSaving((prev) => ({ ...prev, [resultId]: true }));
    setMessage(null);

    try {
      const input = resultInputs[resultId];
      const response = await fetch(`/api/clinic/lab-results/${resultId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          result_value: input.result_value || null,
          unit: input.unit || null,
          normal_range: input.normal_range || null,
          flag: input.flag || null,
          remarks: input.remarks || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setLabOrder((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            results: prev.results.map((r) =>
              r.id === resultId ? { ...r, ...data.labResult } : r
            ),
          };
        });
        setMessage({ type: "success", text: t.saveSuccess });
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      console.error("Error saving result:", error);
      setMessage({ type: "error", text: t.error });
    } finally {
      setSaving((prev) => ({ ...prev, [resultId]: false }));
    }
  };

  // Toggle verification
  const toggleVerification = async (resultId: string, verified: boolean) => {
    try {
      const response = await fetch(`/api/clinic/lab-results/${resultId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified }),
      });

      if (response.ok) {
        const data = await response.json();
        setLabOrder((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            results: prev.results.map((r) =>
              r.id === resultId ? { ...r, verified: data.labResult.verified } : r
            ),
          };
        });
      }
    } catch (error) {
      console.error("Error toggling verification:", error);
    }
  };

  // Mark order complete
  const handleMarkComplete = async () => {
    if (!labOrder) return;

    // Check all results are entered
    const allEntered = labOrder.results.every((r) => resultInputs[r.id]?.result_value);
    if (!allEntered) {
      setMessage({ type: "error", text: t.allResultsRequired });
      return;
    }

    setCompleting(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/clinic/lab-orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });

      if (response.ok) {
        const data = await response.json();
        setLabOrder((prev) => (prev ? { ...prev, ...data.labOrder } : null));
        setMessage({ type: "success", text: t.completeSuccess });
      } else {
        throw new Error("Failed to complete");
      }
    } catch (error) {
      console.error("Error completing order:", error);
      setMessage({ type: "error", text: t.error });
    } finally {
      setCompleting(false);
    }
  };

  // Print report
  const handlePrintReport = () => {
    if (!labOrder) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const orderDate = new Date(labOrder.created_at).toLocaleDateString();
    const completedDate = labOrder.completed_at
      ? new Date(labOrder.completed_at).toLocaleDateString()
      : "-";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Lab Report - ${labOrder.order_number}</title>
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
          .clinic-info { text-align: left; }
          .clinic-name { font-size: 24px; font-weight: bold; color: #1040C0; }
          .report-info { text-align: right; }
          .order-no { font-size: 18px; font-weight: bold; font-family: monospace; }
          .patient-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 20px;
            padding: 15px;
            background: #f5f5f5;
            border: 2px solid #121212;
          }
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
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #121212;
            display: grid;
            grid-template-columns: 1fr 1fr;
          }
          .signature {
            text-align: right;
            padding-top: 40px;
          }
          .no-print { display: none; }
          @media print {
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="clinic-info">
            <div class="clinic-name">Swasthya</div>
            <div>Laboratory Report</div>
          </div>
          <div class="report-info">
            <div class="order-no">${labOrder.order_number}</div>
            <div>Order Date: ${orderDate}</div>
            <div>Report Date: ${completedDate}</div>
          </div>
        </div>

        <div class="patient-info">
          <div>
            <strong>Patient:</strong> ${labOrder.patient.full_name}
          </div>
          <div>
            <strong>Patient #:</strong> ${labOrder.patient.patient_number}
          </div>
          <div>
            <strong>Age/Gender:</strong> ${getAge(labOrder.patient.date_of_birth)} / ${labOrder.patient.gender || "-"}
          </div>
          <div>
            <strong>Sample ID:</strong> ${labOrder.sample_id || "-"}
          </div>
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
            ${labOrder.results.map((r) => {
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
                ${r.remarks ? `<tr><td colspan="5" style="background: #E3F2FD; font-size: 12px;"><em>Remarks: ${r.remarks}</em></td></tr>` : ""}
              `;
            }).join("")}
          </tbody>
        </table>

        <div class="footer">
          <div>
            <strong>Ordered by:</strong> ${formatDoctorName(labOrder.ordered_by.full_name)}<br>
            Reg. No: ${labOrder.ordered_by.registration_number}
          </div>
          <div class="signature">
            <div>_______________________</div>
            <div>Lab Technician Signature</div>
          </div>
        </div>

        <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #666;">
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
    return `${age} ${t.years}`;
  };

  // Get flag color
  const getFlagColor = (flag: string): string => {
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
        return "";
    }
  };

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
        return t.completed;
      case "CANCELLED":
        return t.cancelled;
      default:
        return orderStatus;
    }
  };

  // Initial load
  useEffect(() => {
    if (status === "authenticated") {
      fetchLabOrder();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, fetchLabOrder]);

  // Loading state
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
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
          <Link href={`/${lang}/login?callbackUrl=/${lang}/clinic/dashboard/lab/${orderId}`}>
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

  // Not found
  if (notFound || !labOrder) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-2xl mx-auto text-center py-16">
          <h1 className="text-2xl font-bold mb-2">{t.notFound}</h1>
          <Link href={`/${lang}/clinic/dashboard/lab`}>
            <Button variant="primary" className="mt-4">
              {t.back}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isEditable = labOrder.status !== "COMPLETED" && labOrder.status !== "CANCELLED";

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{t.title}</h1>
              <span className="font-mono font-bold text-lg text-primary-blue">{labOrder.order_number}</span>
              <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(labOrder.status)}`}>
                {getStatusLabel(labOrder.status)}
              </span>
              {labOrder.priority !== "ROUTINE" && (
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  labOrder.priority === "STAT" ? "bg-primary-red text-white" : "bg-primary-yellow text-foreground"
                }`}>
                  {labOrder.priority}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/${lang}/clinic/dashboard/lab`}>
              <Button variant="outline">{t.back}</Button>
            </Link>
            {labOrder.status === "COMPLETED" && (
              <Button variant="primary" onClick={handlePrintReport}>
                {t.printReport}
              </Button>
            )}
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-4 p-3 rounded border-2 ${
              message.type === "success"
                ? "bg-green-50 border-verified text-verified"
                : "bg-red-50 border-primary-red text-primary-red"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Patient & Order Info */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">{t.patient}:</span>
                <div className="font-bold">{labOrder.patient.full_name}</div>
                <div className="text-gray-500">#{labOrder.patient.patient_number}</div>
              </div>
              <div>
                <span className="text-gray-500">{t.age} / {t.gender}:</span>
                <div className="font-medium">
                  {getAge(labOrder.patient.date_of_birth)} / {
                    labOrder.patient.gender === "Male" ? t.male :
                    labOrder.patient.gender === "Female" ? t.female :
                    labOrder.patient.gender || "-"
                  }
                </div>
                {labOrder.patient.blood_group && (
                  <div className="text-primary-red font-bold">{labOrder.patient.blood_group}</div>
                )}
              </div>
              <div>
                <span className="text-gray-500">{t.orderedBy}:</span>
                <div className="font-medium">{formatDoctorName(labOrder.ordered_by.full_name)}</div>
                <div className="text-gray-500">{labOrder.ordered_by.registration_number}</div>
              </div>
              <div>
                <span className="text-gray-500">{t.orderedAt}:</span>
                <div>{new Date(labOrder.created_at).toLocaleDateString()}</div>
                {labOrder.sample_id && (
                  <div className="text-primary-blue font-mono">{t.sampleId}: {labOrder.sample_id}</div>
                )}
              </div>
            </div>
            {(labOrder.clinical_notes || labOrder.clinical_note?.chief_complaint) && (
              <div className="mt-4 pt-4 border-t">
                {labOrder.clinical_note?.chief_complaint && (
                  <div className="mb-2">
                    <span className="text-gray-500 text-sm">{t.chiefComplaint}:</span>
                    <div className="font-medium">{labOrder.clinical_note.chief_complaint}</div>
                  </div>
                )}
                {labOrder.clinical_notes && (
                  <div>
                    <span className="text-gray-500 text-sm">{t.clinicalNotes}:</span>
                    <div className="text-gray-700">{labOrder.clinical_notes}</div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Entry */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold">{t.resultsEntry}</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {labOrder.results.map((result) => (
                <div
                  key={result.id}
                  className={`p-4 border-2 rounded ${
                    result.flag === "CRITICAL_LOW" || result.flag === "CRITICAL_HIGH"
                      ? "border-primary-red bg-red-50"
                      : result.flag && result.flag !== "NORMAL"
                      ? "border-primary-yellow bg-yellow-50"
                      : "border-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="font-bold text-lg">{result.lab_test.name}</div>
                      <div className="text-sm text-gray-500">
                        {result.lab_test.short_name && `(${result.lab_test.short_name})`}
                        {result.lab_test.category && ` • ${result.lab_test.category}`}
                        {result.lab_test.sample_type && ` • ${result.lab_test.sample_type}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {result.verified && (
                        <span className="px-2 py-1 bg-verified text-white rounded text-xs font-medium">
                          {t.verified}
                        </span>
                      )}
                      {result.flag && (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getFlagColor(result.flag)}`}>
                          {result.flag}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Result Value */}
                    <div>
                      <label className="block text-sm font-medium mb-1">{t.result} *</label>
                      <input
                        type="text"
                        value={resultInputs[result.id]?.result_value || ""}
                        onChange={(e) =>
                          setResultInputs((prev) => ({
                            ...prev,
                            [result.id]: {
                              ...prev[result.id],
                              result_value: e.target.value,
                            },
                          }))
                        }
                        disabled={!isEditable}
                        className="w-full p-2 border-2 border-foreground rounded focus:border-primary-blue outline-none disabled:bg-gray-100 font-bold"
                        placeholder="Enter value"
                      />
                    </div>

                    {/* Unit */}
                    <div>
                      <label className="block text-sm font-medium mb-1">{t.unit}</label>
                      <input
                        type="text"
                        value={resultInputs[result.id]?.unit || ""}
                        onChange={(e) =>
                          setResultInputs((prev) => ({
                            ...prev,
                            [result.id]: {
                              ...prev[result.id],
                              unit: e.target.value,
                            },
                          }))
                        }
                        disabled={!isEditable}
                        className="w-full p-2 border-2 border-foreground rounded focus:border-primary-blue outline-none disabled:bg-gray-100"
                        placeholder={result.lab_test.unit || "Unit"}
                      />
                    </div>

                    {/* Normal Range */}
                    <div>
                      <label className="block text-sm font-medium mb-1">{t.normalRange}</label>
                      <input
                        type="text"
                        value={resultInputs[result.id]?.normal_range || ""}
                        onChange={(e) =>
                          setResultInputs((prev) => ({
                            ...prev,
                            [result.id]: {
                              ...prev[result.id],
                              normal_range: e.target.value,
                            },
                          }))
                        }
                        disabled={!isEditable}
                        className="w-full p-2 border-2 border-foreground rounded focus:border-primary-blue outline-none disabled:bg-gray-100"
                        placeholder={result.lab_test.normal_range || "Normal range"}
                      />
                    </div>

                    {/* Flag */}
                    <div>
                      <label className="block text-sm font-medium mb-1">{t.flag}</label>
                      <select
                        value={resultInputs[result.id]?.flag || ""}
                        onChange={(e) =>
                          setResultInputs((prev) => ({
                            ...prev,
                            [result.id]: {
                              ...prev[result.id],
                              flag: e.target.value,
                            },
                          }))
                        }
                        disabled={!isEditable}
                        className="w-full p-2 border-2 border-foreground rounded focus:border-primary-blue outline-none disabled:bg-gray-100"
                      >
                        <option value="">{t.selectFlag}</option>
                        <option value="NORMAL">{t.normal}</option>
                        <option value="LOW">{t.low}</option>
                        <option value="HIGH">{t.high}</option>
                        <option value="CRITICAL_LOW">{t.criticalLow}</option>
                        <option value="CRITICAL_HIGH">{t.criticalHigh}</option>
                        <option value="ABNORMAL">{t.abnormal}</option>
                      </select>
                    </div>
                  </div>

                  {/* Remarks */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-1">{t.remarks}</label>
                    <input
                      type="text"
                      value={resultInputs[result.id]?.remarks || ""}
                      onChange={(e) =>
                        setResultInputs((prev) => ({
                          ...prev,
                          [result.id]: {
                            ...prev[result.id],
                            remarks: e.target.value,
                          },
                        }))
                      }
                      disabled={!isEditable}
                      className="w-full p-2 border-2 border-foreground rounded focus:border-primary-blue outline-none disabled:bg-gray-100"
                      placeholder="Additional remarks..."
                    />
                  </div>

                  {/* Actions */}
                  {isEditable && (
                    <div className="mt-4 flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => saveResult(result.id)}
                        disabled={saving[result.id]}
                      >
                        {saving[result.id] ? t.saving : t.save}
                      </Button>
                      {resultInputs[result.id]?.result_value && (
                        <Button
                          variant={result.verified ? "outline" : "secondary"}
                          size="sm"
                          onClick={() => toggleVerification(result.id, !result.verified)}
                        >
                          {result.verified ? t.unverify : t.verify}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Mark Complete */}
            {isEditable && labOrder.results.every((r) => resultInputs[r.id]?.result_value) && (
              <div className="mt-6 pt-6 border-t-2">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={handleMarkComplete}
                  disabled={completing}
                >
                  {completing ? t.completing : t.markComplete}
                </Button>
              </div>
            )}

            {/* Print button for completed */}
            {labOrder.status === "COMPLETED" && (
              <div className="mt-6 pt-6 border-t-2">
                <Button variant="primary" className="w-full" onClick={handlePrintReport}>
                  {t.printReport}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
