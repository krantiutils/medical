"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface LabTestOption {
  id: string;
  name: string;
  short_name: string | null;
  category: string | null;
  sample_type: string | null;
  price: string;
}

interface PackageTest {
  id: string;
  lab_test: LabTestOption;
}

interface HealthPackage {
  id: string;
  name: string;
  name_ne: string | null;
  description: string | null;
  description_ne: string | null;
  category: string | null;
  original_price: string;
  price: string;
  discount_percent: string | null;
  preparation: string | null;
  turnaround_hrs: number | null;
  is_active: boolean;
  is_featured: boolean;
  tests: PackageTest[];
  created_at: string;
}

const translations = {
  en: {
    title: "Health Packages",
    subtitle: "Create bundled lab test packages at discounted prices",
    addPackage: "Create Package",
    editPackage: "Edit Package",
    packageName: "Package Name",
    packageNamePlaceholder: "e.g., Full Body Checkup",
    packageNameNe: "Package Name (Nepali)",
    packageNameNePlaceholder: "जस्तै, पूर्ण शरीर जाँच",
    description: "Description",
    descriptionPlaceholder: "Brief description of the package",
    descriptionNe: "Description (Nepali)",
    descriptionNePlaceholder: "प्याकेजको संक्षिप्त विवरण",
    category: "Category",
    categoryPlaceholder: "Select category",
    price: "Package Price (NPR)",
    pricePlaceholder: "0.00",
    originalPrice: "Original Price",
    savings: "Savings",
    discount: "Discount",
    preparation: "Patient Preparation",
    preparationPlaceholder: "e.g., 12-hour fasting required",
    turnaroundHrs: "Turnaround (hours)",
    turnaroundPlaceholder: "e.g., 24",
    selectTests: "Select Lab Tests",
    selectedTests: "Selected Tests",
    searchTests: "Search tests...",
    noTestsSelected: "No tests selected. Add at least one test.",
    active: "Active",
    inactive: "Inactive",
    featured: "Featured",
    save: "Save Package",
    saving: "Saving...",
    cancel: "Cancel",
    delete: "Delete",
    confirmDelete: "Are you sure you want to delete this package?",
    noPackages: "No health packages yet",
    noPackagesMessage: "Create your first health package to offer bundled lab tests at discounted prices.",
    loginRequired: "Please log in to access health packages",
    login: "Login",
    loading: "Loading...",
    errorLoading: "Failed to load data",
    retry: "Retry",
    noClinic: "No Verified Clinic",
    noClinicMessage: "You don't have a verified clinic yet.",
    back: "Back to Dashboard",
    success: "Package saved successfully",
    deleteSuccess: "Package deleted successfully",
    error: "An error occurred",
    filterAll: "All Packages",
    filterActive: "Active",
    filterInactive: "Inactive",
    tests: "tests",
    off: "off",
    required: "Required",
    // Categories
    catFullBody: "Full Body",
    catCardiac: "Cardiac",
    catDiabetes: "Diabetes",
    catThyroid: "Thyroid",
    catLiver: "Liver",
    catKidney: "Kidney",
    catWomensHealth: "Women's Health",
    catMensHealth: "Men's Health",
    catAnemia: "Anemia",
    catInfection: "Infection Screening",
    catFever: "Fever Panel",
    catPregnancy: "Pregnancy",
    catOther: "Other",
    noLabTests: "No lab tests found. Please add lab tests first.",
    setupLabTests: "Setup Lab Tests",
  },
  ne: {
    title: "स्वास्थ्य प्याकेजहरू",
    subtitle: "छुटको मूल्यमा बन्डल गरिएका ल्याब परीक्षण प्याकेजहरू बनाउनुहोस्",
    addPackage: "प्याकेज बनाउनुहोस्",
    editPackage: "प्याकेज सम्पादन",
    packageName: "प्याकेजको नाम",
    packageNamePlaceholder: "जस्तै, पूर्ण शरीर जाँच",
    packageNameNe: "प्याकेजको नाम (नेपाली)",
    packageNameNePlaceholder: "जस्तै, पूर्ण शरीर जाँच",
    description: "विवरण",
    descriptionPlaceholder: "प्याकेजको संक्षिप्त विवरण",
    descriptionNe: "विवरण (नेपाली)",
    descriptionNePlaceholder: "प्याकेजको संक्षिप्त विवरण",
    category: "श्रेणी",
    categoryPlaceholder: "श्रेणी छान्नुहोस्",
    price: "प्याकेज मूल्य (रुपैयाँ)",
    pricePlaceholder: "0.00",
    originalPrice: "मूल मूल्य",
    savings: "बचत",
    discount: "छुट",
    preparation: "बिरामीको तयारी",
    preparationPlaceholder: "जस्तै, १२ घण्टा उपवास आवश्यक",
    turnaroundHrs: "प्रतिफल समय (घण्टा)",
    turnaroundPlaceholder: "जस्तै, २४",
    selectTests: "ल्याब परीक्षणहरू छान्नुहोस्",
    selectedTests: "छानिएका परीक्षणहरू",
    searchTests: "परीक्षणहरू खोज्नुहोस्...",
    noTestsSelected: "कुनै परीक्षण छानिएको छैन। कम्तिमा एउटा थप्नुहोस्।",
    active: "सक्रिय",
    inactive: "निष्क्रिय",
    featured: "विशेष",
    save: "प्याकेज बचत गर्नुहोस्",
    saving: "बचत गर्दै...",
    cancel: "रद्द गर्नुहोस्",
    delete: "हटाउनुहोस्",
    confirmDelete: "के तपाईं यो प्याकेज हटाउन चाहनुहुन्छ?",
    noPackages: "अझै स्वास्थ्य प्याकेजहरू छैनन्",
    noPackagesMessage: "छुटको मूल्यमा बन्डल गरिएका ल्याब परीक्षणहरू प्रस्ताव गर्न पहिलो प्याकेज बनाउनुहोस्।",
    loginRequired: "स्वास्थ्य प्याकेजहरू पहुँच गर्न कृपया लगइन गर्नुहोस्",
    login: "लगइन गर्नुहोस्",
    loading: "लोड हुँदैछ...",
    errorLoading: "डेटा लोड गर्न असफल भयो",
    retry: "पुन: प्रयास गर्नुहोस्",
    noClinic: "कुनै प्रमाणित क्लिनिक छैन",
    noClinicMessage: "तपाईंसँग अझै प्रमाणित क्लिनिक छैन।",
    back: "ड्यासबोर्डमा फर्कनुहोस्",
    success: "प्याकेज सफलतापूर्वक बचत भयो",
    deleteSuccess: "प्याकेज सफलतापूर्वक हटाइयो",
    error: "त्रुटि भयो",
    filterAll: "सबै प्याकेजहरू",
    filterActive: "सक्रिय",
    filterInactive: "निष्क्रिय",
    tests: "परीक्षणहरू",
    off: "छुट",
    required: "आवश्यक",
    catFullBody: "पूर्ण शरीर",
    catCardiac: "हृदय",
    catDiabetes: "मधुमेह",
    catThyroid: "थाइरोइड",
    catLiver: "कलेजो",
    catKidney: "मिर्गौला",
    catWomensHealth: "महिला स्वास्थ्य",
    catMensHealth: "पुरुष स्वास्थ्य",
    catAnemia: "रक्तअल्पता",
    catInfection: "संक्रमण जाँच",
    catFever: "ज्वरो प्यानल",
    catPregnancy: "गर्भावस्था",
    catOther: "अन्य",
    noLabTests: "कुनै ल्याब परीक्षण फेला परेन। कृपया पहिले ल्याब परीक्षणहरू थप्नुहोस्।",
    setupLabTests: "ल्याब परीक्षण सेटअप",
  },
};

