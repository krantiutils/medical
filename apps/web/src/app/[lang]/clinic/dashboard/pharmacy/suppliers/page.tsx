"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Supplier {
  id: string;
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  gstin: string | null;
  pan_number: string | null;
  payment_terms: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  _count: {
    products: number;
    batches: number;
  };
}

export default function PharmacySuppliersPage() {
  const { data: session, status } = useSession();
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en";

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noClinic, setNoClinic] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActive, setFilterActive] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    contact_name: "",
    phone: "",
    email: "",
    address: "",
    gstin: "",
    pan_number: "",
    payment_terms: "",
    notes: "",
  });

  // Translations
  const t = {
    en: {
      title: "Suppliers",
      subtitle: "Manage your pharmacy suppliers and vendors",
      backToProducts: "Back to Products",
      addSupplier: "Add Supplier",
      searchPlaceholder: "Search by name, contact, or phone...",
      search: "Search",
      filterByStatus: "Status",
      allStatuses: "All",
      active: "Active",
      inactive: "Inactive",
      noSuppliers: "No suppliers found",
      noSuppliersMessage: "Add your first supplier to start managing inventory.",
      noResults: "No matching suppliers",
      noResultsMessage: "Try adjusting your search or filters.",
      name: "Supplier Name",
      contactName: "Contact Person",
      phone: "Phone",
      email: "Email",
      address: "Address",
      gstin: "GSTIN/VAT Number",
      panNumber: "PAN Number",
      paymentTerms: "Payment Terms",
      notes: "Notes",
      products: "Products",
      batches: "Batches",
      edit: "Edit",
      delete: "Delete",
      deactivate: "Deactivate",
      activate: "Activate",
      deleteConfirm: "Are you sure you want to delete this supplier?",
      cannotDelete: "Cannot delete supplier with associated products or inventory",
      save: "Save",
      saving: "Saving...",
      cancel: "Cancel",
      addNewSupplier: "Add New Supplier",
      editSupplier: "Edit Supplier",
      required: "Required",
      optional: "Optional",
      loginRequired: "Please log in to manage suppliers",
      login: "Login",
      noClinic: "No Verified Clinic",
      noClinicMessage: "You don't have a verified clinic yet.",
      registerClinic: "Register Clinic",
      loading: "Loading...",
      errorLoading: "Failed to load suppliers",
      retry: "Retry",
      addedOn: "Added",
      paymentTermsPlaceholder: "e.g., Net 30, COD",
    },
    ne: {
      title: "आपूर्तिकर्ताहरू",
      subtitle: "तपाईंको फार्मेसी आपूर्तिकर्ताहरू र विक्रेताहरू व्यवस्थापन गर्नुहोस्",
      backToProducts: "उत्पादनहरूमा फर्कनुहोस्",
      addSupplier: "आपूर्तिकर्ता थप्नुहोस्",
      searchPlaceholder: "नाम, सम्पर्क, वा फोनद्वारा खोज्नुहोस्...",
      search: "खोज्नुहोस्",
      filterByStatus: "स्थिति",
      allStatuses: "सबै",
      active: "सक्रिय",
      inactive: "निष्क्रिय",
      noSuppliers: "कुनै आपूर्तिकर्ता फेला परेन",
      noSuppliersMessage: "इन्भेन्टरी व्यवस्थापन सुरु गर्न आफ्नो पहिलो आपूर्तिकर्ता थप्नुहोस्।",
      noResults: "कुनै मिल्दो आपूर्तिकर्ता छैन",
      noResultsMessage: "आफ्नो खोज वा फिल्टरहरू समायोजन गर्नुहोस्।",
      name: "आपूर्तिकर्ताको नाम",
      contactName: "सम्पर्क व्यक्ति",
      phone: "फोन",
      email: "इमेल",
      address: "ठेगाना",
      gstin: "GSTIN/VAT नम्बर",
      panNumber: "PAN नम्बर",
      paymentTerms: "भुक्तानी सर्तहरू",
      notes: "टिप्पणीहरू",
      products: "उत्पादनहरू",
      batches: "ब्याचहरू",
      edit: "सम्पादन",
      delete: "मेटाउनुहोस्",
      deactivate: "निष्क्रिय गर्नुहोस्",
      activate: "सक्रिय गर्नुहोस्",
      deleteConfirm: "के तपाईं यो आपूर्तिकर्ता मेटाउन निश्चित हुनुहुन्छ?",
      cannotDelete: "सम्बन्धित उत्पादन वा इन्भेन्टरी भएको आपूर्तिकर्ता मेटाउन सकिँदैन",
      save: "सेभ गर्नुहोस्",
      saving: "सेभ हुँदैछ...",
      cancel: "रद्द गर्नुहोस्",
      addNewSupplier: "नयाँ आपूर्तिकर्ता थप्नुहोस्",
      editSupplier: "आपूर्तिकर्ता सम्पादन गर्नुहोस्",
      required: "आवश्यक",
      optional: "ऐच्छिक",
      loginRequired: "आपूर्तिकर्ताहरू व्यवस्थापन गर्न कृपया लगइन गर्नुहोस्",
      login: "लगइन गर्नुहोस्",
      noClinic: "कुनै प्रमाणित क्लिनिक छैन",
      noClinicMessage: "तपाईंसँग अझै प्रमाणित क्लिनिक छैन।",
      registerClinic: "क्लिनिक दर्ता गर्नुहोस्",
      loading: "लोड हुँदैछ...",
      errorLoading: "आपूर्तिकर्ताहरू लोड गर्न असफल भयो",
      retry: "पुन: प्रयास गर्नुहोस्",
      addedOn: "थपिएको",
      paymentTermsPlaceholder: "उदाहरण: Net 30, COD",
    },
  };

  const tr = t[lang as keyof typeof t] || t.en;

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNoClinic(false);

    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (filterActive) params.set("isActive", filterActive);

      const response = await fetch(`/api/clinic/pharmacy/suppliers?${params}`);

      if (response.status === 404) {
        const data = await response.json();
        if (data.code === "NO_CLINIC") {
          setNoClinic(true);
          return;
        }
      }

      if (!response.ok) {
        throw new Error("Failed to fetch suppliers");
      }

      const data = await response.json();
      setSuppliers(data.suppliers || []);
    } catch (err) {
      console.error("Error fetching suppliers:", err);
      setError(tr.errorLoading);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterActive, tr.errorLoading]);

  const resetForm = () => {
    setFormData({
      name: "",
      contact_name: "",
      phone: "",
      email: "",
      address: "",
      gstin: "",
      pan_number: "",
      payment_terms: "",
      notes: "",
    });
    setEditingSupplier(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contact_name: supplier.contact_name || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
      gstin: supplier.gstin || "",
      pan_number: supplier.pan_number || "",
      payment_terms: supplier.payment_terms || "",
      notes: supplier.notes || "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert("Supplier name is required");
      return;
    }

    setSaving(true);

    try {
      const method = editingSupplier ? "PUT" : "POST";
      const body = editingSupplier
        ? { id: editingSupplier.id, ...formData }
        : formData;

      const response = await fetch("/api/clinic/pharmacy/suppliers", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save supplier");
      }

      const savedSupplier = await response.json();

      if (editingSupplier) {
        setSuppliers((prev) =>
          prev.map((s) => (s.id === savedSupplier.id ? savedSupplier : s))
        );
      } else {
        setSuppliers((prev) => [savedSupplier, ...prev]);
      }

      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error("Error saving supplier:", err);
      alert(err instanceof Error ? err.message : "Failed to save supplier");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (supplier: Supplier) => {
    try {
      const response = await fetch("/api/clinic/pharmacy/suppliers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: supplier.id, is_active: !supplier.is_active }),
      });

      if (!response.ok) {
        throw new Error("Failed to update supplier");
      }

      setSuppliers((prev) =>
        prev.map((s) => (s.id === supplier.id ? { ...s, is_active: !s.is_active } : s))
      );
    } catch (err) {
      console.error("Error toggling supplier status:", err);
      alert("Failed to update supplier status");
    }
  };

  const handleDelete = async (supplier: Supplier) => {
    if (supplier._count.products > 0 || supplier._count.batches > 0) {
      alert(tr.cannotDelete);
      return;
    }

    if (!confirm(tr.deleteConfirm)) return;

    try {
      const response = await fetch(`/api/clinic/pharmacy/suppliers?id=${supplier.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete supplier");
      }

      setSuppliers((prev) => prev.filter((s) => s.id !== supplier.id));
    } catch (err) {
      console.error("Error deleting supplier:", err);
      alert(err instanceof Error ? err.message : "Failed to delete supplier");
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchSuppliers();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, fetchSuppliers]);

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
              <Link href={`/${lang}/login?callbackUrl=/${lang}/clinic/dashboard/pharmacy/suppliers`}>
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
              <Button variant="primary" onClick={fetchSuppliers}>
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
          <div>
            <Link
              href={`/${lang}/clinic/dashboard/pharmacy/products`}
              className="text-primary-blue hover:underline text-sm mb-2 inline-block"
            >
              ← {tr.backToProducts}
            </Link>
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground">{tr.title}</h1>
            <p className="text-foreground/60 mt-1">{tr.subtitle}</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button variant="primary" onClick={openAddModal}>
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {tr.addSupplier}
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchSuppliers()}
                  placeholder={tr.searchPlaceholder}
                  className="flex-1 px-4 py-2 border-2 border-foreground bg-white text-foreground placeholder:text-foreground/50 focus:outline-none focus:border-primary-blue"
                />
                <Button variant="primary" onClick={fetchSuppliers}>
                  {tr.search}
                </Button>
              </div>
              <select
                value={filterActive}
                onChange={(e) => setFilterActive(e.target.value)}
                className="px-3 py-2 border-2 border-foreground bg-white text-foreground focus:outline-none focus:border-primary-blue"
              >
                <option value="">{tr.allStatuses}</option>
                <option value="true">{tr.active}</option>
                <option value="false">{tr.inactive}</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Suppliers List */}
        {suppliers.length === 0 ? (
          <Card decorator="yellow" decoratorPosition="top-right">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 bg-primary-yellow/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                {searchQuery || filterActive ? tr.noResults : tr.noSuppliers}
              </h3>
              <p className="text-foreground/60 mb-6">
                {searchQuery || filterActive ? tr.noResultsMessage : tr.noSuppliersMessage}
              </p>
              {!searchQuery && !filterActive && (
                <Button variant="primary" onClick={openAddModal}>
                  {tr.addSupplier}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suppliers.map((supplier) => (
              <Card
                key={supplier.id}
                className={`hover:-translate-y-1 transition-transform ${!supplier.is_active ? "opacity-60" : ""}`}
              >
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-foreground truncate">{supplier.name}</h3>
                        {!supplier.is_active && (
                          <span className="px-2 py-0.5 text-xs font-bold text-white bg-foreground/50 rounded">
                            {tr.inactive}
                          </span>
                        )}
                      </div>
                      {supplier.contact_name && (
                        <p className="text-sm text-foreground/70">{supplier.contact_name}</p>
                      )}
                      {supplier.phone && (
                        <p className="text-sm text-foreground/60">
                          <span className="inline-flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {supplier.phone}
                          </span>
                        </p>
                      )}
                      {supplier.email && (
                        <p className="text-sm text-foreground/60">
                          <span className="inline-flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {supplier.email}
                          </span>
                        </p>
                      )}
                      {supplier.address && (
                        <p className="text-sm text-foreground/50 mt-1 truncate">{supplier.address}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-foreground/40">
                        <span>{supplier._count.products} {tr.products}</span>
                        <span>{supplier._count.batches} {tr.batches}</span>
                        {supplier.payment_terms && (
                          <span className="text-primary-blue">{supplier.payment_terms}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => openEditModal(supplier)}
                        className="p-2 text-primary-blue hover:bg-primary-blue/10 rounded"
                        title={tr.edit}
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleToggleActive(supplier)}
                        className={`p-2 rounded ${
                          supplier.is_active
                            ? "text-primary-yellow hover:bg-primary-yellow/10"
                            : "text-verified hover:bg-verified/10"
                        }`}
                        title={supplier.is_active ? tr.deactivate : tr.activate}
                      >
                        {supplier.is_active ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(supplier)}
                        className="p-2 text-primary-red hover:bg-primary-red/10 rounded"
                        title={tr.delete}
                        disabled={supplier._count.products > 0 || supplier._count.batches > 0}
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add/Edit Supplier Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
              <CardHeader className="border-b-4 border-foreground">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-foreground">
                    {editingSupplier ? tr.editSupplier : tr.addNewSupplier}
                  </h2>
                  <button
                    onClick={() => { setShowModal(false); resetForm(); }}
                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-foreground/10"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </CardHeader>
              <CardContent className="py-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Supplier Name */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-foreground mb-1">
                      {tr.name} <span className="text-primary-red">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-foreground bg-white focus:outline-none focus:border-primary-blue"
                    />
                  </div>

                  {/* Contact Name */}
                  <div>
                    <label className="block text-sm font-bold text-foreground mb-1">
                      {tr.contactName} <span className="text-foreground/40">({tr.optional})</span>
                    </label>
                    <input
                      type="text"
                      value={formData.contact_name}
                      onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-foreground bg-white focus:outline-none focus:border-primary-blue"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-bold text-foreground mb-1">
                      {tr.phone} <span className="text-foreground/40">({tr.optional})</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-foreground bg-white focus:outline-none focus:border-primary-blue"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-bold text-foreground mb-1">
                      {tr.email} <span className="text-foreground/40">({tr.optional})</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-foreground bg-white focus:outline-none focus:border-primary-blue"
                    />
                  </div>

                  {/* Payment Terms */}
                  <div>
                    <label className="block text-sm font-bold text-foreground mb-1">
                      {tr.paymentTerms} <span className="text-foreground/40">({tr.optional})</span>
                    </label>
                    <input
                      type="text"
                      value={formData.payment_terms}
                      onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                      placeholder={tr.paymentTermsPlaceholder}
                      className="w-full px-4 py-2 border-2 border-foreground bg-white focus:outline-none focus:border-primary-blue"
                    />
                  </div>

                  {/* Address */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-foreground mb-1">
                      {tr.address} <span className="text-foreground/40">({tr.optional})</span>
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-foreground bg-white focus:outline-none focus:border-primary-blue"
                    />
                  </div>

                  {/* GSTIN */}
                  <div>
                    <label className="block text-sm font-bold text-foreground mb-1">
                      {tr.gstin} <span className="text-foreground/40">({tr.optional})</span>
                    </label>
                    <input
                      type="text"
                      value={formData.gstin}
                      onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-foreground bg-white focus:outline-none focus:border-primary-blue"
                    />
                  </div>

                  {/* PAN Number */}
                  <div>
                    <label className="block text-sm font-bold text-foreground mb-1">
                      {tr.panNumber} <span className="text-foreground/40">({tr.optional})</span>
                    </label>
                    <input
                      type="text"
                      value={formData.pan_number}
                      onChange={(e) => setFormData({ ...formData, pan_number: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-foreground bg-white focus:outline-none focus:border-primary-blue"
                    />
                  </div>

                  {/* Notes */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-foreground mb-1">
                      {tr.notes} <span className="text-foreground/40">({tr.optional})</span>
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border-2 border-foreground bg-white focus:outline-none focus:border-primary-blue resize-none"
                    />
                  </div>
                </div>
              </CardContent>

              {/* Modal Footer */}
              <div className="border-t-4 border-foreground p-4 flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setShowModal(false); resetForm(); }}>
                  {tr.cancel}
                </Button>
                <Button variant="primary" onClick={handleSave} disabled={saving}>
                  {saving ? tr.saving : tr.save}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
