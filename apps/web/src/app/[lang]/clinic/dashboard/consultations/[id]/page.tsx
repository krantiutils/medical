"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Patient {
  id: string;
  full_name: string;
  patient_number: string;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  blood_group: string | null;
  allergies: string[];
  medical_history: Record<string, unknown> | null;
}

interface Doctor {
  id: string;
  full_name: string;
  registration_number: string;
  type: string;
  degree: string | null;
}

interface Appointment {
  id: string;
  appointment_date: string;
  time_slot_start: string;
  time_slot_end: string;
  chief_complaint: string | null;
  status: string;
}

interface Diagnosis {
  icd10_code: string;
  description: string;
  is_primary: boolean;
}

interface ICD10Code {
  code: string;
  description: string;
  category: string;
}

interface PrescriptionItem {
  id: string;
  drug_name: string;
  generic_name?: string;
  dosage: string;
  frequency: string;
  duration: string;
  duration_unit: string;
  quantity: number;
  instructions?: string;
  product_id?: string;
}

interface Drug {
  id: string | null;
  name: string;
  generic_name: string | null;
  category: string;
  strengths: string[];
  source: "pharmacy" | "common";
}

interface FrequencyOption {
  value: string;
  label: string;
}

interface DurationUnit {
  value: string;
  label: string;
}

interface Prescription {
  id: string;
  prescription_no: string;
  items: PrescriptionItem[];
  instructions: string | null;
  status: "DRAFT" | "ISSUED" | "DISPENSED" | "CANCELLED";
  issued_at: string | null;
  valid_until: string | null;
}

interface ClinicalNote {
  id: string;
  height_cm: string | null;
  weight_kg: string | null;
  bmi: string | null;
  blood_pressure: string | null;
  pulse_rate: number | null;
  temperature: string | null;
  spo2: number | null;
  respiratory_rate: number | null;
  chief_complaint: string | null;
  history_of_illness: string | null;
  past_history: string | null;
  examination: string | null;
  diagnoses: Diagnosis[] | null;
  plan: string | null;
  follow_up: string | null;
  status: "DRAFT" | "FINAL" | "AMENDED";
  created_at: string;
  updated_at: string;
  patient: Patient;
  doctor: Doctor;
  appointment: Appointment | null;
}

interface LabTest {
  id: string;
  name: string;
  short_name: string | null;
  code: string | null;
  category: string | null;
  sample_type: string | null;
  normal_range: string | null;
  unit: string | null;
  price: number;
}

interface LabResult {
  id: string;
  result_value: string | null;
  unit: string | null;
  normal_range: string | null;
  flag: "NORMAL" | "LOW" | "HIGH" | "CRITICAL_LOW" | "CRITICAL_HIGH" | "ABNORMAL" | null;
  remarks: string | null;
  verified: boolean;
  lab_test: LabTest;
}

interface LabOrder {
  id: string;
  order_number: string;
  priority: "ROUTINE" | "URGENT" | "STAT";
  status: "ORDERED" | "SAMPLE_COLLECTED" | "PROCESSING" | "COMPLETED" | "CANCELLED";
  clinical_notes: string | null;
  sample_collected: string | null;
  sample_id: string | null;
  completed_at: string | null;
  created_at: string;
  results: LabResult[];
}

