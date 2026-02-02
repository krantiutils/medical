"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Ward {
  id: string;
  name: string;
  type: string;
  floor: string | null;
  building: string | null;
  capacity: number;
  description: string | null;
  is_active: boolean;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
}

const WARD_TYPES = [
  "GENERAL",
  "SEMI_PRIVATE",
  "PRIVATE",
  "ICU",
  "NICU",
  "PICU",
  "CCU",
  "EMERGENCY",
  "MATERNITY",
  "PEDIATRIC",
];

export default function IPDPage() {
  const { data: session, status } = useSession();
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en";

  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noClinic, setNoClinic] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingWard, setEditingWard] = useState<Ward | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "GENERAL",
    floor: "",
    building: "",
    capacity: "10",
    description: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Translations
  const t = {
    en: {
      title: "IPD Management",
      subtitle: "Manage wards, beds, and admissions",
      loginRequired: "Please log in to access the IPD dashboard",
      login: "Login",
      noClinic: "No Verified Clinic",
      noClinicMessage: "You don't have a verified clinic yet.",
      registerClinic: "Register Clinic",
      loading: "Loading...",
      errorLoading: "Failed to load IPD data",
      retry: "Retry",
      wards: "Wards",
      addWard: "Add Ward",
      editWard: "Edit Ward",
      noWards: "No wards configured yet",
      noWardsDesc: "Create wards to manage beds and admissions",
      wardName: "Ward Name",
      wardType: "Ward Type",
      floor: "Floor",
      building: "Building",
      capacity: "Capacity",
      description: "Description",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      beds: "beds",
      occupied: "occupied",
      available: "available",
      viewBeds: "View Beds",
      admissions: "Admissions",
      viewAdmissions: "View Admissions",
      newAdmission: "New Admission",
      active: "Active",
      inactive: "Inactive",
      backToDashboard: "Back to Dashboard",
      wardTypes: {
        GENERAL: "General",
        SEMI_PRIVATE: "Semi-Private",
        PRIVATE: "Private",
        ICU: "ICU",
        NICU: "Neonatal ICU",
        PICU: "Pediatric ICU",
        CCU: "Cardiac Care Unit",
        EMERGENCY: "Emergency",
        MATERNITY: "Maternity",
        PEDIATRIC: "Pediatric",
      },
      confirmDelete: "Are you sure you want to delete this ward?",
      deleteWarning: "This will also delete all beds in this ward.",
    },
    ne: {
      title: "IPD व्यवस्थापन",
      subtitle: "वार्ड, बेड, र भर्ना व्यवस्थापन गर्नुहोस्",
      loginRequired: "IPD ड्यासबोर्ड पहुँच गर्न कृपया लगइन गर्नुहोस्",
      login: "लगइन",
      noClinic: "कुनै प्रमाणित क्लिनिक छैन",
      noClinicMessage: "तपाईंसँग अझै प्रमाणित क्लिनिक छैन।",
      registerClinic: "क्लिनिक दर्ता गर्नुहोस्",
      loading: "लोड हुँदैछ...",
      errorLoading: "IPD डेटा लोड गर्न असफल भयो",
      retry: "पुन: प्रयास गर्नुहोस्",
      wards: "वार्डहरू",
      addWard: "वार्ड थप्नुहोस्",
      editWard: "वार्ड सम्पादन गर्नुहोस्",
      noWards: "अझै कुनै वार्ड कन्फिगर गरिएको छैन",
      noWardsDesc: "बेड र भर्ना व्यवस्थापन गर्न वार्डहरू सिर्जना गर्नुहोस्",
      wardName: "वार्डको नाम",
      wardType: "वार्डको प्रकार",
      floor: "तल्ला",
      building: "भवन",
      capacity: "क्षमता",
      description: "विवरण",
      save: "सेभ गर्नुहोस्",
      cancel: "रद्द गर्नुहोस्",
      delete: "मेटाउनुहोस्",
      beds: "बेडहरू",
      occupied: "व्यस्त",
      available: "उपलब्ध",
      viewBeds: "बेडहरू हेर्नुहोस्",
      admissions: "भर्नाहरू",
      viewAdmissions: "भर्नाहरू हेर्नुहोस्",
      newAdmission: "नयाँ भर्ना",
      active: "सक्रिय",
      inactive: "निष्क्रिय",
      backToDashboard: "ड्यासबोर्डमा फर्कनुहोस्",
      wardTypes: {
        GENERAL: "सामान्य",
        SEMI_PRIVATE: "अर्ध-निजी",
        PRIVATE: "निजी",
        ICU: "आइसीयू",
        NICU: "नवजात शिशु आइसीयू",
        PICU: "बाल आइसीयू",
        CCU: "हृदय हेरचाह इकाई",
        EMERGENCY: "आपतकालीन",
        MATERNITY: "प्रसूति",
        PEDIATRIC: "बाल",
      },
      confirmDelete: "के तपाईं यो वार्ड मेटाउन निश्चित हुनुहुन्छ?",
      deleteWarning: "यसले यस वार्डका सबै बेडहरू पनि मेटाउनेछ।",
    },
  };

  const tr = t[lang as keyof typeof t] || t.en;

  const getWardTypeLabel = (type: string) => {
    return tr.wardTypes[type as keyof typeof tr.wardTypes] || type;
  };

  const getWardTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      GENERAL: "bg-primary-blue/10 text-primary-blue",
      SEMI_PRIVATE: "bg-primary-yellow/10 text-primary-yellow",
      PRIVATE: "bg-verified/10 text-verified",
      ICU: "bg-primary-red/10 text-primary-red",
      NICU: "bg-primary-red/10 text-primary-red",
      PICU: "bg-primary-red/10 text-primary-red",
      CCU: "bg-primary-red/10 text-primary-red",
      EMERGENCY: "bg-primary-red/10 text-primary-red",
      MATERNITY: "bg-primary-blue/10 text-primary-blue",
      PEDIATRIC: "bg-primary-yellow/10 text-primary-yellow",
    };
    return colors[type] || "bg-foreground/10 text-foreground";
  };

  const fetchWards = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNoClinic(false);

    try {
      const response = await fetch("/api/clinic/ipd/wards");

      if (response.status === 404) {
        const data = await response.json();
        if (data.code === "NO_CLINIC") {
          setNoClinic(true);
          return;
        }
      }

      if (!response.ok) {
        throw new Error("Failed to fetch wards");
      }

      const data = await response.json();
      setWards(data.wards);
    } catch (err) {
      console.error("Error fetching wards:", err);
      setError(tr.errorLoading);
    } finally {
      setLoading(false);
    }
  }, [tr.errorLoading]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchWards();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, fetchWards]);

  const openAddModal = () => {
    setEditingWard(null);
    setFormData({
      name: "",
      type: "GENERAL",
      floor: "",
      building: "",
      capacity: "10",
      description: "",
    });
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (ward: Ward) => {
    setEditingWard(ward);
    setFormData({
      name: ward.name,
      type: ward.type,
      floor: ward.floor || "",
      building: ward.building || "",
      capacity: ward.capacity.toString(),
      description: ward.description || "",
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    try {
      const method = editingWard ? "PATCH" : "POST";
      const body = editingWard
        ? { id: editingWard.id, ...formData }
        : formData;

      const response = await fetch("/api/clinic/ipd/wards", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save ward");
      }

      setShowModal(false);
      fetchWards();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save ward");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ward: Ward) => {
    if (!confirm(`${tr.confirmDelete}\n\n${tr.deleteWarning}`)) {
      return;
    }

    try {
      const response = await fetch(`/api/clinic/ipd/wards?id=${ward.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete ward");
      }

      fetchWards();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete ward");
    }
  };

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
              <Link href={`/${lang}/login?callbackUrl=/${lang}/clinic/dashboard/ipd`}>
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
              <Button variant="primary" onClick={fetchWards}>
                {tr.retry}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Calculate totals
  const totalBeds = wards.reduce((sum, w) => sum + w.totalBeds, 0);
  const occupiedBeds = wards.reduce((sum, w) => sum + w.occupiedBeds, 0);
  const availableBeds = wards.reduce((sum, w) => sum + w.availableBeds, 0);

  return (
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <Link
              href={`/${lang}/clinic/dashboard`}
              className="text-primary-blue hover:underline text-sm mb-2 inline-block"
            >
              ← {tr.backToDashboard}
            </Link>
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground">
              {tr.title}
            </h1>
            <p className="text-foreground/60">{tr.subtitle}</p>
          </div>
          <div className="mt-4 sm:mt-0 flex gap-3">
            <Link href={`/${lang}/clinic/dashboard/ipd/admissions`}>
              <Button variant="outline">{tr.viewAdmissions}</Button>
            </Link>
            <Link href={`/${lang}/clinic/dashboard/ipd/admit`}>
              <Button variant="primary">{tr.newAdmission}</Button>
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card decorator="blue" decoratorPosition="top-left">
            <CardContent className="py-4">
              <p className="text-xs font-bold uppercase tracking-widest text-foreground/60">
                Total {tr.beds}
              </p>
              <p className="text-3xl font-black text-foreground">{totalBeds}</p>
            </CardContent>
          </Card>
          <Card decorator="red" decoratorPosition="top-left">
            <CardContent className="py-4">
              <p className="text-xs font-bold uppercase tracking-widest text-foreground/60">
                {tr.occupied}
              </p>
              <p className="text-3xl font-black text-primary-red">{occupiedBeds}</p>
            </CardContent>
          </Card>
          <Card decorator="blue" decoratorPosition="top-left">
            <CardContent className="py-4">
              <p className="text-xs font-bold uppercase tracking-widest text-foreground/60">
                {tr.available}
              </p>
              <p className="text-3xl font-black text-verified">{availableBeds}</p>
            </CardContent>
          </Card>
        </div>

        {/* Wards Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">{tr.wards}</h2>
            <Button variant="primary" onClick={openAddModal}>
              {tr.addWard}
            </Button>
          </div>

          {wards.length === 0 ? (
            <Card decorator="yellow" decoratorPosition="top-right">
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 bg-primary-yellow/10 rounded-full mx-auto mb-4 flex items-center justify-center">
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
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{tr.noWards}</h3>
                <p className="text-foreground/60 mb-4">{tr.noWardsDesc}</p>
                <Button variant="primary" onClick={openAddModal}>
                  {tr.addWard}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {wards.map((ward) => (
                <Card
                  key={ward.id}
                  decorator={ward.is_active ? "blue" : undefined}
                  decoratorPosition="top-left"
                  className="hover:-translate-y-1 transition-transform"
                >
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span
                          className={`inline-block text-xs font-bold uppercase tracking-widest px-2 py-1 rounded ${getWardTypeColor(
                            ward.type
                          )}`}
                        >
                          {getWardTypeLabel(ward.type)}
                        </span>
                        <h3 className="text-lg font-bold text-foreground mt-2">
                          {ward.name}
                        </h3>
                        {(ward.floor || ward.building) && (
                          <p className="text-sm text-foreground/60">
                            {[ward.floor, ward.building].filter(Boolean).join(", ")}
                          </p>
                        )}
                      </div>
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded ${
                          ward.is_active
                            ? "bg-verified/10 text-verified"
                            : "bg-foreground/10 text-foreground/60"
                        }`}
                      >
                        {ward.is_active ? tr.active : tr.inactive}
                      </span>
                    </div>

                    {/* Bed Stats */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-1">
                        <span className="text-2xl font-black text-foreground">
                          {ward.totalBeds}
                        </span>
                        <span className="text-sm text-foreground/60">{tr.beds}</span>
                      </div>
                      <div className="flex-1 h-2 bg-foreground/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-red"
                          style={{
                            width:
                              ward.totalBeds > 0
                                ? `${(ward.occupiedBeds / ward.totalBeds) * 100}%`
                                : "0%",
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm mb-4">
                      <span className="text-primary-red">
                        {ward.occupiedBeds} {tr.occupied}
                      </span>
                      <span className="text-verified">
                        {ward.availableBeds} {tr.available}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 border-t-2 border-foreground/10 pt-4">
                      <Link
                        href={`/${lang}/clinic/dashboard/ipd/beds?ward=${ward.id}`}
                        className="flex-1"
                      >
                        <Button variant="outline" size="sm" className="w-full">
                          {tr.viewBeds}
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(ward)}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(ward)}
                      >
                        <svg
                          className="w-4 h-4 text-primary-red"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Add/Edit Ward Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50">
            <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <h2 className="text-2xl font-bold text-foreground">
                  {editingWard ? tr.editWard : tr.addWard}
                </h2>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {formError && (
                    <div className="p-3 bg-primary-red/10 border-2 border-primary-red rounded text-primary-red text-sm">
                      {formError}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-bold text-foreground mb-1">
                      {tr.wardName} *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-4 py-2 border-4 border-foreground rounded focus:border-primary-blue focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-foreground mb-1">
                      {tr.wardType} *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value })
                      }
                      className="w-full px-4 py-2 border-4 border-foreground rounded focus:border-primary-blue focus:outline-none"
                    >
                      {WARD_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {getWardTypeLabel(type)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-foreground mb-1">
                        {tr.floor}
                      </label>
                      <input
                        type="text"
                        value={formData.floor}
                        onChange={(e) =>
                          setFormData({ ...formData, floor: e.target.value })
                        }
                        className="w-full px-4 py-2 border-4 border-foreground rounded focus:border-primary-blue focus:outline-none"
                        placeholder="e.g., 2nd Floor"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-foreground mb-1">
                        {tr.building}
                      </label>
                      <input
                        type="text"
                        value={formData.building}
                        onChange={(e) =>
                          setFormData({ ...formData, building: e.target.value })
                        }
                        className="w-full px-4 py-2 border-4 border-foreground rounded focus:border-primary-blue focus:outline-none"
                        placeholder="e.g., Main Building"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-foreground mb-1">
                      {tr.capacity} *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={formData.capacity}
                      onChange={(e) =>
                        setFormData({ ...formData, capacity: e.target.value })
                      }
                      className="w-full px-4 py-2 border-4 border-foreground rounded focus:border-primary-blue focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-foreground mb-1">
                      {tr.description}
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      className="w-full px-4 py-2 border-4 border-foreground rounded focus:border-primary-blue focus:outline-none resize-none"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowModal(false)}
                      className="flex-1"
                    >
                      {tr.cancel}
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={saving}
                      className="flex-1"
                    >
                      {saving ? "..." : tr.save}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
