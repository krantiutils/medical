"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: string; // Decimal comes as string from API
  category: string | null;
  is_active: boolean;
}

// Translations
const translations = {
  en: {
    title: "Services",
    subtitle: "Manage your clinic's services and pricing",
    addService: "Add Service",
    editService: "Edit Service",
    serviceName: "Service Name",
    serviceNamePlaceholder: "e.g., Consultation, X-Ray",
    description: "Description",
    descriptionPlaceholder: "Optional description",
    price: "Price (NPR)",
    pricePlaceholder: "0.00",
    category: "Category",
    categoryPlaceholder: "e.g., Consultation, Test, Procedure",
    active: "Active",
    inactive: "Inactive",
    save: "Save",
    saving: "Saving...",
    cancel: "Cancel",
    delete: "Delete",
    confirmDelete: "Are you sure you want to delete this service?",
    noServices: "No services yet",
    noServicesMessage: "Add your first service to get started with billing.",
    loginRequired: "Please log in to access services",
    login: "Login",
    loading: "Loading...",
    errorLoading: "Failed to load data",
    retry: "Retry",
    noClinic: "No Verified Clinic",
    noClinicMessage: "You don't have a verified clinic yet.",
    back: "Back to Dashboard",
    success: "Service saved successfully",
    deleteSuccess: "Service deleted successfully",
    error: "An error occurred",
    filterActive: "Active",
    filterInactive: "Inactive",
    filterAll: "All Services",
    actions: "Actions",
    required: "Required",
    consultation: "Consultation",
    test: "Test",
    procedure: "Procedure",
    medication: "Medication",
    other: "Other",
  },
  ne: {
    title: "सेवाहरू",
    subtitle: "तपाईंको क्लिनिकका सेवाहरू र मूल्य व्यवस्थापन गर्नुहोस्",
    addService: "सेवा थप्नुहोस्",
    editService: "सेवा सम्पादन गर्नुहोस्",
    serviceName: "सेवाको नाम",
    serviceNamePlaceholder: "जस्तै, परामर्श, एक्स-रे",
    description: "विवरण",
    descriptionPlaceholder: "वैकल्पिक विवरण",
    price: "मूल्य (रुपैयाँ)",
    pricePlaceholder: "0.00",
    category: "श्रेणी",
    categoryPlaceholder: "जस्तै, परामर्श, परीक्षण, प्रक्रिया",
    active: "सक्रिय",
    inactive: "निष्क्रिय",
    save: "बचत गर्नुहोस्",
    saving: "बचत गर्दै...",
    cancel: "रद्द गर्नुहोस्",
    delete: "हटाउनुहोस्",
    confirmDelete: "के तपाईं यो सेवा हटाउन चाहनुहुन्छ?",
    noServices: "अझै सेवाहरू छैनन्",
    noServicesMessage: "बिलिङ सुरु गर्न आफ्नो पहिलो सेवा थप्नुहोस्।",
    loginRequired: "सेवाहरू पहुँच गर्न कृपया लगइन गर्नुहोस्",
    login: "लगइन गर्नुहोस्",
    loading: "लोड हुँदैछ...",
    errorLoading: "डेटा लोड गर्न असफल भयो",
    retry: "पुन: प्रयास गर्नुहोस्",
    noClinic: "कुनै प्रमाणित क्लिनिक छैन",
    noClinicMessage: "तपाईंसँग अझै प्रमाणित क्लिनिक छैन।",
    back: "ड्यासबोर्डमा फर्कनुहोस्",
    success: "सेवा सफलतापूर्वक बचत भयो",
    deleteSuccess: "सेवा सफलतापूर्वक हटाइयो",
    error: "त्रुटि भयो",
    filterActive: "सक्रिय",
    filterInactive: "निष्क्रिय",
    filterAll: "सबै सेवाहरू",
    actions: "कार्यहरू",
    required: "आवश्यक",
    consultation: "परामर्श",
    test: "परीक्षण",
    procedure: "प्रक्रिया",
    medication: "औषधि",
    other: "अन्य",
  },
};

const SERVICE_CATEGORIES = [
  { value: "Consultation", label: { en: "Consultation", ne: "परामर्श" } },
  { value: "Test", label: { en: "Test", ne: "परीक्षण" } },
  { value: "Procedure", label: { en: "Procedure", ne: "प्रक्रिया" } },
  { value: "Medication", label: { en: "Medication", ne: "औषधि" } },
  { value: "Other", label: { en: "Other", ne: "अन्य" } },
];