const PACKAGE_CATEGORIES = [
  { value: "Full Body", key: "catFullBody" },
  { value: "Cardiac", key: "catCardiac" },
  { value: "Diabetes", key: "catDiabetes" },
  { value: "Thyroid", key: "catThyroid" },
  { value: "Liver", key: "catLiver" },
  { value: "Kidney", key: "catKidney" },
  { value: "Women's Health", key: "catWomensHealth" },
  { value: "Men's Health", key: "catMensHealth" },
  { value: "Anemia", key: "catAnemia" },
  { value: "Infection Screening", key: "catInfection" },
  { value: "Fever Panel", key: "catFever" },
  { value: "Pregnancy", key: "catPregnancy" },
  { value: "Other", key: "catOther" },
];

export default function HealthPackagesPage() {
  const { data: session, status } = useSession();
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en";
  const t = translations[lang as keyof typeof translations] || translations.en;

  // Data state
  const [packages, setPackages] = useState<HealthPackage[]>([]);
  const [labTests, setLabTests] = useState<LabTestOption[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [noClinic, setNoClinic] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Filter state
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingPackage, setEditingPackage] = useState<HealthPackage | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    name_ne: "",
    description: "",
    description_ne: "",
    category: "",
    price: "",
    preparation: "",
    turnaround_hrs: "",
    is_active: true,
    is_featured: false,
  });
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);
  const [testSearch, setTestSearch] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Fetch packages
  const fetchPackages = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNoClinic(false);

    try {
      const response = await fetch("/api/clinic/health-packages");

      if (response.status === 404) {
        const data = await response.json();
        if (data.code === "NO_CLINIC") {
          setNoClinic(true);
          return;
        }
      }

      if (!response.ok) {
        throw new Error("Failed to fetch packages");
      }

      const data = await response.json();
      setPackages(data.packages || []);
    } catch (err) {
      console.error("Error fetching packages:", err);
      setError(t.errorLoading);
    } finally {
      setLoading(false);
    }
  }, [t.errorLoading]);

  // Fetch lab tests for the test picker
  const fetchLabTests = useCallback(async () => {
    try {
      const response = await fetch("/api/clinic/lab-tests");
      if (response.ok) {
        const data = await response.json();
        setLabTests(data.tests || []);
      }
    } catch (err) {
      console.error("Error fetching lab tests:", err);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchPackages();
      fetchLabTests();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, fetchPackages, fetchLabTests]);

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      name_ne: "",
      description: "",
      description_ne: "",
      category: "",
      price: "",
      preparation: "",
      turnaround_hrs: "",
      is_active: true,
      is_featured: false,
    });
    setSelectedTestIds([]);
    setFormErrors({});
    setEditingPackage(null);
    setShowForm(false);
    setTestSearch("");
  };

  // Handle edit
  const handleEdit = (pkg: HealthPackage) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      name_ne: pkg.name_ne || "",
      description: pkg.description || "",
      description_ne: pkg.description_ne || "",
      category: pkg.category || "",
      price: pkg.price,
      preparation: pkg.preparation || "",
      turnaround_hrs: pkg.turnaround_hrs?.toString() || "",
      is_active: pkg.is_active,
      is_featured: pkg.is_featured,
    });
    setSelectedTestIds(pkg.tests.map((pt) => pt.lab_test.id));
    setFormErrors({});
    setShowForm(true);
  };

  // Calculate original price from selected tests
  const calculatedOriginalPrice = selectedTestIds.reduce((sum, testId) => {
    const test = labTests.find((t) => t.id === testId);
    return sum + (test ? Number(test.price) : 0);
  }, 0);

  const packagePrice = Number(formData.price) || 0;
  const savingsAmount = calculatedOriginalPrice - packagePrice;
  const discountPercent =
    calculatedOriginalPrice > 0
      ? Math.round(((calculatedOriginalPrice - packagePrice) / calculatedOriginalPrice) * 100)
      : 0;

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = t.required;
    }

    if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) < 0) {
      errors.price = t.required;
    }

    if (selectedTestIds.length === 0) {
      errors.tests = t.noTestsSelected;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const url = editingPackage
        ? `/api/clinic/health-packages/${editingPackage.id}`
        : "/api/clinic/health-packages";

      const response = await fetch(url, {
        method: editingPackage ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          name_ne: formData.name_ne.trim() || null,
          description: formData.description.trim() || null,
          description_ne: formData.description_ne.trim() || null,
          category: formData.category || null,
          price: Number(formData.price),
          preparation: formData.preparation.trim() || null,
          turnaround_hrs: formData.turnaround_hrs || null,
          is_active: formData.is_active,
          is_featured: formData.is_featured,
          test_ids: selectedTestIds,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save package");
      }

      setMessage({ type: "success", text: t.success });
      resetForm();
      fetchPackages();
    } catch (err) {
      console.error("Error saving package:", err);
      setMessage({ type: "error", text: err instanceof Error ? err.message : t.error });
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async (pkg: HealthPackage) => {
    if (!confirm(t.confirmDelete)) {
      return;
    }

    setMessage(null);

    try {
      const response = await fetch(`/api/clinic/health-packages/${pkg.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete package");
      }

      setMessage({ type: "success", text: t.deleteSuccess });
      fetchPackages();
    } catch (err) {
      console.error("Error deleting package:", err);
      setMessage({ type: "error", text: t.error });
    }
  };

  // Toggle test selection
  const toggleTest = (testId: string) => {
    setSelectedTestIds((prev) =>
      prev.includes(testId)
        ? prev.filter((id) => id !== testId)
        : [...prev, testId]
    );
  };

  // Filter packages
  const filteredPackages = packages.filter((pkg) => {
    if (filter === "active") return pkg.is_active;
    if (filter === "inactive") return !pkg.is_active;
    return true;
  });

  // Group packages by category
  const groupedPackages = filteredPackages.reduce((acc, pkg) => {
    const category = pkg.category || t.catOther;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(pkg);
    return acc;
  }, {} as Record<string, HealthPackage[]>);

  // Filter lab tests for the picker
  const filteredLabTests = testSearch
    ? labTests.filter(
        (test) =>
          test.name.toLowerCase().includes(testSearch.toLowerCase()) ||
          (test.short_name && test.short_name.toLowerCase().includes(testSearch.toLowerCase())) ||
          (test.category && test.category.toLowerCase().includes(testSearch.toLowerCase()))
      )
    : labTests;

  // Group lab tests by category for the picker
  const groupedLabTests = filteredLabTests.reduce((acc, test) => {
    const category = test.category || "Other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(test);
    return acc;
  }, {} as Record<string, LabTestOption[]>);

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
              <h1 className="text-3xl font-bold text-foreground">{t.title}</h1>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/70 mb-6">{t.loginRequired}</p>
              <Link href={`/${lang}/login?callbackUrl=/${lang}/clinic/dashboard/packages`}>
                <Button variant="primary">{t.login}</Button>
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
              <Button variant="primary" onClick={fetchPackages}>
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
      <div className="max-w-6xl mx-auto">
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
            {labTests.length > 0 ? (
              <Button
                variant="primary"
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
              >
                {t.addPackage}
              </Button>
            ) : (
              <Link href={`/${lang}/clinic/dashboard/lab`}>
                <Button variant="primary">{t.setupLabTests}</Button>
              </Link>
            )}
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 border-2 ${
              message.type === "success"
                ? "bg-verified/10 border-verified text-verified"
                : "bg-primary-red/10 border-primary-red text-primary-red"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <h2 className="text-xl font-bold">
                  {editingPackage ? t.editPackage : t.addPackage}
                </h2>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSave} className="space-y-4">
                  {/* Package Name */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold uppercase tracking-wider text-foreground/60 mb-2">
                        {t.packageName} <span className="text-primary-red">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => {
                          setFormData({ ...formData, name: e.target.value });
                          if (formErrors.name) setFormErrors({ ...formErrors, name: "" });
                        }}
                        placeholder={t.packageNamePlaceholder}
                        className={`w-full p-3 border-4 ${
                          formErrors.name ? "border-primary-red" : "border-foreground"
                        } bg-white text-foreground font-medium focus:outline-none focus:border-primary-blue transition-colors`}
                      />
                      {formErrors.name && (
                        <p className="mt-1 text-sm text-primary-red">{formErrors.name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-bold uppercase tracking-wider text-foreground/60 mb-2">
                        {t.packageNameNe}
                      </label>
                      <input
                        type="text"
                        value={formData.name_ne}
                        onChange={(e) => setFormData({ ...formData, name_ne: e.target.value })}
                        placeholder={t.packageNameNePlaceholder}
                        className="w-full p-3 border-4 border-foreground bg-white text-foreground font-medium focus:outline-none focus:border-primary-blue transition-colors"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold uppercase tracking-wider text-foreground/60 mb-2">
                        {t.description}
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder={t.descriptionPlaceholder}
                        rows={2}
                        className="w-full p-3 border-4 border-foreground bg-white text-foreground font-medium focus:outline-none focus:border-primary-blue transition-colors resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold uppercase tracking-wider text-foreground/60 mb-2">
                        {t.descriptionNe}
                      </label>
                      <textarea
                        value={formData.description_ne}
                        onChange={(e) => setFormData({ ...formData, description_ne: e.target.value })}
                        placeholder={t.descriptionNePlaceholder}
                        rows={2}
                        className="w-full p-3 border-4 border-foreground bg-white text-foreground font-medium focus:outline-none focus:border-primary-blue transition-colors resize-none"
                      />
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-wider text-foreground/60 mb-2">
                      {t.category}
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full p-3 border-4 border-foreground bg-white text-foreground font-medium focus:outline-none focus:border-primary-blue transition-colors"
                    >
                      <option value="">{t.categoryPlaceholder}</option>
                      {PACKAGE_CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {t[cat.key as keyof typeof t] || cat.value}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Lab Test Selection */}
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-wider text-foreground/60 mb-2">
                      {t.selectTests} <span className="text-primary-red">*</span>
                    </label>
                    <input
                      type="text"
                      value={testSearch}
                      onChange={(e) => setTestSearch(e.target.value)}
                      placeholder={t.searchTests}
                      className="w-full p-3 border-4 border-foreground bg-white text-foreground font-medium focus:outline-none focus:border-primary-blue transition-colors mb-3"
                    />
                    {formErrors.tests && (
                      <p className="mb-2 text-sm text-primary-red">{formErrors.tests}</p>
                    )}

                    {/* Selected tests display */}
                    {selectedTestIds.length > 0 && (
                      <div className="mb-3 p-3 bg-primary-blue/5 border-2 border-primary-blue/20">
                        <div className="text-xs font-bold uppercase tracking-wider text-primary-blue mb-2">
                          {t.selectedTests} ({selectedTestIds.length})
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedTestIds.map((testId) => {
                            const test = labTests.find((t) => t.id === testId);
                            if (!test) return null;
                            return (
                              <button
                                key={testId}
                                type="button"
                                onClick={() => toggleTest(testId)}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-primary-blue text-white text-sm font-medium hover:bg-primary-blue/80 transition-colors"
                              >
                                {test.short_name || test.name}
                                <span className="text-white/70">NPR {Number(test.price).toLocaleString()}</span>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Test picker */}
                    <div className="max-h-48 overflow-y-auto border-4 border-foreground bg-white">
                      {Object.entries(groupedLabTests).map(([category, tests]) => (
                        <div key={category}>
                          <div className="px-3 py-1 bg-foreground/5 text-xs font-bold uppercase tracking-wider text-foreground/60 sticky top-0">
                            {category}
                          </div>
                          {tests.map((test) => (
                            <button
                              key={test.id}
                              type="button"
                              onClick={() => {
                                toggleTest(test.id);
                                if (formErrors.tests) setFormErrors({ ...formErrors, tests: "" });
                              }}
                              className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-primary-blue/5 transition-colors ${
                                selectedTestIds.includes(test.id) ? "bg-primary-blue/10" : ""
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <span
                                  className={`w-4 h-4 border-2 flex items-center justify-center flex-shrink-0 ${
                                    selectedTestIds.includes(test.id)
                                      ? "border-primary-blue bg-primary-blue"
                                      : "border-foreground/40"
                                  }`}
                                >
                                  {selectedTestIds.includes(test.id) && (
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </span>
                                <span className="font-medium">{test.short_name || test.name}</span>
                                {test.short_name && (
                                  <span className="text-foreground/50 text-xs">{test.name}</span>
                                )}
                              </span>
                              <span className="text-foreground/60 text-xs font-mono">
                                NPR {Number(test.price).toLocaleString()}
                              </span>
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Price with savings calculator */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold uppercase tracking-wider text-foreground/60 mb-2">
                        {t.price} <span className="text-primary-red">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/60 font-bold">
                          NPR
                        </span>
                        <input
                          type="number"
                          value={formData.price}
                          onChange={(e) => {
                            setFormData({ ...formData, price: e.target.value });
                            if (formErrors.price) setFormErrors({ ...formErrors, price: "" });
                          }}
                          placeholder={t.pricePlaceholder}
                          min="0"
                          step="0.01"
                          className={`w-full p-3 pl-14 border-4 ${
                            formErrors.price ? "border-primary-red" : "border-foreground"
                          } bg-white text-foreground font-medium focus:outline-none focus:border-primary-blue transition-colors`}
                        />
                      </div>
                      {formErrors.price && (
                        <p className="mt-1 text-sm text-primary-red">{formErrors.price}</p>
                      )}
                    </div>
                    <div className="flex flex-col justify-center space-y-1">
                      {selectedTestIds.length > 0 && (
                        <>
                          <div className="text-sm text-foreground/60">
                            {t.originalPrice}: <span className="font-mono font-bold line-through">NPR {calculatedOriginalPrice.toLocaleString()}</span>
                          </div>
                          {savingsAmount > 0 && (
                            <div className="text-sm text-verified font-bold">
                              {t.savings}: NPR {savingsAmount.toLocaleString()} ({discountPercent}% {t.off})
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Preparation & Turnaround */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold uppercase tracking-wider text-foreground/60 mb-2">
                        {t.preparation}
                      </label>
                      <input
                        type="text"
                        value={formData.preparation}
                        onChange={(e) => setFormData({ ...formData, preparation: e.target.value })}
                        placeholder={t.preparationPlaceholder}
                        className="w-full p-3 border-4 border-foreground bg-white text-foreground font-medium focus:outline-none focus:border-primary-blue transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold uppercase tracking-wider text-foreground/60 mb-2">
                        {t.turnaroundHrs}
                      </label>
                      <input
                        type="number"
                        value={formData.turnaround_hrs}
                        onChange={(e) => setFormData({ ...formData, turnaround_hrs: e.target.value })}
                        placeholder={t.turnaroundPlaceholder}
                        min="1"
                        className="w-full p-3 border-4 border-foreground bg-white text-foreground font-medium focus:outline-none focus:border-primary-blue transition-colors"
                      />
                    </div>
                  </div>

                  {/* Active & Featured */}
                  <div className="flex gap-6">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="is_active"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="w-5 h-5 border-2 border-foreground"
                      />
                      <label htmlFor="is_active" className="text-foreground font-medium">
                        {formData.is_active ? t.active : t.inactive}
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="is_featured"
                        checked={formData.is_featured}
                        onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                        className="w-5 h-5 border-2 border-foreground"
                      />
                      <label htmlFor="is_featured" className="text-foreground font-medium">
                        {t.featured}
                      </label>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-4 pt-4">
                    <Button type="submit" variant="primary" disabled={saving} className="flex-1">
                      {saving ? t.saving : t.save}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                      {t.cancel}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* No lab tests warning */}
        {labTests.length === 0 && packages.length === 0 && (
          <Card decorator="yellow" decoratorPosition="top-left">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 bg-primary-yellow/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-primary-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">{t.noLabTests}</h3>
              <Link href={`/${lang}/clinic/dashboard/lab`}>
                <Button variant="primary" className="mt-4">{t.setupLabTests}</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Filter Tabs */}
        {(packages.length > 0 || labTests.length > 0) && (
          <div className="flex gap-2 mb-6 overflow-x-auto">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 font-bold uppercase tracking-wider text-sm border-2 border-foreground transition-colors ${
                filter === "all"
                  ? "bg-foreground text-white"
                  : "bg-white text-foreground hover:bg-foreground/5"
              }`}
            >
              {t.filterAll} ({packages.length})
            </button>
            <button
              onClick={() => setFilter("active")}
              className={`px-4 py-2 font-bold uppercase tracking-wider text-sm border-2 border-foreground transition-colors ${
                filter === "active"
                  ? "bg-verified text-white"
                  : "bg-white text-foreground hover:bg-foreground/5"
              }`}
            >
              {t.filterActive} ({packages.filter((p) => p.is_active).length})
            </button>
            <button
              onClick={() => setFilter("inactive")}
              className={`px-4 py-2 font-bold uppercase tracking-wider text-sm border-2 border-foreground transition-colors ${
                filter === "inactive"
                  ? "bg-foreground/50 text-white"
                  : "bg-white text-foreground hover:bg-foreground/5"
              }`}
            >
              {t.filterInactive} ({packages.filter((p) => !p.is_active).length})
            </button>
          </div>
        )}

        {/* Packages List */}
        {packages.length === 0 && labTests.length > 0 ? (
          <Card decorator="yellow" decoratorPosition="top-left">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 bg-primary-yellow/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-primary-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">{t.noPackages}</h3>
              <p className="text-foreground/60 mb-6">{t.noPackagesMessage}</p>
              <Button
                variant="primary"
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
              >
                {t.addPackage}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedPackages).map(([category, categoryPackages]) => (
              <div key={category}>
                <h2 className="text-lg font-bold uppercase tracking-wider text-foreground/60 mb-4 flex items-center gap-2">
                  <span className="w-3 h-3 bg-primary-blue" />
                  {category}
                  <span className="text-foreground/40">({categoryPackages.length})</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryPackages.map((pkg) => (
                    <Card
                      key={pkg.id}
                      className={`hover:-translate-y-1 transition-transform ${
                        !pkg.is_active ? "opacity-60" : ""
                      }`}
                    >
                      <CardContent className="py-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-bold text-lg text-foreground">{pkg.name}</h3>
                          <div className="flex gap-1 flex-shrink-0">
                            {pkg.is_featured && (
                              <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider bg-primary-yellow/20 text-primary-yellow">
                                {t.featured}
                              </span>
                            )}
                            <span
                              className={`px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${
                                pkg.is_active
                                  ? "bg-verified/20 text-verified"
                                  : "bg-foreground/10 text-foreground/50"
                              }`}
                            >
                              {pkg.is_active ? t.active : t.inactive}
                            </span>
                          </div>
                        </div>

                        {pkg.description && (
                          <p className="text-sm text-foreground/60 mb-3 line-clamp-2">{pkg.description}</p>
                        )}

                        {/* Tests list */}
                        <div className="flex flex-wrap gap-1 mb-3">
                          {pkg.tests.map((pt) => (
                            <span
                              key={pt.id}
                              className="px-2 py-0.5 bg-foreground/5 border border-foreground/20 text-xs font-medium"
                            >
                              {pt.lab_test.short_name || pt.lab_test.name}
                            </span>
                          ))}
                        </div>

                        {/* Pricing */}
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-2xl font-black text-primary-blue">
                            NPR {Number(pkg.price).toLocaleString()}
                          </span>
                          {Number(pkg.original_price) > Number(pkg.price) && (
                            <span className="text-sm text-foreground/50 line-through font-mono">
                              NPR {Number(pkg.original_price).toLocaleString()}
                            </span>
                          )}
                        </div>
                        {pkg.discount_percent && Number(pkg.discount_percent) > 0 && (
                          <div className="text-sm text-verified font-bold mb-3">
                            {Number(pkg.discount_percent).toFixed(0)}% {t.off} &middot; {pkg.tests.length} {t.tests}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 pt-3 border-t border-foreground/10">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(pkg)}
                            className="flex-1"
                          >
                            {t.editPackage}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(pkg)}
                            className="text-primary-red hover:bg-primary-red/10"
                          >
                            {t.delete}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
