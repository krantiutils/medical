"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Patient {
  id: string;
  patient_number: string;
  full_name: string;
  phone: string | null;
  gender: string | null;
  date_of_birth: string | null;
}

interface LabTest {
  id: string;
  name: string;
  short_name: string | null;
  category: string | null;
  sample_type: string | null;
  price: number;
}

interface ReceiptData {
  clinic_name: string;
  clinic_address: string;
  clinic_phone: string;
  order_number: string;
  patient_name: string;
  patient_phone: string;
  patient_number: string;
  tests: { name: string; short_name: string | null; price: number }[];
  total: number;
  payment_status: string;
  payment_mode: string;
  created_at: string;
  invoice_number: string;
}

const translations = {
  en: {
    title: "Lab Walk-in",
    subtitle: "Quick lab order for walk-in patients",
    loading: "Loading...",
    loginRequired: "Please log in to access this page",
    login: "Login",
    noClinic: "No Verified Clinic",
    noClinicMessage: "You don't have a verified clinic yet.",
    // Patient section
    patientSection: "Patient Information",
    searchPatient: "Search existing patient...",
    orRegisterNew: "Or register new patient",
    patientName: "Full Name",
    patientPhone: "Phone Number",
    patientGender: "Gender",
    patientAge: "Age (years)",
    male: "Male",
    female: "Female",
    other: "Other",
    selectGender: "Select gender",
    clearSelection: "Clear selection",
    selectedPatient: "Selected Patient",
    // Test section
    testSection: "Select Lab Tests",
    searchTests: "Search tests...",
    allCategories: "All Categories",
    noTestsFound: "No tests found",
    // Order section
    orderSection: "Order Summary",
    selectedTests: "Selected Tests",
    noTestsSelected: "No tests selected",
    total: "Total",
    priority: "Priority",
    routine: "Routine",
    urgent: "Urgent",
    stat: "STAT",
    paymentMode: "Payment Mode",
    cash: "Cash",
    card: "Card",
    upi: "UPI",
    paymentStatus: "Payment Status",
    pending: "Pending",
    paid: "Paid",
    notes: "Notes (optional)",
    // Actions
    createOrder: "Create Order & Print Receipt",
    creating: "Creating...",
    backToLab: "Back to Lab",
    // Receipt
    receiptTitle: "Lab Order Receipt",
    orderNumber: "Order #",
    patient: "Patient",
    date: "Date",
    printReceipt: "Print Receipt",
    newOrder: "New Order",
    invoiceNumber: "Invoice #",
    // Errors
    errorPatientRequired: "Patient information is required",
    errorTestsRequired: "Please select at least one test",
    errorCreating: "Failed to create order. Please try again.",
    // Turnaround
    turnaround: "Results usually available within 24-48 hours",
  },
  ne: {
    title: "ल्याब वाक-इन",
    subtitle: "वाक-इन बिरामीहरूको लागि द्रुत ल्याब अर्डर",
    loading: "लोड हुँदैछ...",
    loginRequired: "यो पृष्ठ पहुँच गर्न कृपया लगइन गर्नुहोस्",
    login: "लगइन गर्नुहोस्",
    noClinic: "कुनै प्रमाणित क्लिनिक छैन",
    noClinicMessage: "तपाईंसँग अझै प्रमाणित क्लिनिक छैन।",
    // Patient section
    patientSection: "बिरामीको जानकारी",
    searchPatient: "अवस्थित बिरामी खोज्नुहोस्...",
    orRegisterNew: "वा नयाँ बिरामी दर्ता गर्नुहोस्",
    patientName: "पूरा नाम",
    patientPhone: "फोन नम्बर",
    patientGender: "लिङ्ग",
    patientAge: "उमेर (वर्ष)",
    male: "पुरुष",
    female: "महिला",
    other: "अन्य",
    selectGender: "लिङ्ग छान्नुहोस्",
    clearSelection: "चयन हटाउनुहोस्",
    selectedPatient: "चयन गरिएको बिरामी",
    // Test section
    testSection: "ल्याब टेस्टहरू छान्नुहोस्",
    searchTests: "टेस्टहरू खोज्नुहोस्...",
    allCategories: "सबै श्रेणीहरू",
    noTestsFound: "कुनै टेस्ट फेला परेन",
    // Order section
    orderSection: "अर्डर सारांश",
    selectedTests: "चयन गरिएका टेस्टहरू",
    noTestsSelected: "कुनै टेस्ट चयन गरिएको छैन",
    total: "जम्मा",
    priority: "प्राथमिकता",
    routine: "सामान्य",
    urgent: "अर्जेन्ट",
    stat: "तुरुन्त",
    paymentMode: "भुक्तानी विधि",
    cash: "नगद",
    card: "कार्ड",
    upi: "UPI",
    paymentStatus: "भुक्तानी स्थिति",
    pending: "बाँकी",
    paid: "भुक्तान भयो",
    notes: "नोटहरू (वैकल्पिक)",
    // Actions
    createOrder: "अर्डर बनाउनुहोस् र रसिद छाप्नुहोस्",
    creating: "बनाउँदै...",
    backToLab: "ल्याबमा फर्कनुहोस्",
    // Receipt
    receiptTitle: "ल्याब अर्डर रसिद",
    orderNumber: "अर्डर #",
    patient: "बिरामी",
    date: "मिति",
    printReceipt: "रसिद छाप्नुहोस्",
    newOrder: "नयाँ अर्डर",
    invoiceNumber: "बीजक #",
    // Errors
    errorPatientRequired: "बिरामीको जानकारी आवश्यक छ",
    errorTestsRequired: "कृपया कम्तीमा एउटा टेस्ट चयन गर्नुहोस्",
    errorCreating: "अर्डर बनाउन असफल भयो। कृपया फेरि प्रयास गर्नुहोस्।",
    // Turnaround
    turnaround: "नतिजाहरू सामान्यतया २४-४८ घण्टामा उपलब्ध हुन्छन्",
  },
};