export default function ServicesPage() {
  const { data: session, status } = useSession();
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en";
  const t = translations[lang as keyof typeof translations] || translations.en;

  // Data state
  const [services, setServices] = useState<Service[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noClinic, setNoClinic] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Filter state
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNoClinic(false);

    try {
      const response = await fetch("/api/clinic/services");

      if (response.status === 404) {
        const data = await response.json();
        if (data.code === "NO_CLINIC") {
          setNoClinic(true);
          return;
        }
      }

      if (!response.ok) {
        throw new Error("Failed to fetch services");
      }

      const data = await response.json();
      setServices(data.services || []);
    } catch (err) {
      console.error("Error fetching services:", err);
      setError(t.errorLoading);
    } finally {
      setLoading(false);
    }
  }, [t.errorLoading]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchServices();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, fetchServices]);

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "",
      is_active: true,
    });
    setFormErrors({});
    setEditingService(null);
    setShowForm(false);
  };

  // Handle edit click
  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || "",
      price: service.price,
      category: service.category || "",
      is_active: service.is_active,
    });
    setFormErrors({});
    setShowForm(true);
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = t.required;
    }

    if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) < 0) {
      errors.price = t.required;
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
      const url = editingService
        ? `/api/clinic/services/${editingService.id}`
        : "/api/clinic/services";

      const response = await fetch(url, {
        method: editingService ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          price: Number(formData.price),
          category: formData.category || null,
          is_active: formData.is_active,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save service");
      }

      setMessage({ type: "success", text: t.success });
      resetForm();
      fetchServices();
    } catch (err) {
      console.error("Error saving service:", err);
      setMessage({ type: "error", text: err instanceof Error ? err.message : t.error });
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async (service: Service) => {
    if (!confirm(t.confirmDelete)) {
      return;
    }

    setMessage(null);

    try {
      const response = await fetch(`/api/clinic/services/${service.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete service");
      }

      setMessage({ type: "success", text: t.deleteSuccess });
      fetchServices();
    } catch (err) {
      console.error("Error deleting service:", err);
      setMessage({ type: "error", text: t.error });
    }
  };

  // Filter services
  const filteredServices = services.filter((service) => {
    if (filter === "active") return service.is_active;
    if (filter === "inactive") return !service.is_active;
    return true;
  });

  // Group services by category
  const groupedServices = filteredServices.reduce((acc, service) => {
    const category = service.category || t.other;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

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
              <Link href={`/${lang}/login?callbackUrl=/${lang}/clinic/dashboard/services`}>
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
              <Button variant="primary" onClick={fetchServices}>
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
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              {t.back}
            </Link>
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground">{t.title}</h1>
            <p className="text-foreground/60">{t.subtitle}</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button
              variant="primary"
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
            >
              {t.addService}
            </Button>
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
            <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <h2 className="text-xl font-bold">
                  {editingService ? t.editService : t.addService}
                </h2>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSave} className="space-y-4">
                  {/* Service Name */}
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-wider text-foreground/60 mb-2">
                      {t.serviceName} <span className="text-primary-red">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (formErrors.name) setFormErrors({ ...formErrors, name: "" });
                      }}
                      placeholder={t.serviceNamePlaceholder}
                      className={`w-full p-3 border-4 ${
                        formErrors.name ? "border-primary-red" : "border-foreground"
                      } bg-white text-foreground font-medium focus:outline-none focus:border-primary-blue transition-colors`}
                    />
                    {formErrors.name && (
                      <p className="mt-1 text-sm text-primary-red">{formErrors.name}</p>
                    )}
                  </div>

                  {/* Description */}
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

                  {/* Price */}
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
                      {SERVICE_CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label[lang as keyof typeof cat.label] || cat.label.en}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Active Status */}
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

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 font-bold uppercase tracking-wider text-sm border-2 border-foreground transition-colors ${
              filter === "all"
                ? "bg-foreground text-white"
                : "bg-white text-foreground hover:bg-foreground/5"
            }`}
          >
            {t.filterAll} ({services.length})
          </button>
          <button
            onClick={() => setFilter("active")}
            className={`px-4 py-2 font-bold uppercase tracking-wider text-sm border-2 border-foreground transition-colors ${
              filter === "active"
                ? "bg-verified text-white"
                : "bg-white text-foreground hover:bg-foreground/5"
            }`}
          >
            {t.filterActive} ({services.filter((s) => s.is_active).length})
          </button>
          <button
            onClick={() => setFilter("inactive")}
            className={`px-4 py-2 font-bold uppercase tracking-wider text-sm border-2 border-foreground transition-colors ${
              filter === "inactive"
                ? "bg-foreground/50 text-white"
                : "bg-white text-foreground hover:bg-foreground/5"
            }`}
          >
            {t.filterInactive} ({services.filter((s) => !s.is_active).length})
          </button>
        </div>

        {/* Services List */}
        {services.length === 0 ? (
          <Card decorator="yellow" decoratorPosition="top-left">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 bg-primary-yellow/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-primary-yellow"
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
              <h3 className="text-xl font-bold text-foreground mb-2">{t.noServices}</h3>
              <p className="text-foreground/60 mb-6">{t.noServicesMessage}</p>
              <Button
                variant="primary"
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
              >
                {t.addService}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedServices).map(([category, categoryServices]) => (
              <div key={category}>
                <h2 className="text-lg font-bold uppercase tracking-wider text-foreground/60 mb-4 flex items-center gap-2">
                  <span className="w-3 h-3 bg-primary-blue" />
                  {category}
                  <span className="text-foreground/40">({categoryServices.length})</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryServices.map((service) => (
                    <Card
                      key={service.id}
                      className={`hover:-translate-y-1 transition-transform ${
                        !service.is_active ? "opacity-60" : ""
                      }`}
                    >
                      <CardContent className="py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-lg text-foreground truncate">
                              {service.name}
                            </h3>
                            {service.description && (
                              <p className="text-sm text-foreground/60 mt-1 line-clamp-2">
                                {service.description}
                              </p>
                            )}
                            <p className="text-2xl font-black text-primary-blue mt-2">
                              NPR {Number(service.price).toLocaleString("en-NP")}
                            </p>
                          </div>
                          <span
                            className={`flex-shrink-0 px-2 py-1 text-xs font-bold uppercase tracking-wider ${
                              service.is_active
                                ? "bg-verified/20 text-verified"
                                : "bg-foreground/10 text-foreground/50"
                            }`}
                          >
                            {service.is_active ? t.active : t.inactive}
                          </span>
                        </div>
                        <div className="flex gap-2 mt-4 pt-4 border-t border-foreground/10">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(service)}
                            className="flex-1"
                          >
                            {t.editService}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(service)}
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