// Translations
const translations = {
  en: {
    title: "Consultation",
    loading: "Loading...",
    loginRequired: "Please log in to access this page",
    login: "Login",
    noClinic: "No Verified Clinic",
    noClinicMessage: "You don't have a verified clinic yet.",
    notFound: "Clinical note not found",
    back: "Back to Consultations",
    // Tabs
    vitals: "Vitals",
    notes: "Clinical Notes",
    diagnosis: "Diagnosis",
    // Patient info
    patient: "Patient",
    patientNumber: "Patient #",
    age: "Age",
    gender: "Gender",
    bloodGroup: "Blood Group",
    allergies: "Allergies",
    phone: "Phone",
    doctor: "Doctor",
    appointment: "Appointment",
    years: "years",
    // Vitals
    heightCm: "Height (cm)",
    weightKg: "Weight (kg)",
    bmi: "BMI",
    bmiCategory: "BMI Category",
    bloodPressure: "Blood Pressure",
    systolic: "Systolic",
    diastolic: "Diastolic",
    mmHg: "mmHg",
    pulseRate: "Pulse Rate",
    bpm: "bpm",
    temperature: "Temperature",
    celsius: "°C",
    spo2: "SpO2",
    percent: "%",
    respiratoryRate: "Respiratory Rate",
    breathsPerMin: "breaths/min",
    // BMI categories
    underweight: "Underweight",
    normal: "Normal",
    overweight: "Overweight",
    obese: "Obese",
    // Clinical notes
    chiefComplaint: "Chief Complaint",
    chiefComplaintPlaceholder: "Primary reason for visit...",
    historyOfIllness: "History of Present Illness (HPI)",
    historyOfIllnessPlaceholder: "Detailed history of the current illness...",
    pastHistory: "Past Medical History",
    pastHistoryPlaceholder: "Previous medical conditions, surgeries, hospitalizations...",
    examination: "Physical Examination",
    examinationPlaceholder: "Physical examination findings...",
    plan: "Treatment Plan",
    planPlaceholder: "Treatment plan and recommendations...",
    followUp: "Follow-up Date",
    // Diagnosis
    searchDiagnosis: "Search ICD-10 diagnosis...",
    addDiagnosis: "Add Diagnosis",
    primaryDiagnosis: "Primary",
    setPrimary: "Set as Primary",
    removeDiagnosis: "Remove",
    noDiagnoses: "No diagnoses added",
    selectedDiagnoses: "Selected Diagnoses",
    categories: "Categories",
    allCategories: "All Categories",
    // Status
    status: "Status",
    draft: "Draft",
    final: "Final",
    amended: "Amended",
    // Actions
    save: "Save Draft",
    saving: "Saving...",
    finalize: "Finalize Note",
    finalizing: "Finalizing...",
    saved: "Saved",
    autoSaved: "Auto-saved",
    finalizeConfirm: "Are you sure you want to finalize this note? Once finalized, you cannot edit it.",
    cancel: "Cancel",
    confirm: "Confirm",
    // Messages
    saveSuccess: "Note saved successfully",
    finalizeSuccess: "Note finalized successfully",
    error: "An error occurred",
    requiredForFinalize: "Chief complaint is required to finalize the note",
    male: "Male",
    female: "Female",
    other: "Other",
    // Prescription
    prescription: "Prescription",
    searchMedication: "Search medication...",
    addMedication: "Add Medication",
    medications: "Medications",
    noMedications: "No medications added",
    drugName: "Drug Name",
    genericName: "Generic Name",
    dosage: "Dosage/Strength",
    frequency: "Frequency",
    duration: "Duration",
    quantity: "Quantity",
    qty: "Qty",
    medicationInstructions: "Instructions",
    selectDosage: "Select dosage",
    selectFrequency: "Select frequency",
    enterDuration: "Enter duration",
    generalInstructions: "General Instructions",
    generalInstructionsPlaceholder: "Additional instructions for the patient...",
    removeMedication: "Remove",
    issuePrescription: "Issue Prescription",
    issuing: "Issuing...",
    printPrescription: "Print",
    prescriptionIssued: "Prescription issued successfully",
    prescriptionRequired: "Add at least one medication to issue prescription",
    prescriptionStatus: "Prescription Status",
    prescriptionDraft: "Draft",
    prescriptionIssued2: "Issued",
    prescriptionValid: "Valid until",
    autoCalculate: "Auto-calculate based on duration and frequency",
    perDay: "per day",
    // Lab
    lab: "Lab Tests",
    searchLabTest: "Search lab tests...",
    addLabTest: "Add Test",
    selectedTests: "Selected Tests",
    noLabTests: "No lab tests selected",
    orderLabTests: "Order Tests",
    ordering: "Ordering...",
    labOrderSuccess: "Lab order placed successfully",
    labOrderRequired: "Add at least one lab test to order",
    labOrders: "Lab Orders",
    noLabOrders: "No lab orders yet",
    orderNumber: "Order #",
    priority: "Priority",
    routine: "Routine",
    urgent: "Urgent",
    stat: "STAT",
    labStatus: "Status",
    ordered: "Ordered",
    sampleCollected: "Sample Collected",
    processing: "Processing",
    completed: "Completed",
    cancelled: "Cancelled",
    testName: "Test Name",
    result: "Result",
    normalRange: "Normal Range",
    flag: "Flag",
    sampleType: "Sample Type",
    viewResults: "View Results",
    enterResults: "Enter Results",
    printReport: "Print Report",
    labFlagNormal: "Normal",
    labFlagLow: "Low",
    labFlagHigh: "High",
    labFlagCriticalLow: "Critical Low",
    labFlagCriticalHigh: "Critical High",
    labFlagAbnormal: "Abnormal",
    labClinicalNotes: "Clinical Notes",
    labCategories: "Categories",
    labAllCategories: "All",
    labVerified: "Verified",
    labPending: "Pending",
    bloodSample: "Blood",
    urineSample: "Urine",
    stoolSample: "Stool",
  },
  ne: {
    title: "परामर्श",
    loading: "लोड हुँदैछ...",
    loginRequired: "यो पृष्ठ पहुँच गर्न कृपया लगइन गर्नुहोस्",
    login: "लगइन गर्नुहोस्",
    noClinic: "कुनै प्रमाणित क्लिनिक छैन",
    noClinicMessage: "तपाईंसँग अझै प्रमाणित क्लिनिक छैन।",
    notFound: "क्लिनिकल नोट फेला परेन",
    back: "परामर्शमा फर्कनुहोस्",
    // Tabs
    vitals: "भाइटलहरू",
    notes: "क्लिनिकल नोटहरू",
    diagnosis: "निदान",
    // Patient info
    patient: "बिरामी",
    patientNumber: "बिरामी #",
    age: "उमेर",
    gender: "लिङ्ग",
    bloodGroup: "रक्त समूह",
    allergies: "एलर्जीहरू",
    phone: "फोन",
    doctor: "डाक्टर",
    appointment: "अपोइन्टमेन्ट",
    years: "वर्ष",
    // Vitals
    heightCm: "उचाइ (सेमी)",
    weightKg: "तौल (केजी)",
    bmi: "बीएमआई",
    bmiCategory: "बीएमआई श्रेणी",
    bloodPressure: "रक्तचाप",
    systolic: "सिस्टोलिक",
    diastolic: "डायस्टोलिक",
    mmHg: "mmHg",
    pulseRate: "नाडी दर",
    bpm: "bpm",
    temperature: "तापक्रम",
    celsius: "°C",
    spo2: "SpO2",
    percent: "%",
    respiratoryRate: "श्वास दर",
    breathsPerMin: "श्वास/मिनेट",
    // BMI categories
    underweight: "कम तौल",
    normal: "सामान्य",
    overweight: "बढी तौल",
    obese: "मोटो",
    // Clinical notes
    chiefComplaint: "मुख्य समस्या",
    chiefComplaintPlaceholder: "भ्रमणको प्राथमिक कारण...",
    historyOfIllness: "वर्तमान रोगको इतिहास (HPI)",
    historyOfIllnessPlaceholder: "वर्तमान रोगको विस्तृत इतिहास...",
    pastHistory: "विगतको चिकित्सा इतिहास",
    pastHistoryPlaceholder: "अघिल्ला चिकित्सा अवस्थाहरू, शल्यक्रियाहरू, अस्पताल भर्नाहरू...",
    examination: "शारीरिक परीक्षण",
    examinationPlaceholder: "शारीरिक परीक्षणका निष्कर्षहरू...",
    plan: "उपचार योजना",
    planPlaceholder: "उपचार योजना र सिफारिसहरू...",
    followUp: "फलो-अप मिति",
    // Diagnosis
    searchDiagnosis: "ICD-10 निदान खोज्नुहोस्...",
    addDiagnosis: "निदान थप्नुहोस्",
    primaryDiagnosis: "प्राथमिक",
    setPrimary: "प्राथमिक बनाउनुहोस्",
    removeDiagnosis: "हटाउनुहोस्",
    noDiagnoses: "कुनै निदान थपिएको छैन",
    selectedDiagnoses: "छानिएका निदानहरू",
    categories: "श्रेणीहरू",
    allCategories: "सबै श्रेणीहरू",
    // Status
    status: "स्थिति",
    draft: "ड्राफ्ट",
    final: "अन्तिम",
    amended: "संशोधित",
    // Actions
    save: "ड्राफ्ट बचत गर्नुहोस्",
    saving: "बचत गर्दै...",
    finalize: "नोट अन्तिम गर्नुहोस्",
    finalizing: "अन्तिम गर्दै...",
    saved: "बचत भयो",
    autoSaved: "स्वतः बचत भयो",
    finalizeConfirm: "के तपाईं यो नोट अन्तिम गर्न निश्चित हुनुहुन्छ? अन्तिम भएपछि, तपाईं यसलाई सम्पादन गर्न सक्नुहुन्न।",
    cancel: "रद्द गर्नुहोस्",
    confirm: "पुष्टि गर्नुहोस्",
    // Messages
    saveSuccess: "नोट सफलतापूर्वक बचत भयो",
    finalizeSuccess: "नोट सफलतापूर्वक अन्तिम भयो",
    error: "त्रुटि भयो",
    requiredForFinalize: "नोट अन्तिम गर्न मुख्य समस्या आवश्यक छ",
    male: "पुरुष",
    female: "महिला",
    other: "अन्य",
    // Prescription
    prescription: "प्रेस्क्रिप्सन",
    searchMedication: "औषधि खोज्नुहोस्...",
    addMedication: "औषधि थप्नुहोस्",
    medications: "औषधिहरू",
    noMedications: "कुनै औषधि थपिएको छैन",
    drugName: "औषधिको नाम",
    genericName: "जेनेरिक नाम",
    dosage: "मात्रा/शक्ति",
    frequency: "आवृत्ति",
    duration: "अवधि",
    quantity: "परिमाण",
    qty: "संख्या",
    medicationInstructions: "निर्देशनहरू",
    selectDosage: "मात्रा छान्नुहोस्",
    selectFrequency: "आवृत्ति छान्नुहोस्",
    enterDuration: "अवधि राख्नुहोस्",
    generalInstructions: "सामान्य निर्देशनहरू",
    generalInstructionsPlaceholder: "बिरामीका लागि थप निर्देशनहरू...",
    removeMedication: "हटाउनुहोस्",
    issuePrescription: "प्रेस्क्रिप्सन जारी गर्नुहोस्",
    issuing: "जारी गर्दै...",
    printPrescription: "छाप्नुहोस्",
    prescriptionIssued: "प्रेस्क्रिप्सन सफलतापूर्वक जारी भयो",
    prescriptionRequired: "प्रेस्क्रिप्सन जारी गर्न कम्तीमा एउटा औषधि थप्नुहोस्",
    prescriptionStatus: "प्रेस्क्रिप्सन स्थिति",
    prescriptionDraft: "ड्राफ्ट",
    prescriptionIssued2: "जारी भयो",
    prescriptionValid: "मान्य",
    autoCalculate: "अवधि र आवृत्तिको आधारमा स्वचालित गणना",
    perDay: "प्रति दिन",
    // Lab
    lab: "प्रयोगशाला परीक्षण",
    searchLabTest: "प्रयोगशाला परीक्षण खोज्नुहोस्...",
    addLabTest: "परीक्षण थप्नुहोस्",
    selectedTests: "छानिएका परीक्षणहरू",
    noLabTests: "कुनै प्रयोगशाला परीक्षण छानिएको छैन",
    orderLabTests: "परीक्षण अर्डर गर्नुहोस्",
    ordering: "अर्डर गर्दै...",
    labOrderSuccess: "प्रयोगशाला अर्डर सफलतापूर्वक राखियो",
    labOrderRequired: "अर्डर गर्न कम्तीमा एउटा परीक्षण थप्नुहोस्",
    labOrders: "प्रयोगशाला अर्डरहरू",
    noLabOrders: "अझै कुनै प्रयोगशाला अर्डर छैन",
    orderNumber: "अर्डर #",
    priority: "प्राथमिकता",
    routine: "सामान्य",
    urgent: "अर्जेन्ट",
    stat: "तुरुन्त",
    labStatus: "स्थिति",
    ordered: "अर्डर भयो",
    sampleCollected: "नमूना लिइयो",
    processing: "प्रक्रियामा",
    completed: "सम्पन्न",
    cancelled: "रद्द",
    testName: "परीक्षणको नाम",
    result: "नतिजा",
    normalRange: "सामान्य दायरा",
    flag: "चिन्ह",
    sampleType: "नमूनाको प्रकार",
    viewResults: "नतिजा हेर्नुहोस्",
    enterResults: "नतिजा प्रविष्ट गर्नुहोस्",
    printReport: "रिपोर्ट छाप्नुहोस्",
    labFlagNormal: "सामान्य",
    labFlagLow: "कम",
    labFlagHigh: "उच्च",
    labFlagCriticalLow: "अत्यन्त कम",
    labFlagCriticalHigh: "अत्यन्त उच्च",
    labFlagAbnormal: "असामान्य",
    labClinicalNotes: "क्लिनिकल नोटहरू",
    labCategories: "श्रेणीहरू",
    labAllCategories: "सबै",
    labVerified: "प्रमाणित",
    labPending: "पेन्डिङ",
    bloodSample: "रगत",
    urineSample: "पिसाब",
    stoolSample: "दिसा",
  },
};