export default function LabWalkInPage() {
  const { data: session, status } = useSession();
  const params = useParams<{ lang: string }>();
  const router = useRouter();
  const lang = params?.lang || "en";
  const t = translations[lang as keyof typeof translations] || translations.en;
  const receiptRef = useRef<HTMLDivElement>(null);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [noClinic, setNoClinic] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Patient states
  const [patientSearch, setPatientSearch] = useState("");
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [newPatient, setNewPatient] = useState({
    full_name: "",
    phone: "",
    gender: "",
    age: "",
  });

  // Test states
  const [tests, setTests] = useState<LabTest[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [testSearch, setTestSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());

  // Order states
  const [priority, setPriority] = useState<"ROUTINE" | "URGENT" | "STAT">("ROUTINE");
  const [paymentMode, setPaymentMode] = useState<"CASH" | "CARD" | "UPI">("CASH");
  const [paymentStatus, setPaymentStatus] = useState<"PENDING" | "PAID">("PENDING");
  const [notes, setNotes] = useState("");

  // Receipt state
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  // Fetch lab tests
  const fetchLabTests = useCallback(async () => {
    try {
      const response = await fetch("/api/clinic/lab-tests");

      if (response.status === 404) {
        const data = await response.json();
        if (data.code === "NO_CLINIC") {
          setNoClinic(true);
          return;
        }
      }

      if (response.ok) {
        const data = await response.json();
        setTests(data.tests || []);
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error("Error fetching lab tests:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Search patients
  const searchPatients = useCallback(async (query: string) => {
    if (query.length < 2) {
      setPatientResults([]);
      return;
    }

    try {
      const response = await fetch(`/api/clinic/patients?q=${encodeURIComponent(query)}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setPatientResults(data.patients || []);
      }
    } catch (err) {
      console.error("Error searching patients:", err);
    }
  }, []);

  // Debounced patient search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (patientSearch) {
        searchPatients(patientSearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [patientSearch, searchPatients]);

  // Initial load
  useEffect(() => {
    if (status === "authenticated") {
      fetchLabTests();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, fetchLabTests]);

  // Filter tests by search and category
  const filteredTests = tests.filter((test) => {
    const matchesSearch =
      !testSearch ||
      test.name.toLowerCase().includes(testSearch.toLowerCase()) ||
      (test.short_name && test.short_name.toLowerCase().includes(testSearch.toLowerCase()));
    const matchesCategory = !selectedCategory || test.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate total
  const selectedTestsInfo = tests.filter((t) => selectedTests.has(t.id));
  const total = selectedTestsInfo.reduce((sum, t) => sum + (Number(t.price) || 0), 0);

  // Toggle test selection
  const toggleTest = (testId: string) => {
    setSelectedTests((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(testId)) {
        newSet.delete(testId);
      } else {
        newSet.add(testId);
      }
      return newSet;
    });
  };

  // Handle patient selection
  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setPatientSearch("");
    setPatientResults([]);
    setNewPatient({ full_name: "", phone: "", gender: "", age: "" });
  };

  // Clear patient selection
  const clearPatientSelection = () => {
    setSelectedPatient(null);
    setPatientSearch("");
    setPatientResults([]);
  };

  // Create order
  const handleCreateOrder = async () => {
    setError(null);

    // Validate
    if (!selectedPatient && !newPatient.full_name.trim()) {
      setError(t.errorPatientRequired);
      return;
    }

    if (!selectedPatient && !newPatient.phone.trim()) {
      setError(t.errorPatientRequired);
      return;
    }

    if (selectedTests.size === 0) {
      setError(t.errorTestsRequired);
      return;
    }

    setSubmitting(true);

    try {
      // Prepare patient data
      let patientPayload: {
        patient_id?: string;
        patient?: {
          full_name: string;
          phone: string;
          gender?: string;
          date_of_birth?: string;
        };
      };

      if (selectedPatient) {
        patientPayload = { patient_id: selectedPatient.id };
      } else {
        // Convert age to date of birth
        let dateOfBirth: string | undefined;
        if (newPatient.age) {
          const age = parseInt(newPatient.age);
          if (!isNaN(age) && age > 0) {
            const birthYear = new Date().getFullYear() - age;
            dateOfBirth = `${birthYear}-01-01`;
          }
        }

        patientPayload = {
          patient: {
            full_name: newPatient.full_name.trim(),
            phone: newPatient.phone.trim(),
            gender: newPatient.gender || undefined,
            date_of_birth: dateOfBirth,
          },
        };
      }

      const response = await fetch("/api/clinic/lab-orders/walk-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...patientPayload,
          test_ids: Array.from(selectedTests),
          priority,
          notes: notes.trim() || undefined,
          payment_mode: paymentMode,
          payment_status: paymentStatus,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create order");
      }

      const data = await response.json();
      setReceipt(data.receipt);
    } catch (err) {
      console.error("Error creating order:", err);
      setError(err instanceof Error ? err.message : t.errorCreating);
    } finally {
      setSubmitting(false);
    }
  };

  // Print receipt
  const handlePrint = () => {
    if (receiptRef.current) {
      const printContents = receiptRef.current.innerHTML;
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Lab Receipt - ${receipt?.order_number}</title>
              <style>
                body {
                  font-family: 'Courier New', monospace;
                  padding: 20px;
                  max-width: 300px;
                  margin: 0 auto;
                }
                .receipt-header { text-align: center; margin-bottom: 20px; }
                .receipt-header h1 { font-size: 18px; margin: 0; }
                .receipt-header p { margin: 4px 0; font-size: 12px; }
                .divider { border-top: 1px dashed #000; margin: 10px 0; }
                .info-row { display: flex; justify-content: space-between; font-size: 12px; margin: 4px 0; }
                .test-item { display: flex; justify-content: space-between; font-size: 12px; margin: 4px 0; }
                .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; margin-top: 10px; }
                .footer { text-align: center; margin-top: 20px; font-size: 10px; }
                @media print {
                  body { padding: 0; }
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
    }
  };

  // Start new order
  const handleNewOrder = () => {
    setReceipt(null);
    setSelectedPatient(null);
    setNewPatient({ full_name: "", phone: "", gender: "", age: "" });
    setSelectedTests(new Set());
    setPriority("ROUTINE");
    setPaymentMode("CASH");
    setPaymentStatus("PENDING");
    setNotes("");
    setError(null);
  };

  // Loading state
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="h-96 bg-gray-200 rounded"></div>
              <div className="h-96 bg-gray-200 rounded"></div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
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
          <Link href={`/${lang}/login?callbackUrl=/${lang}/clinic/dashboard/lab/walk-in`}>
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

  // Receipt view
  if (receipt) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-md mx-auto">
          <Card decorator="blue" decoratorPosition="top-left">
            <CardHeader>
              <h1 className="text-xl font-bold">{t.receiptTitle}</h1>
            </CardHeader>
            <CardContent>
              <div ref={receiptRef}>
                <div className="receipt-header text-center mb-6">
                  <h1 className="text-lg font-bold">{receipt.clinic_name}</h1>
                  {receipt.clinic_address && (
                    <p className="text-sm text-gray-600">{receipt.clinic_address}</p>
                  )}
                  {receipt.clinic_phone && (
                    <p className="text-sm text-gray-600">Tel: {receipt.clinic_phone}</p>
                  )}
                </div>

                <div className="divider border-t-2 border-dashed border-gray-400 my-4"></div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t.orderNumber}:</span>
                    <span className="font-bold">{receipt.order_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t.invoiceNumber}:</span>
                    <span className="font-bold">{receipt.invoice_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t.date}:</span>
                    <span>{new Date(receipt.created_at).toLocaleString()}</span>
                  </div>
                </div>

                <div className="divider border-t-2 border-dashed border-gray-400 my-4"></div>

                <div className="space-y-1 text-sm">
                  <div className="font-bold">{t.patient}:</div>
                  <div>{receipt.patient_name}</div>
                  <div className="text-gray-600">#{receipt.patient_number}</div>
                  {receipt.patient_phone && (
                    <div className="text-gray-600">Tel: {receipt.patient_phone}</div>
                  )}
                </div>

                <div className="divider border-t-2 border-dashed border-gray-400 my-4"></div>

                <div className="space-y-2">
                  <div className="font-bold text-sm">{t.selectedTests}:</div>
                  {receipt.tests.map((test, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{test.short_name || test.name}</span>
                      <span>Rs. {test.price.toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div className="divider border-t-2 border-dashed border-gray-400 my-4"></div>

                <div className="flex justify-between font-bold text-lg">
                  <span>{t.total}:</span>
                  <span>Rs. {receipt.total.toLocaleString()}</span>
                </div>

                <div className="mt-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t.paymentMode}:</span>
                    <span>{receipt.payment_mode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t.paymentStatus}:</span>
                    <span className={receipt.payment_status === "PAID" ? "text-green-600" : "text-yellow-600"}>
                      {receipt.payment_status === "PAID" ? t.paid : t.pending}
                    </span>
                  </div>
                </div>

                <div className="divider border-t-2 border-dashed border-gray-400 my-4"></div>

                <div className="footer text-center text-xs text-gray-500">
                  <p>{t.turnaround}</p>
                  <p className="mt-2">Thank you for choosing us!</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex gap-4">
              <Button variant="primary" onClick={handlePrint} className="flex-1">
                {t.printReceipt}
              </Button>
              <Button variant="outline" onClick={handleNewOrder} className="flex-1">
                {t.newOrder}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  // Main form view
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{t.title}</h1>
            <p className="text-gray-600">{t.subtitle}</p>
          </div>
          <Link href={`/${lang}/clinic/dashboard/lab`}>
            <Button variant="outline">{t.backToLab}</Button>
          </Link>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border-2 border-red-500 text-red-700">
            {error}
          </div>
        )}

        {/* Main grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Patient Section */}
          <Card decorator="blue" decoratorPosition="top-left">
            <CardHeader>
              <h2 className="text-lg font-bold">{t.patientSection}</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedPatient ? (
                <div className="p-4 bg-blue-50 border-2 border-primary-blue">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold">{selectedPatient.full_name}</div>
                      <div className="text-sm text-gray-600">
                        #{selectedPatient.patient_number}
                      </div>
                      {selectedPatient.phone && (
                        <div className="text-sm">{selectedPatient.phone}</div>
                      )}
                      <div className="text-sm text-gray-500">
                        {selectedPatient.gender || "-"} {selectedPatient.date_of_birth ? `/ ${new Date().getFullYear() - new Date(selectedPatient.date_of_birth).getFullYear()}y` : ""}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={clearPatientSelection}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Search existing patient */}
                  <div className="relative">
                    <input
                      type="text"
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                      placeholder={t.searchPatient}
                      className="w-full px-4 py-2 border-2 border-foreground focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    />
                    {patientResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border-2 border-foreground shadow-lg max-h-60 overflow-y-auto">
                        {patientResults.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleSelectPatient(p)}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 border-b border-gray-200 last:border-b-0"
                          >
                            <div className="font-medium">{p.full_name}</div>
                            <div className="text-sm text-gray-600">
                              #{p.patient_number} {p.phone && `| ${p.phone}`}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="text-center text-gray-500 text-sm">{t.orRegisterNew}</div>

                  {/* New patient form */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">{t.patientName} *</label>
                      <input
                        type="text"
                        value={newPatient.full_name}
                        onChange={(e) => setNewPatient({ ...newPatient, full_name: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-foreground focus:outline-none focus:ring-2 focus:ring-primary-blue"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">{t.patientPhone} *</label>
                      <input
                        type="tel"
                        value={newPatient.phone}
                        onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                        placeholder="98XXXXXXXX"
                        className="w-full px-4 py-2 border-2 border-foreground focus:outline-none focus:ring-2 focus:ring-primary-blue"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">{t.patientGender}</label>
                        <select
                          value={newPatient.gender}
                          onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                          className="w-full px-4 py-2 border-2 border-foreground focus:outline-none focus:ring-2 focus:ring-primary-blue"
                        >
                          <option value="">{t.selectGender}</option>
                          <option value="Male">{t.male}</option>
                          <option value="Female">{t.female}</option>
                          <option value="Other">{t.other}</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">{t.patientAge}</label>
                        <input
                          type="number"
                          value={newPatient.age}
                          onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                          min="0"
                          max="150"
                          className="w-full px-4 py-2 border-2 border-foreground focus:outline-none focus:ring-2 focus:ring-primary-blue"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Test Selection Section */}
          <Card decorator="yellow" decoratorPosition="top-left">
            <CardHeader>
              <h2 className="text-lg font-bold">{t.testSection}</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search and filter */}
              <input
                type="text"
                value={testSearch}
                onChange={(e) => setTestSearch(e.target.value)}
                placeholder={t.searchTests}
                className="w-full px-4 py-2 border-2 border-foreground focus:outline-none focus:ring-2 focus:ring-primary-yellow"
              />

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border-2 border-foreground focus:outline-none focus:ring-2 focus:ring-primary-yellow"
              >
                <option value="">{t.allCategories}</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Test list */}
              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredTests.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">{t.noTestsFound}</div>
                ) : (
                  filteredTests.map((test) => (
                    <label
                      key={test.id}
                      className={`flex items-center gap-3 p-3 border-2 cursor-pointer transition-colors ${
                        selectedTests.has(test.id)
                          ? "border-primary-blue bg-blue-50"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTests.has(test.id)}
                        onChange={() => toggleTest(test.id)}
                        className="w-5 h-5 accent-primary-blue"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {test.short_name ? `${test.short_name} - ${test.name}` : test.name}
                        </div>
                        {test.category && (
                          <div className="text-xs text-gray-500">{test.category}</div>
                        )}
                      </div>
                      <div className="font-bold text-sm whitespace-nowrap">
                        Rs. {Number(test.price).toLocaleString()}
                      </div>
                    </label>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order Summary Section */}
          <Card decorator="red" decoratorPosition="top-left">
            <CardHeader>
              <h2 className="text-lg font-bold">{t.orderSection}</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Selected tests summary */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t.selectedTests} ({selectedTests.size})
                </label>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {selectedTestsInfo.length === 0 ? (
                    <div className="text-gray-500 text-sm">{t.noTestsSelected}</div>
                  ) : (
                    selectedTestsInfo.map((test) => (
                      <div key={test.id} className="flex justify-between text-sm">
                        <span className="truncate">{test.short_name || test.name}</span>
                        <span className="font-medium ml-2">Rs. {Number(test.price).toLocaleString()}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between text-lg font-bold border-t-2 border-foreground pt-2">
                <span>{t.total}:</span>
                <span>Rs. {total.toLocaleString()}</span>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium mb-2">{t.priority}</label>
                <div className="flex gap-2">
                  {(["ROUTINE", "URGENT", "STAT"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`flex-1 px-3 py-2 text-sm font-medium border-2 transition-colors ${
                        priority === p
                          ? p === "STAT"
                            ? "border-primary-red bg-primary-red text-white"
                            : p === "URGENT"
                            ? "border-primary-yellow bg-primary-yellow text-foreground"
                            : "border-primary-blue bg-primary-blue text-white"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      {p === "ROUTINE" ? t.routine : p === "URGENT" ? t.urgent : t.stat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment mode */}
              <div>
                <label className="block text-sm font-medium mb-2">{t.paymentMode}</label>
                <div className="flex gap-2">
                  {(["CASH", "CARD", "UPI"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaymentMode(mode)}
                      className={`flex-1 px-3 py-2 text-sm font-medium border-2 transition-colors ${
                        paymentMode === mode
                          ? "border-primary-blue bg-primary-blue text-white"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      {mode === "CASH" ? t.cash : mode === "CARD" ? t.card : t.upi}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment status */}
              <div>
                <label className="block text-sm font-medium mb-2">{t.paymentStatus}</label>
                <div className="flex gap-2">
                  {(["PENDING", "PAID"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setPaymentStatus(s)}
                      className={`flex-1 px-3 py-2 text-sm font-medium border-2 transition-colors ${
                        paymentStatus === s
                          ? s === "PAID"
                            ? "border-green-500 bg-green-500 text-white"
                            : "border-yellow-500 bg-yellow-500 text-foreground"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      {s === "PENDING" ? t.pending : t.paid}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-2">{t.notes}</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border-2 border-foreground focus:outline-none focus:ring-2 focus:ring-primary-blue resize-none"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="primary"
                className="w-full"
                onClick={handleCreateOrder}
                disabled={submitting || selectedTests.size === 0}
              >
                {submitting ? t.creating : t.createOrder}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