export default function ConsultationDetailPage() {
  const { data: session, status } = useSession();
  const params = useParams<{ lang: string; id: string }>();
  const router = useRouter();
  const lang = params?.lang || "en";
  const noteId = params?.id;
  const t = translations[lang as keyof typeof translations] || translations.en;

  // Data state
  const [clinicalNote, setClinicalNote] = useState<ClinicalNote | null>(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [noClinic, setNoClinic] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<"vitals" | "notes" | "diagnosis" | "prescription" | "lab">("vitals");
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Form state
  const [formData, setFormData] = useState({
    height_cm: "",
    weight_kg: "",
    blood_pressure_systolic: "",
    blood_pressure_diastolic: "",
    pulse_rate: "",
    temperature: "",
    spo2: "",
    respiratory_rate: "",
    chief_complaint: "",
    history_of_illness: "",
    past_history: "",
    examination: "",
    plan: "",
    follow_up: "",
  });
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);

  // ICD-10 search state
  const [icdSearch, setIcdSearch] = useState("");
  const [icdResults, setIcdResults] = useState<ICD10Code[]>([]);
  const [icdCategories, setIcdCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchingIcd, setSearchingIcd] = useState(false);

  // Prescription state
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>([]);
  const [prescriptionInstructions, setPrescriptionInstructions] = useState("");
  const [drugSearch, setDrugSearch] = useState("");
  const [drugResults, setDrugResults] = useState<Drug[]>([]);
  const [frequencyOptions, setFrequencyOptions] = useState<FrequencyOption[]>([]);
  const [durationUnits, setDurationUnits] = useState<DurationUnit[]>([]);
  const [searchingDrugs, setSearchingDrugs] = useState(false);
  const [issuingPrescription, setIssuingPrescription] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
  const [newMedication, setNewMedication] = useState({
    dosage: "",
    frequency: "",
    duration: "",
    duration_unit: "days",
    instructions: "",
  });

  // Lab state
  const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
  const [labTestSearch, setLabTestSearch] = useState("");
  const [labTestResults, setLabTestResults] = useState<LabTest[]>([]);
  const [labCategories, setLabCategories] = useState<string[]>([]);
  const [selectedLabCategory, setSelectedLabCategory] = useState("");
  const [searchingLabTests, setSearchingLabTests] = useState(false);
  const [selectedLabTests, setSelectedLabTests] = useState<LabTest[]>([]);
  const [orderingLab, setOrderingLab] = useState(false);
  const [labPriority, setLabPriority] = useState<"ROUTINE" | "URGENT" | "STAT">("ROUTINE");
  const [labClinicalNotes, setLabClinicalNotes] = useState("");

  // Auto-save debounce
  const autoSaveTimeout = useRef<NodeJS.Timeout | null>(null);

  // Calculate BMI
  const calculateBMI = (height: string, weight: string): string | null => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (!h || !w || h <= 0 || w <= 0) return null;
    const heightM = h / 100;
    return (w / (heightM * heightM)).toFixed(1);
  };

  // Get BMI category
  const getBMICategory = (bmi: string | null): { label: string; color: string } => {
    if (!bmi) return { label: "", color: "" };
    const bmiVal = parseFloat(bmi);
    if (bmiVal < 18.5) return { label: t.underweight, color: "text-primary-yellow" };
    if (bmiVal < 25) return { label: t.normal, color: "text-verified" };
    if (bmiVal < 30) return { label: t.overweight, color: "text-primary-yellow" };
    return { label: t.obese, color: "text-primary-red" };
  };

  // Fetch clinical note
  const fetchClinicalNote = useCallback(async () => {
    if (!noteId) return;

    try {
      const response = await fetch(`/api/clinic/clinical-notes/${noteId}`);

      if (response.status === 404) {
        const data = await response.json();
        if (data.code === "NO_CLINIC") {
          setNoClinic(true);
        } else {
          setNotFound(true);
        }
        return;
      }

      if (!response.ok) throw new Error("Failed to fetch clinical note");

      const data = await response.json();
      const note = data.clinicalNote;
      setClinicalNote(note);

      // Parse blood pressure
      let systolic = "";
      let diastolic = "";
      if (note.blood_pressure) {
        const parts = note.blood_pressure.split("/");
        if (parts.length === 2) {
          systolic = parts[0].trim();
          diastolic = parts[1].trim();
        }
      }

      // Set form data
      setFormData({
        height_cm: note.height_cm || "",
        weight_kg: note.weight_kg || "",
        blood_pressure_systolic: systolic,
        blood_pressure_diastolic: diastolic,
        pulse_rate: note.pulse_rate?.toString() || "",
        temperature: note.temperature || "",
        spo2: note.spo2?.toString() || "",
        respiratory_rate: note.respiratory_rate?.toString() || "",
        chief_complaint: note.chief_complaint || "",
        history_of_illness: note.history_of_illness || "",
        past_history: note.past_history || "",
        examination: note.examination || "",
        plan: note.plan || "",
        follow_up: note.follow_up ? note.follow_up.split("T")[0] : "",
      });

      // Set diagnoses
      setDiagnoses(note.diagnoses || []);
    } catch (error) {
      console.error("Error fetching clinical note:", error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [noteId]);

  // Search ICD-10 codes
  const searchICD10 = useCallback(async (query: string, category?: string) => {
    if (!query.trim() && !category) {
      setIcdResults([]);
      return;
    }

    setSearchingIcd(true);
    try {
      let url = `/api/clinic/icd10?q=${encodeURIComponent(query)}`;
      if (category) {
        url += `&category=${encodeURIComponent(category)}`;
      }
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setIcdResults(data.codes || []);
        if (data.categories && icdCategories.length === 0) {
          setIcdCategories(data.categories);
        }
      }
    } catch (error) {
      console.error("Error searching ICD-10:", error);
    } finally {
      setSearchingIcd(false);
    }
  }, [icdCategories.length]);

  // Fetch prescription for this clinical note
  const fetchPrescription = useCallback(async () => {
    if (!noteId) return;

    try {
      const response = await fetch(`/api/clinic/prescriptions?clinical_note_id=${noteId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.prescriptions && data.prescriptions.length > 0) {
          const rx = data.prescriptions[0];
          setPrescription(rx);
          setPrescriptionItems((rx.items as PrescriptionItem[]) || []);
          setPrescriptionInstructions(rx.instructions || "");
        }
      }
    } catch (error) {
      console.error("Error fetching prescription:", error);
    }
  }, [noteId]);

  // Fetch lab orders for this clinical note
  const fetchLabOrders = useCallback(async () => {
    if (!noteId) return;

    try {
      const response = await fetch(`/api/clinic/lab-orders?clinical_note_id=${noteId}`);
      if (response.ok) {
        const data = await response.json();
        setLabOrders(data.labOrders || []);
      }
    } catch (error) {
      console.error("Error fetching lab orders:", error);
    }
  }, [noteId]);

  // Search lab tests
  const searchLabTests = useCallback(async (query: string, category?: string) => {
    setSearchingLabTests(true);
    try {
      let url = `/api/clinic/lab-tests?q=${encodeURIComponent(query)}`;
      if (category) {
        url += `&category=${encodeURIComponent(category)}`;
      }
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setLabTestResults(data.tests || []);
        if (data.categories && labCategories.length === 0) {
          setLabCategories(data.categories);
        }
      }
    } catch (error) {
      console.error("Error searching lab tests:", error);
    } finally {
      setSearchingLabTests(false);
    }
  }, [labCategories.length]);

  // Order lab tests
  const handleOrderLabTests = async () => {
    if (!clinicalNote || selectedLabTests.length === 0) {
      setMessage({ type: "error", text: t.labOrderRequired });
      return;
    }

    setOrderingLab(true);
    setMessage(null);

    try {
      const response = await fetch("/api/clinic/lab-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: clinicalNote.patient.id,
          ordered_by_id: clinicalNote.doctor.id,
          clinical_note_id: clinicalNote.id,
          appointment_id: clinicalNote.appointment?.id || null,
          priority: labPriority,
          clinical_notes: labClinicalNotes || null,
          tests: selectedLabTests.map((t) => t.id),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to order lab tests");
      }

      const data = await response.json();
      setLabOrders((prev) => [data.labOrder, ...prev]);
      setSelectedLabTests([]);
      setLabClinicalNotes("");
      setLabPriority("ROUTINE");
      setMessage({ type: "success", text: t.labOrderSuccess });
    } catch (error) {
      console.error("Error ordering lab tests:", error);
      setMessage({ type: "error", text: t.error });
    } finally {
      setOrderingLab(false);
    }
  };

  // Add lab test to selection
  const handleAddLabTest = (test: LabTest) => {
    if (selectedLabTests.some((t) => t.id === test.id)) return;
    setSelectedLabTests((prev) => [...prev, test]);
    setLabTestSearch("");
    setLabTestResults([]);
  };

  // Remove lab test from selection
  const handleRemoveLabTest = (testId: string) => {
    setSelectedLabTests((prev) => prev.filter((t) => t.id !== testId));
  };

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
        return t.labFlagNormal;
      case "LOW":
        return t.labFlagLow;
      case "HIGH":
        return t.labFlagHigh;
      case "CRITICAL_LOW":
        return t.labFlagCriticalLow;
      case "CRITICAL_HIGH":
        return t.labFlagCriticalHigh;
      case "ABNORMAL":
        return t.labFlagAbnormal;
      default:
        return "-";
    }
  };

  // Get status color
  const getLabStatusColor = (status: string): string => {
    switch (status) {
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
  const getLabStatusLabel = (status: string): string => {
    switch (status) {
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
        return status;
    }
  };

  // Print lab report
  const handlePrintLabReport = (order: LabOrder) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const orderDate = new Date(order.created_at).toLocaleDateString();
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
            <div class="order-no">${order.order_number}</div>
            <div>Order Date: ${orderDate}</div>
            <div>Report Date: ${completedDate}</div>
          </div>
        </div>

        <div class="patient-info">
          <div>
            <strong>Patient:</strong> ${clinicalNote?.patient.full_name || ""}
          </div>
          <div>
            <strong>Patient #:</strong> ${clinicalNote?.patient.patient_number || ""}
          </div>
          <div>
            <strong>Age/Gender:</strong> ${clinicalNote?.patient.date_of_birth ? getAge(clinicalNote.patient.date_of_birth) : "-"} / ${clinicalNote?.patient.gender || "-"}
          </div>
          <div>
            <strong>Sample ID:</strong> ${order.sample_id || "-"}
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
          <div>
            <strong>Ordered by:</strong> Dr. ${clinicalNote?.doctor.full_name || ""}<br>
            Reg. No: ${clinicalNote?.doctor.registration_number || ""}
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

  // Search drugs
  const searchDrugs = useCallback(async (query: string) => {
    if (!query.trim()) {
      // Fetch frequency options and duration units
      try {
        const response = await fetch("/api/clinic/prescriptions/drugs?q=");
        if (response.ok) {
          const data = await response.json();
          setFrequencyOptions(data.frequencyOptions || []);
          setDurationUnits(data.durationUnits || []);
        }
      } catch (error) {
        console.error("Error fetching drug options:", error);
      }
      setDrugResults([]);
      return;
    }

    setSearchingDrugs(true);
    try {
      const response = await fetch(`/api/clinic/prescriptions/drugs?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setDrugResults(data.drugs || []);
        if (data.frequencyOptions && frequencyOptions.length === 0) {
          setFrequencyOptions(data.frequencyOptions);
        }
        if (data.durationUnits && durationUnits.length === 0) {
          setDurationUnits(data.durationUnits);
        }
      }
    } catch (error) {
      console.error("Error searching drugs:", error);
    } finally {
      setSearchingDrugs(false);
    }
  }, [frequencyOptions.length, durationUnits.length]);

  // Calculate quantity based on frequency and duration
  const calculateQuantity = (frequency: string, duration: string, durationUnit: string): number => {
    const durationNum = parseFloat(duration) || 0;
    if (durationNum <= 0) return 0;

    // Convert duration to days
    let totalDays = durationNum;
    if (durationUnit === "weeks") {
      totalDays = durationNum * 7;
    } else if (durationUnit === "months") {
      totalDays = durationNum * 30;
    }

    // Calculate doses per day based on frequency
    let dosesPerDay = 1;
    switch (frequency) {
      case "OD":
        dosesPerDay = 1;
        break;
      case "BD":
        dosesPerDay = 2;
        break;
      case "TDS":
        dosesPerDay = 3;
        break;
      case "QID":
        dosesPerDay = 4;
        break;
      case "HS":
        dosesPerDay = 1;
        break;
      case "SOS":
        dosesPerDay = 1; // As needed, approximate
        break;
      case "STAT":
        return 1; // Single dose
      case "Q4H":
        dosesPerDay = 6;
        break;
      case "Q6H":
        dosesPerDay = 4;
        break;
      case "Q8H":
        dosesPerDay = 3;
        break;
      case "Q12H":
        dosesPerDay = 2;
        break;
      case "WEEKLY":
        return Math.ceil(totalDays / 7);
      case "ALTERNATE_DAYS":
        return Math.ceil(totalDays / 2);
      default:
        dosesPerDay = 1;
    }

    return Math.ceil(totalDays * dosesPerDay);
  };

  // Add medication to prescription
  const handleAddMedication = () => {
    if (!selectedDrug || !newMedication.dosage || !newMedication.frequency || !newMedication.duration) {
      return;
    }

    const quantity = calculateQuantity(
      newMedication.frequency,
      newMedication.duration,
      newMedication.duration_unit
    );

    const newItem: PrescriptionItem = {
      id: crypto.randomUUID(),
      drug_name: selectedDrug.name,
      generic_name: selectedDrug.generic_name || undefined,
      dosage: newMedication.dosage,
      frequency: newMedication.frequency,
      duration: newMedication.duration,
      duration_unit: newMedication.duration_unit,
      quantity,
      instructions: newMedication.instructions || undefined,
      product_id: selectedDrug.id || undefined,
    };

    setPrescriptionItems((prev) => [...prev, newItem]);
    setSelectedDrug(null);
    setDrugSearch("");
    setDrugResults([]);
    setNewMedication({
      dosage: "",
      frequency: "",
      duration: "",
      duration_unit: "days",
      instructions: "",
    });
  };

  // Remove medication from prescription
  const handleRemoveMedication = (id: string) => {
    setPrescriptionItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Save prescription (create or update)
  const savePrescription = useCallback(async () => {
    if (!clinicalNote || prescriptionItems.length === 0) return null;

    try {
      if (prescription) {
        // Update existing prescription
        const response = await fetch(`/api/clinic/prescriptions/${prescription.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: prescriptionItems,
            instructions: prescriptionInstructions || null,
          }),
        });
        if (response.ok) {
          const data = await response.json();
          return data.prescription;
        }
      } else {
        // Create new prescription
        const response = await fetch("/api/clinic/prescriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patient_id: clinicalNote.patient.id,
            doctor_id: clinicalNote.doctor.id,
            clinical_note_id: clinicalNote.id,
            appointment_id: clinicalNote.appointment?.id || null,
            items: prescriptionItems,
            instructions: prescriptionInstructions || null,
          }),
        });
        if (response.ok) {
          const data = await response.json();
          setPrescription(data.prescription);
          return data.prescription;
        }
      }
    } catch (error) {
      console.error("Error saving prescription:", error);
    }
    return null;
  }, [clinicalNote, prescription, prescriptionItems, prescriptionInstructions]);

  // Issue prescription
  const handleIssuePrescription = async () => {
    if (prescriptionItems.length === 0) {
      setMessage({ type: "error", text: t.prescriptionRequired });
      return;
    }

    setIssuingPrescription(true);
    setMessage(null);

    try {
      // First save/create the prescription
      let rx = prescription;
      if (!rx || prescriptionItems.length !== ((rx.items as PrescriptionItem[])?.length || 0)) {
        rx = await savePrescription();
      }

      if (!rx) {
        throw new Error("Failed to save prescription");
      }

      // Then issue it
      const response = await fetch(`/api/clinic/prescriptions/${rx.id}/issue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ validity_days: 30 }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to issue prescription");
      }

      const data = await response.json();
      setPrescription(data.prescription);
      setMessage({ type: "success", text: t.prescriptionIssued });
    } catch (error) {
      console.error("Error issuing prescription:", error);
      setMessage({ type: "error", text: t.error });
    } finally {
      setIssuingPrescription(false);
    }
  };

  // Print prescription
  const handlePrintPrescription = () => {
    if (!prescription && prescriptionItems.length === 0) return;

    // Open print window with prescription details
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const prescriptionNo = prescription?.prescription_no || "DRAFT";
    const issuedDate = prescription?.issued_at
      ? new Date(prescription.issued_at).toLocaleDateString()
      : new Date().toLocaleDateString();
    const validUntil = prescription?.valid_until
      ? new Date(prescription.valid_until).toLocaleDateString()
      : "-";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Prescription - ${prescriptionNo}</title>
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
            line-height: 1.4;
          }
          .header {
            border-bottom: 3px solid #121212;
            padding-bottom: 15px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
          }
          .clinic-info { text-align: left; }
          .clinic-name { font-size: 24px; font-weight: bold; color: #D02020; }
          .rx-info { text-align: right; }
          .rx-no { font-size: 18px; font-weight: bold; font-family: monospace; }
          .patient-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 20px;
            padding: 15px;
            background: #f5f5f5;
            border: 2px solid #121212;
          }
          .rx-symbol {
            font-size: 32px;
            font-weight: bold;
            color: #1040C0;
            margin: 20px 0 10px;
          }
          .medications { margin-bottom: 20px; }
          .med-item {
            padding: 12px;
            border: 2px solid #121212;
            margin-bottom: 8px;
            display: grid;
            grid-template-columns: 2fr 1fr 1fr 1fr;
            gap: 10px;
            align-items: center;
          }
          .med-name { font-weight: bold; }
          .med-generic { font-size: 12px; color: #666; }
          .instructions {
            margin-top: 20px;
            padding: 15px;
            border: 2px solid #121212;
            background: #FFF8E1;
          }
          .doctor-signature {
            margin-top: 40px;
            text-align: right;
            padding-top: 20px;
            border-top: 2px solid #121212;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #666;
            padding-top: 15px;
            border-top: 1px solid #ccc;
          }
          @media print {
            .no-print { display: none; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="clinic-info">
            <div class="clinic-name">Swasthya</div>
            <div>Healthcare Platform</div>
          </div>
          <div class="rx-info">
            <div class="rx-no">${prescriptionNo}</div>
            <div>Date: ${issuedDate}</div>
            <div>Valid Until: ${validUntil}</div>
          </div>
        </div>

        <div class="patient-info">
          <div>
            <strong>Patient:</strong> ${clinicalNote?.patient.full_name || ""}
          </div>
          <div>
            <strong>Patient #:</strong> ${clinicalNote?.patient.patient_number || ""}
          </div>
          <div>
            <strong>Age/Gender:</strong> ${clinicalNote?.patient.date_of_birth ? getAge(clinicalNote.patient.date_of_birth) : "-"} / ${clinicalNote?.patient.gender || "-"}
          </div>
          <div>
            <strong>Phone:</strong> ${clinicalNote?.patient.phone || "-"}
          </div>
        </div>

        <div class="rx-symbol">Rx</div>

        <div class="medications">
          ${prescriptionItems.map((item, idx) => `
            <div class="med-item">
              <div>
                <div class="med-name">${idx + 1}. ${item.drug_name} ${item.dosage}</div>
                ${item.generic_name ? `<div class="med-generic">(${item.generic_name})</div>` : ""}
              </div>
              <div><strong>${item.frequency}</strong></div>
              <div>${item.duration} ${item.duration_unit}</div>
              <div>Qty: <strong>${item.quantity}</strong></div>
            </div>
            ${item.instructions ? `<div style="padding: 5px 12px; font-size: 12px; color: #666;">↳ ${item.instructions}</div>` : ""}
          `).join("")}
        </div>

        ${prescriptionInstructions ? `
          <div class="instructions">
            <strong>General Instructions:</strong><br>
            ${prescriptionInstructions}
          </div>
        ` : ""}

        <div class="doctor-signature">
          <div><strong>Dr. ${clinicalNote?.doctor.full_name || ""}</strong></div>
          <div>${clinicalNote?.doctor.degree || ""}</div>
          <div>Reg. No: ${clinicalNote?.doctor.registration_number || ""}</div>
          <div style="margin-top: 40px;">_______________________</div>
          <div>Signature</div>
        </div>

        <div class="footer">
          Generated via Swasthya Healthcare Platform
        </div>

        <div class="no-print" style="text-align: center; margin-top: 20px;">
          <button onclick="window.print()" style="padding: 10px 30px; font-size: 16px; cursor: pointer;">
            Print Prescription
          </button>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Auto-save function
  const autoSave = useCallback(async () => {
    if (!noteId || clinicalNote?.status !== "DRAFT") return;

    setAutoSaveStatus("saving");
    try {
      const bloodPressure =
        formData.blood_pressure_systolic && formData.blood_pressure_diastolic
          ? `${formData.blood_pressure_systolic}/${formData.blood_pressure_diastolic}`
          : null;

      const response = await fetch(`/api/clinic/clinical-notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          height_cm: formData.height_cm || null,
          weight_kg: formData.weight_kg || null,
          blood_pressure: bloodPressure,
          pulse_rate: formData.pulse_rate || null,
          temperature: formData.temperature || null,
          spo2: formData.spo2 || null,
          respiratory_rate: formData.respiratory_rate || null,
          chief_complaint: formData.chief_complaint || null,
          history_of_illness: formData.history_of_illness || null,
          past_history: formData.past_history || null,
          examination: formData.examination || null,
          diagnoses: diagnoses.length > 0 ? diagnoses : null,
          plan: formData.plan || null,
          follow_up: formData.follow_up || null,
        }),
      });

      if (response.ok) {
        setAutoSaveStatus("saved");
        setTimeout(() => setAutoSaveStatus("idle"), 2000);
      }
    } catch (error) {
      console.error("Error auto-saving:", error);
      setAutoSaveStatus("idle");
    }
  }, [noteId, clinicalNote?.status, formData, diagnoses]);

  // Trigger auto-save on form changes
  useEffect(() => {
    if (clinicalNote?.status !== "DRAFT") return;

    if (autoSaveTimeout.current) {
      clearTimeout(autoSaveTimeout.current);
    }

    autoSaveTimeout.current = setTimeout(() => {
      autoSave();
    }, 2000); // 2 second debounce

    return () => {
      if (autoSaveTimeout.current) {
        clearTimeout(autoSaveTimeout.current);
      }
    };
  }, [formData, diagnoses, autoSave, clinicalNote?.status]);

  // Initial load
  useEffect(() => {
    if (status === "authenticated") {
      fetchClinicalNote();
      fetchPrescription();
      fetchLabOrders();
      // Load frequency/duration options
      searchDrugs("");
      // Load lab test categories
      searchLabTests("");
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, fetchClinicalNote, fetchPrescription, fetchLabOrders, searchDrugs, searchLabTests]);

  // ICD-10 search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (icdSearch || selectedCategory) {
        searchICD10(icdSearch, selectedCategory);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [icdSearch, selectedCategory, searchICD10]);

  // Drug search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (drugSearch) {
        searchDrugs(drugSearch);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [drugSearch, searchDrugs]);

  // Lab test search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (labTestSearch || selectedLabCategory) {
        searchLabTests(labTestSearch, selectedLabCategory);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [labTestSearch, selectedLabCategory, searchLabTests]);

  // Handle form input change
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Add diagnosis
  const handleAddDiagnosis = (code: ICD10Code) => {
    // Check if already added
    if (diagnoses.some((d) => d.icd10_code === code.code)) return;

    const newDiagnosis: Diagnosis = {
      icd10_code: code.code,
      description: code.description,
      is_primary: diagnoses.length === 0, // First diagnosis is primary by default
    };

    setDiagnoses((prev) => [...prev, newDiagnosis]);
    setIcdSearch("");
    setIcdResults([]);
  };

  // Remove diagnosis
  const handleRemoveDiagnosis = (code: string) => {
    setDiagnoses((prev) => {
      const newDiagnoses = prev.filter((d) => d.icd10_code !== code);
      // If removed the primary and there are others, make first one primary
      if (prev.find((d) => d.icd10_code === code)?.is_primary && newDiagnoses.length > 0) {
        newDiagnoses[0].is_primary = true;
      }
      return newDiagnoses;
    });
  };

  // Set primary diagnosis
  const handleSetPrimary = (code: string) => {
    setDiagnoses((prev) =>
      prev.map((d) => ({
        ...d,
        is_primary: d.icd10_code === code,
      }))
    );
  };

  // Manual save
  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const bloodPressure =
        formData.blood_pressure_systolic && formData.blood_pressure_diastolic
          ? `${formData.blood_pressure_systolic}/${formData.blood_pressure_diastolic}`
          : null;

      const response = await fetch(`/api/clinic/clinical-notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          height_cm: formData.height_cm || null,
          weight_kg: formData.weight_kg || null,
          blood_pressure: bloodPressure,
          pulse_rate: formData.pulse_rate || null,
          temperature: formData.temperature || null,
          spo2: formData.spo2 || null,
          respiratory_rate: formData.respiratory_rate || null,
          chief_complaint: formData.chief_complaint || null,
          history_of_illness: formData.history_of_illness || null,
          past_history: formData.past_history || null,
          examination: formData.examination || null,
          diagnoses: diagnoses.length > 0 ? diagnoses : null,
          plan: formData.plan || null,
          follow_up: formData.follow_up || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save");
      }

      setMessage({ type: "success", text: t.saveSuccess });
    } catch (error) {
      console.error("Error saving:", error);
      setMessage({ type: "error", text: t.error });
    } finally {
      setSaving(false);
    }
  };

  // Finalize note
  const handleFinalize = async () => {
    if (!formData.chief_complaint?.trim()) {
      setMessage({ type: "error", text: t.requiredForFinalize });
      return;
    }

    setFinalizing(true);
    setMessage(null);

    try {
      // First save
      await handleSave();

      // Then finalize
      const response = await fetch(`/api/clinic/clinical-notes/${noteId}/finalize`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to finalize");
      }

      const data = await response.json();
      setClinicalNote(data.clinicalNote);
      setShowFinalizeModal(false);
      setMessage({ type: "success", text: t.finalizeSuccess });
    } catch (error) {
      console.error("Error finalizing:", error);
      setMessage({ type: "error", text: t.error });
    } finally {
      setFinalizing(false);
    }
  };

  // Get patient age
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

  // Loading state
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
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
          <Link href={`/${lang}/login?callbackUrl=/${lang}/clinic/dashboard/consultations/${noteId}`}>
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
  if (notFound || !clinicalNote) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-2xl mx-auto text-center py-16">
          <h1 className="text-2xl font-bold mb-2">{t.notFound}</h1>
          <Link href={`/${lang}/clinic/dashboard/consultations`}>
            <Button variant="primary" className="mt-4">
              {t.back}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const bmi = calculateBMI(formData.height_cm, formData.weight_kg);
  const bmiCategory = getBMICategory(bmi);
  const isReadOnly = clinicalNote.status !== "DRAFT";

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{t.title}</h1>
              <span
                className={`px-3 py-1 rounded text-sm font-medium ${
                  clinicalNote.status === "DRAFT"
                    ? "bg-primary-yellow text-foreground"
                    : clinicalNote.status === "FINAL"
                    ? "bg-verified text-white"
                    : "bg-primary-blue text-white"
                }`}
              >
                {clinicalNote.status === "DRAFT" ? t.draft : clinicalNote.status === "FINAL" ? t.final : t.amended}
              </span>
              {autoSaveStatus === "saving" && (
                <span className="text-sm text-gray-500 animate-pulse">{t.saving}</span>
              )}
              {autoSaveStatus === "saved" && (
                <span className="text-sm text-verified">{t.autoSaved}</span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/${lang}/clinic/dashboard/consultations`}>
              <Button variant="outline">{t.back}</Button>
            </Link>
            {!isReadOnly && (
              <>
                <Button variant="outline" onClick={handleSave} disabled={saving}>
                  {saving ? t.saving : t.save}
                </Button>
                <Button variant="primary" onClick={() => setShowFinalizeModal(true)} disabled={finalizing}>
                  {finalizing ? t.finalizing : t.finalize}
                </Button>
              </>
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

        {/* Patient Info Card */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase">{t.patient}</p>
                <p className="font-semibold">{clinicalNote.patient.full_name}</p>
                <p className="text-sm text-gray-600">#{clinicalNote.patient.patient_number}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">{t.age} / {t.gender}</p>
                <p className="font-medium">
                  {getAge(clinicalNote.patient.date_of_birth)} / {
                    clinicalNote.patient.gender === "Male" ? t.male :
                    clinicalNote.patient.gender === "Female" ? t.female :
                    clinicalNote.patient.gender || "-"
                  }
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">{t.doctor}</p>
                <p className="font-medium">{clinicalNote.doctor.full_name}</p>
                <p className="text-sm text-gray-600">{clinicalNote.doctor.registration_number}</p>
              </div>
              {clinicalNote.patient.allergies && clinicalNote.patient.allergies.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 uppercase">{t.allergies}</p>
                  <p className="font-medium text-primary-red">
                    {clinicalNote.patient.allergies.join(", ")}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex border-b-2 border-foreground mb-6 overflow-x-auto">
          {(["vitals", "notes", "diagnosis", "prescription", "lab"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? "bg-foreground text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              {tab === "vitals" ? t.vitals : tab === "notes" ? t.notes : tab === "diagnosis" ? t.diagnosis : tab === "prescription" ? t.prescription : t.lab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "vitals" && (
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold">{t.vitals}</h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Height */}
                <div>
                  <label className="block text-sm font-medium mb-1">{t.heightCm}</label>
                  <input
                    type="number"
                    value={formData.height_cm}
                    onChange={(e) => handleInputChange("height_cm", e.target.value)}
                    disabled={isReadOnly}
                    className="w-full p-2 border-2 border-foreground rounded focus:border-primary-blue outline-none disabled:bg-gray-100"
                    placeholder="170"
                    min="50"
                    max="250"
                  />
                </div>

                {/* Weight */}
                <div>
                  <label className="block text-sm font-medium mb-1">{t.weightKg}</label>
                  <input
                    type="number"
                    value={formData.weight_kg}
                    onChange={(e) => handleInputChange("weight_kg", e.target.value)}
                    disabled={isReadOnly}
                    className="w-full p-2 border-2 border-foreground rounded focus:border-primary-blue outline-none disabled:bg-gray-100"
                    placeholder="70"
                    min="1"
                    max="500"
                    step="0.1"
                  />
                </div>

                {/* BMI (calculated) */}
                <div>
                  <label className="block text-sm font-medium mb-1">{t.bmi}</label>
                  <div className="flex items-center gap-2">
                    <div className="w-full p-2 border-2 border-gray-300 rounded bg-gray-50">
                      {bmi || "-"}
                    </div>
                    {bmi && (
                      <span className={`text-sm font-medium ${bmiCategory.color}`}>
                        {bmiCategory.label}
                      </span>
                    )}
                  </div>
                </div>

                {/* Blood Pressure */}
                <div>
                  <label className="block text-sm font-medium mb-1">{t.bloodPressure}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={formData.blood_pressure_systolic}
                      onChange={(e) => handleInputChange("blood_pressure_systolic", e.target.value)}
                      disabled={isReadOnly}
                      className="w-full p-2 border-2 border-foreground rounded focus:border-primary-blue outline-none disabled:bg-gray-100"
                      placeholder={t.systolic}
                      min="60"
                      max="300"
                    />
                    <span className="text-lg font-bold">/</span>
                    <input
                      type="number"
                      value={formData.blood_pressure_diastolic}
                      onChange={(e) => handleInputChange("blood_pressure_diastolic", e.target.value)}
                      disabled={isReadOnly}
                      className="w-full p-2 border-2 border-foreground rounded focus:border-primary-blue outline-none disabled:bg-gray-100"
                      placeholder={t.diastolic}
                      min="30"
                      max="200"
                    />
                    <span className="text-sm text-gray-500">{t.mmHg}</span>
                  </div>
                </div>

                {/* Pulse Rate */}
                <div>
                  <label className="block text-sm font-medium mb-1">{t.pulseRate}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={formData.pulse_rate}
                      onChange={(e) => handleInputChange("pulse_rate", e.target.value)}
                      disabled={isReadOnly}
                      className="w-full p-2 border-2 border-foreground rounded focus:border-primary-blue outline-none disabled:bg-gray-100"
                      placeholder="72"
                      min="30"
                      max="250"
                    />
                    <span className="text-sm text-gray-500">{t.bpm}</span>
                  </div>
                </div>

                {/* Temperature */}
                <div>
                  <label className="block text-sm font-medium mb-1">{t.temperature}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={formData.temperature}
                      onChange={(e) => handleInputChange("temperature", e.target.value)}
                      disabled={isReadOnly}
                      className="w-full p-2 border-2 border-foreground rounded focus:border-primary-blue outline-none disabled:bg-gray-100"
                      placeholder="36.5"
                      min="30"
                      max="45"
                      step="0.1"
                    />
                    <span className="text-sm text-gray-500">{t.celsius}</span>
                  </div>
                </div>

                {/* SpO2 */}
                <div>
                  <label className="block text-sm font-medium mb-1">{t.spo2}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={formData.spo2}
                      onChange={(e) => handleInputChange("spo2", e.target.value)}
                      disabled={isReadOnly}
                      className="w-full p-2 border-2 border-foreground rounded focus:border-primary-blue outline-none disabled:bg-gray-100"
                      placeholder="98"
                      min="50"
                      max="100"
                    />
                    <span className="text-sm text-gray-500">{t.percent}</span>
                  </div>
                </div>

                {/* Respiratory Rate */}
                <div>
                  <label className="block text-sm font-medium mb-1">{t.respiratoryRate}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={formData.respiratory_rate}
                      onChange={(e) => handleInputChange("respiratory_rate", e.target.value)}
                      disabled={isReadOnly}
                      className="w-full p-2 border-2 border-foreground rounded focus:border-primary-blue outline-none disabled:bg-gray-100"
                      placeholder="16"
                      min="5"
                      max="60"
                    />
                    <span className="text-sm text-gray-500">{t.breathsPerMin}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "notes" && (
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold">{t.notes}</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Chief Complaint */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t.chiefComplaint} <span className="text-primary-red">*</span>
                  </label>
                  <textarea
                    value={formData.chief_complaint}
                    onChange={(e) => handleInputChange("chief_complaint", e.target.value)}
                    disabled={isReadOnly}
                    className="w-full p-3 border-2 border-foreground rounded focus:border-primary-blue outline-none resize-none disabled:bg-gray-100"
                    rows={2}
                    placeholder={t.chiefComplaintPlaceholder}
                  />
                </div>

                {/* History of Illness */}
                <div>
                  <label className="block text-sm font-medium mb-1">{t.historyOfIllness}</label>
                  <textarea
                    value={formData.history_of_illness}
                    onChange={(e) => handleInputChange("history_of_illness", e.target.value)}
                    disabled={isReadOnly}
                    className="w-full p-3 border-2 border-foreground rounded focus:border-primary-blue outline-none resize-none disabled:bg-gray-100"
                    rows={4}
                    placeholder={t.historyOfIllnessPlaceholder}
                  />
                </div>

                {/* Past History */}
                <div>
                  <label className="block text-sm font-medium mb-1">{t.pastHistory}</label>
                  <textarea
                    value={formData.past_history}
                    onChange={(e) => handleInputChange("past_history", e.target.value)}
                    disabled={isReadOnly}
                    className="w-full p-3 border-2 border-foreground rounded focus:border-primary-blue outline-none resize-none disabled:bg-gray-100"
                    rows={3}
                    placeholder={t.pastHistoryPlaceholder}
                  />
                </div>

                {/* Examination */}
                <div>
                  <label className="block text-sm font-medium mb-1">{t.examination}</label>
                  <textarea
                    value={formData.examination}
                    onChange={(e) => handleInputChange("examination", e.target.value)}
                    disabled={isReadOnly}
                    className="w-full p-3 border-2 border-foreground rounded focus:border-primary-blue outline-none resize-none disabled:bg-gray-100"
                    rows={4}
                    placeholder={t.examinationPlaceholder}
                  />
                </div>

                {/* Plan */}
                <div>
                  <label className="block text-sm font-medium mb-1">{t.plan}</label>
                  <textarea
                    value={formData.plan}
                    onChange={(e) => handleInputChange("plan", e.target.value)}
                    disabled={isReadOnly}
                    className="w-full p-3 border-2 border-foreground rounded focus:border-primary-blue outline-none resize-none disabled:bg-gray-100"
                    rows={3}
                    placeholder={t.planPlaceholder}
                  />
                </div>

                {/* Follow-up */}
                <div className="max-w-xs">
                  <label className="block text-sm font-medium mb-1">{t.followUp}</label>
                  <input
                    type="date"
                    value={formData.follow_up}
                    onChange={(e) => handleInputChange("follow_up", e.target.value)}
                    disabled={isReadOnly}
                    className="w-full p-2 border-2 border-foreground rounded focus:border-primary-blue outline-none disabled:bg-gray-100"
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "diagnosis" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Search Panel */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold">{t.searchDiagnosis}</h2>
              </CardHeader>
              <CardContent>
                {/* Category filter */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">{t.categories}</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    disabled={isReadOnly}
                    className="w-full p-2 border-2 border-foreground rounded focus:border-primary-blue outline-none disabled:bg-gray-100"
                  >
                    <option value="">{t.allCategories}</option>
                    {icdCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Search input */}
                <div className="relative mb-4">
                  <input
                    type="text"
                    value={icdSearch}
                    onChange={(e) => setIcdSearch(e.target.value)}
                    disabled={isReadOnly}
                    className="w-full p-2 border-2 border-foreground rounded focus:border-primary-blue outline-none disabled:bg-gray-100"
                    placeholder={t.searchDiagnosis}
                  />
                  {searchingIcd && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-primary-blue border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>

                {/* Search results */}
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {icdResults.map((code) => {
                    const isAdded = diagnoses.some((d) => d.icd10_code === code.code);
                    return (
                      <div
                        key={code.code}
                        className={`p-3 border-2 rounded ${
                          isAdded
                            ? "border-gray-300 bg-gray-50"
                            : "border-foreground hover:bg-gray-50 cursor-pointer"
                        }`}
                        onClick={() => !isAdded && !isReadOnly && handleAddDiagnosis(code)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-mono font-bold text-primary-blue">{code.code}</span>
                            <p className="text-sm">{code.description}</p>
                            <p className="text-xs text-gray-500">{code.category}</p>
                          </div>
                          {!isAdded && !isReadOnly && (
                            <button className="text-primary-blue font-medium text-sm hover:underline">
                              {t.addDiagnosis}
                            </button>
                          )}
                          {isAdded && (
                            <span className="text-verified text-sm">Added</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Selected Diagnoses */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">{t.selectedDiagnoses}</h2>
                  <span className="bg-primary-blue text-white px-2 py-1 rounded text-sm">
                    {diagnoses.length}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                {diagnoses.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p>{t.noDiagnoses}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {diagnoses.map((diagnosis) => (
                      <div
                        key={diagnosis.icd10_code}
                        className={`p-3 border-2 rounded ${
                          diagnosis.is_primary
                            ? "border-verified bg-green-50"
                            : "border-foreground"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-primary-blue">
                                {diagnosis.icd10_code}
                              </span>
                              {diagnosis.is_primary && (
                                <span className="bg-verified text-white px-2 py-0.5 rounded text-xs font-medium">
                                  {t.primaryDiagnosis}
                                </span>
                              )}
                            </div>
                            <p className="text-sm mt-1">{diagnosis.description}</p>
                          </div>
                          {!isReadOnly && (
                            <div className="flex flex-col gap-1">
                              {!diagnosis.is_primary && (
                                <button
                                  onClick={() => handleSetPrimary(diagnosis.icd10_code)}
                                  className="text-xs text-primary-blue hover:underline"
                                >
                                  {t.setPrimary}
                                </button>
                              )}
                              <button
                                onClick={() => handleRemoveDiagnosis(diagnosis.icd10_code)}
                                className="text-xs text-primary-red hover:underline"
                              >
                                {t.removeDiagnosis}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "prescription" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Drug Search Panel */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold">{t.addMedication}</h2>
              </CardHeader>
              <CardContent>
                {/* Drug search input */}
                <div className="relative mb-4">
                  <input
                    type="text"
                    value={drugSearch}
                    onChange={(e) => setDrugSearch(e.target.value)}
                    disabled={prescription?.status === "ISSUED"}
                    className="w-full p-2 border-2 border-foreground rounded focus:border-primary-blue outline-none disabled:bg-gray-100"
                    placeholder={t.searchMedication}
                  />
                  {searchingDrugs && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-primary-blue border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>

                {/* Drug search results */}
                {drugResults.length > 0 && !selectedDrug && (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto mb-4">
                    {drugResults.map((drug, idx) => (
                      <div
                        key={`${drug.name}-${idx}`}
                        className="p-3 border-2 border-foreground hover:bg-gray-50 cursor-pointer rounded"
                        onClick={() => {
                          setSelectedDrug(drug);
                          setDrugSearch(drug.name);
                          setDrugResults([]);
                          // Auto-select first strength if available
                          if (drug.strengths.length > 0) {
                            setNewMedication(prev => ({ ...prev, dosage: drug.strengths[0] }));
                          }
                        }}
                      >
                        <div className="font-medium">{drug.name}</div>
                        {drug.generic_name && (
                          <div className="text-sm text-gray-500">{drug.generic_name}</div>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">{drug.category}</span>
                          {drug.source === "pharmacy" && (
                            <span className="text-xs bg-verified text-white px-2 py-0.5 rounded">In Stock</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Selected drug form */}
                {selectedDrug && (
                  <div className="space-y-4 p-4 border-2 border-primary-blue rounded bg-blue-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-lg">{selectedDrug.name}</div>
                        {selectedDrug.generic_name && (
                          <div className="text-sm text-gray-600">{selectedDrug.generic_name}</div>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setSelectedDrug(null);
                          setDrugSearch("");
                          setNewMedication({
                            dosage: "",
                            frequency: "",
                            duration: "",
                            duration_unit: "days",
                            instructions: "",
                          });
                        }}
                        className="text-gray-500 hover:text-primary-red"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* Dosage */}
                    <div>
                      <label className="block text-sm font-medium mb-1">{t.dosage}</label>
                      {selectedDrug.strengths.length > 0 ? (
                        <select
                          value={newMedication.dosage}
                          onChange={(e) => setNewMedication(prev => ({ ...prev, dosage: e.target.value }))}
                          className="w-full p-2 border-2 border-foreground rounded focus:border-primary-blue outline-none"
                        >
                          <option value="">{t.selectDosage}</option>
                          {selectedDrug.strengths.map((strength) => (
                            <option key={strength} value={strength}>{strength}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={newMedication.dosage}
                          onChange={(e) => setNewMedication(prev => ({ ...prev, dosage: e.target.value }))}
                          className="w-full p-2 border-2 border-foreground rounded focus:border-primary-blue outline-none"
                          placeholder="e.g., 500mg"
                        />
                      )}
                    </div>

                    {/* Frequency */}
                    <div>
                      <label className="block text-sm font-medium mb-1">{t.frequency}</label>
                      <select
                        value={newMedication.frequency}
                        onChange={(e) => setNewMedication(prev => ({ ...prev, frequency: e.target.value }))}
                        className="w-full p-2 border-2 border-foreground rounded focus:border-primary-blue outline-none"
                      >
                        <option value="">{t.selectFrequency}</option>
                        {frequencyOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Duration */}
                    <div>
                      <label className="block text-sm font-medium mb-1">{t.duration}</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={newMedication.duration}
                          onChange={(e) => setNewMedication(prev => ({ ...prev, duration: e.target.value }))}
                          className="flex-1 p-2 border-2 border-foreground rounded focus:border-primary-blue outline-none"
                          placeholder={t.enterDuration}
                          min="1"
                        />
                        <select
                          value={newMedication.duration_unit}
                          onChange={(e) => setNewMedication(prev => ({ ...prev, duration_unit: e.target.value }))}
                          className="w-32 p-2 border-2 border-foreground rounded focus:border-primary-blue outline-none"
                        >
                          {durationUnits.map((unit) => (
                            <option key={unit.value} value={unit.value}>{unit.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Calculated Quantity */}
                    {newMedication.frequency && newMedication.duration && (
                      <div className="p-3 bg-primary-yellow/20 rounded border-2 border-primary-yellow">
                        <div className="text-sm font-medium">{t.quantity}: <span className="text-lg font-bold">
                          {calculateQuantity(newMedication.frequency, newMedication.duration, newMedication.duration_unit)}
                        </span></div>
                        <div className="text-xs text-gray-600">{t.autoCalculate}</div>
                      </div>
                    )}

                    {/* Instructions */}
                    <div>
                      <label className="block text-sm font-medium mb-1">{t.medicationInstructions}</label>
                      <input
                        type="text"
                        value={newMedication.instructions}
                        onChange={(e) => setNewMedication(prev => ({ ...prev, instructions: e.target.value }))}
                        className="w-full p-2 border-2 border-foreground rounded focus:border-primary-blue outline-none"
                        placeholder="e.g., Take after meals"
                      />
                    </div>

                    {/* Add button */}
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={handleAddMedication}
                      disabled={!newMedication.dosage || !newMedication.frequency || !newMedication.duration}
                    >
                      {t.addMedication}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Prescription Items Panel */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">{t.medications}</h2>
                  <div className="flex items-center gap-2">
                    <span className="bg-primary-blue text-white px-2 py-1 rounded text-sm">
                      {prescriptionItems.length}
                    </span>
                    {prescription && (
                      <span className={`px-2 py-1 rounded text-sm ${
                        prescription.status === "DRAFT"
                          ? "bg-primary-yellow text-foreground"
                          : "bg-verified text-white"
                      }`}>
                        {prescription.status === "DRAFT" ? t.prescriptionDraft : t.prescriptionIssued2}
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {prescriptionItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    <p>{t.noMedications}</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {prescriptionItems.map((item, idx) => (
                      <div
                        key={item.id}
                        className="p-3 border-2 border-foreground rounded"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-primary-blue">{idx + 1}.</span>
                              <span className="font-bold">{item.drug_name}</span>
                              <span className="text-sm bg-gray-200 px-2 py-0.5 rounded">{item.dosage}</span>
                            </div>
                            {item.generic_name && (
                              <div className="text-sm text-gray-500 ml-5">{item.generic_name}</div>
                            )}
                            <div className="flex items-center gap-4 mt-2 ml-5 text-sm">
                              <span><strong>{item.frequency}</strong></span>
                              <span>{item.duration} {item.duration_unit}</span>
                              <span className="text-primary-blue font-medium">{t.qty}: {item.quantity}</span>
                            </div>
                            {item.instructions && (
                              <div className="mt-1 ml-5 text-sm text-gray-600">
                                ↳ {item.instructions}
                              </div>
                            )}
                          </div>
                          {prescription?.status !== "ISSUED" && (
                            <button
                              onClick={() => handleRemoveMedication(item.id)}
                              className="text-primary-red hover:underline text-sm"
                            >
                              {t.removeMedication}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* General Instructions */}
                <div className="mt-4 pt-4 border-t-2 border-gray-200">
                  <label className="block text-sm font-medium mb-1">{t.generalInstructions}</label>
                  <textarea
                    value={prescriptionInstructions}
                    onChange={(e) => setPrescriptionInstructions(e.target.value)}
                    disabled={prescription?.status === "ISSUED"}
                    className="w-full p-3 border-2 border-foreground rounded focus:border-primary-blue outline-none resize-none disabled:bg-gray-100"
                    rows={3}
                    placeholder={t.generalInstructionsPlaceholder}
                  />
                </div>

                {/* Prescription Actions */}
                <div className="mt-4 flex gap-2">
                  {prescription?.status !== "ISSUED" && (
                    <Button
                      variant="primary"
                      className="flex-1"
                      onClick={handleIssuePrescription}
                      disabled={issuingPrescription || prescriptionItems.length === 0}
                    >
                      {issuingPrescription ? t.issuing : t.issuePrescription}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={handlePrintPrescription}
                    disabled={prescriptionItems.length === 0}
                  >
                    {t.printPrescription}
                  </Button>
                </div>

                {/* Valid until info */}
                {prescription?.status === "ISSUED" && prescription.valid_until && (
                  <div className="mt-4 p-3 bg-verified/10 border-2 border-verified rounded text-sm">
                    <strong>{t.prescriptionValid}:</strong>{" "}
                    {new Date(prescription.valid_until).toLocaleDateString()}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "lab" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lab Test Search Panel */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold">{t.addLabTest}</h2>
              </CardHeader>
              <CardContent>
                {/* Category filter */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">{t.labCategories}</label>
                  <select
                    value={selectedLabCategory}
                    onChange={(e) => setSelectedLabCategory(e.target.value)}
                    className="w-full p-2 border-2 border-foreground rounded focus:border-primary-blue outline-none"
                  >
                    <option value="">{t.labAllCategories}</option>
                    {labCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Search input */}
                <div className="relative mb-4">
                  <input
                    type="text"
                    value={labTestSearch}
                    onChange={(e) => setLabTestSearch(e.target.value)}
                    className="w-full p-2 border-2 border-foreground rounded focus:border-primary-blue outline-none"
                    placeholder={t.searchLabTest}
                  />
                  {searchingLabTests && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-primary-blue border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>

                {/* Search results */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {labTestResults.map((test) => {
                    const isAdded = selectedLabTests.some((t) => t.id === test.id);
                    return (
                      <div
                        key={test.id}
                        className={`p-3 border-2 rounded ${
                          isAdded
                            ? "border-gray-300 bg-gray-50"
                            : "border-foreground hover:bg-gray-50 cursor-pointer"
                        }`}
                        onClick={() => !isAdded && handleAddLabTest(test)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{test.name}</span>
                              {test.short_name && (
                                <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">{test.short_name}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                              {test.category && <span>{test.category}</span>}
                              {test.sample_type && (
                                <span className="text-primary-blue">• {test.sample_type}</span>
                              )}
                            </div>
                            {test.price > 0 && (
                              <div className="text-sm font-medium text-primary-red mt-1">
                                Rs. {test.price}
                              </div>
                            )}
                          </div>
                          {!isAdded && (
                            <button className="text-primary-blue font-medium text-sm hover:underline">
                              {t.addLabTest}
                            </button>
                          )}
                          {isAdded && (
                            <span className="text-verified text-sm">Added</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Selected tests for ordering */}
                {selectedLabTests.length > 0 && (
                  <div className="mt-6 pt-4 border-t-2 border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold">{t.selectedTests}</h3>
                      <span className="bg-primary-blue text-white px-2 py-1 rounded text-sm">
                        {selectedLabTests.length}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      {selectedLabTests.map((test) => (
                        <div
                          key={test.id}
                          className="flex items-center justify-between p-2 bg-blue-50 border-2 border-primary-blue rounded"
                        >
                          <span className="font-medium">{test.name}</span>
                          <button
                            onClick={() => handleRemoveLabTest(test.id)}
                            className="text-primary-red hover:underline text-sm"
                          >
                            {t.removeDiagnosis}
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Priority */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">{t.priority}</label>
                      <select
                        value={labPriority}
                        onChange={(e) => setLabPriority(e.target.value as "ROUTINE" | "URGENT" | "STAT")}
                        className="w-full p-2 border-2 border-foreground rounded focus:border-primary-blue outline-none"
                      >
                        <option value="ROUTINE">{t.routine}</option>
                        <option value="URGENT">{t.urgent}</option>
                        <option value="STAT">{t.stat}</option>
                      </select>
                    </div>

                    {/* Clinical notes */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">{t.labClinicalNotes}</label>
                      <textarea
                        value={labClinicalNotes}
                        onChange={(e) => setLabClinicalNotes(e.target.value)}
                        className="w-full p-2 border-2 border-foreground rounded focus:border-primary-blue outline-none resize-none"
                        rows={2}
                        placeholder="Reason for ordering tests..."
                      />
                    </div>

                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={handleOrderLabTests}
                      disabled={orderingLab || selectedLabTests.length === 0}
                    >
                      {orderingLab ? t.ordering : t.orderLabTests}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Lab Orders Panel */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">{t.labOrders}</h2>
                  <span className="bg-primary-blue text-white px-2 py-1 rounded text-sm">
                    {labOrders.length}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                {labOrders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    <p>{t.noLabOrders}</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {labOrders.map((order) => (
                      <div
                        key={order.id}
                        className="border-2 border-foreground rounded p-4"
                      >
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div>
                            <div className="font-mono font-bold text-lg">{order.order_number}</div>
                            <div className="text-sm text-gray-500">
                              {new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {order.priority !== "ROUTINE" && (
                              <span className={`px-2 py-1 rounded text-xs font-bold ${
                                order.priority === "STAT" ? "bg-primary-red text-white" : "bg-primary-yellow text-foreground"
                              }`}>
                                {order.priority}
                              </span>
                            )}
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getLabStatusColor(order.status)}`}>
                              {getLabStatusLabel(order.status)}
                            </span>
                          </div>
                        </div>

                        {/* Results table */}
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
                                    {result.lab_test.short_name && (
                                      <div className="text-xs text-gray-500">{result.lab_test.short_name}</div>
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

                        {/* Actions */}
                        <div className="flex gap-2 mt-3 pt-3 border-t">
                          {order.status === "COMPLETED" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePrintLabReport(order)}
                            >
                              {t.printReport}
                            </Button>
                          )}
                          <Link href={`/${lang}/clinic/dashboard/lab/${order.id}`}>
                            <Button variant="outline" size="sm">
                              {order.status === "COMPLETED" ? t.viewResults : t.enterResults}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Finalize Confirmation Modal */}
        {showFinalizeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white border-4 border-foreground shadow-[8px_8px_0_0_#121212] p-6 max-w-md mx-4">
              <h3 className="text-xl font-bold mb-4">{t.finalize}</h3>
              <p className="text-gray-600 mb-6">{t.finalizeConfirm}</p>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowFinalizeModal(false)}>
                  {t.cancel}
                </Button>
                <Button variant="primary" onClick={handleFinalize} disabled={finalizing}>
                  {finalizing ? t.finalizing : t.confirm}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
