"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Ward {
  id: string;
  name: string;
  type: string;
}

interface Patient {
  id: string;
  full_name: string;
  patient_number: string;
}

interface Bed {
  id: string;
  bed_number: string;
  status: string;
  type: string | null;
  daily_rate: string;
  features: string[];
  notes: string | null;
  is_active: boolean;
  ward_id: string;
  ward: Ward;
  current_patient: Patient | null;
  current_admission_id: string | null;
}

const BED_FEATURES = [
  "Oxygen",
  "Monitor",
  "AC",
  "TV",
  "Attached Bathroom",
  "Ventilator",
  "Suction",
];

function BedsPageContent() {
  const { data: session, status } = useSession();
  const params = useParams<{ lang: string }>();
  const searchParams = useSearchParams();
  const lang = params?.lang || "en";
  const wardIdFromUrl = searchParams.get("ward");

  const [beds, setBeds] = useState<Bed[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedWard, setSelectedWard] = useState<string>(wardIdFromUrl || "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noClinic, setNoClinic] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingBed, setEditingBed] = useState<Bed | null>(null);
  const [formData, setFormData] = useState({
    ward_id: "",
    bed_number: "",
    type: "",
    daily_rate: "0",
    features: [] as string[],
    notes: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Translations
  const t = {
    en: {
      title: "Bed Management",
      subtitle: "Visual bed map and management",
      loginRequired: "Please log in to access the bed management",
      login: "Login",
      noClinic: "No Verified Clinic",
      noClinicMessage: "You don't have a verified clinic yet.",
      registerClinic: "Register Clinic",
      loading: "Loading...",
      errorLoading: "Failed to load bed data",
      retry: "Retry",
      beds: "Beds",
      addBed: "Add Bed",
      editBed: "Edit Bed",
      noBeds: "No beds in this ward",
      noBedsDesc: "Add beds to start managing admissions",
      allWards: "All Wards",
      bedNumber: "Bed Number",
      ward: "Ward",
      wardType: "Type Override",
      dailyRate: "Daily Rate (Rs.)",
      features: "Features",
      notes: "Notes",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      available: "Available",
      occupied: "Occupied",
      reserved: "Reserved",
      maintenance: "Maintenance",
      outOfService: "Out of Service",
      patient: "Patient",
      viewAdmission: "View Admission",
      discharge: "Discharge",
      backToIPD: "Back to IPD",
      confirmDelete: "Are you sure you want to delete this bed?",
      selectWard: "Select a ward",
      noWards: "No wards found. Create wards first.",
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
    },
    ne: {
      title: "बेड व्यवस्थापन",
      subtitle: "भिजुअल बेड नक्सा र व्यवस्थापन",
      loginRequired: "बेड व्यवस्थापन पहुँच गर्न कृपया लगइन गर्नुहोस्",
      login: "लगइन",
      noClinic: "कुनै प्रमाणित क्लिनिक छैन",
      noClinicMessage: "तपाईंसँग अझै प्रमाणित क्लिनिक छैन।",
      registerClinic: "क्लिनिक दर्ता गर्नुहोस्",
      loading: "लोड हुँदैछ...",
      errorLoading: "बेड डेटा लोड गर्न असफल भयो",
      retry: "पुन: प्रयास गर्नुहोस्",
      beds: "बेडहरू",
      addBed: "बेड थप्नुहोस्",
      editBed: "बेड सम्पादन गर्नुहोस्",
      noBeds: "यस वार्डमा कुनै बेड छैन",
      noBedsDesc: "भर्ना व्यवस्थापन सुरु गर्न बेडहरू थप्नुहोस्",
      allWards: "सबै वार्डहरू",
      bedNumber: "बेड नम्बर",
      ward: "वार्ड",
      wardType: "प्रकार ओभरराइड",
      dailyRate: "दैनिक दर (रु.)",
      features: "सुविधाहरू",
      notes: "नोटहरू",
      save: "सेभ गर्नुहोस्",
      cancel: "रद्द गर्नुहोस्",
      delete: "मेटाउनुहोस्",
      available: "उपलब्ध",
      occupied: "व्यस्त",
      reserved: "आरक्षित",
      maintenance: "मर्मत",
      outOfService: "सेवा बाहिर",
      patient: "बिरामी",
      viewAdmission: "भर्ना हेर्नुहोस्",
      discharge: "डिस्चार्ज",
      backToIPD: "IPD मा फर्कनुहोस्",
      confirmDelete: "के तपाईं यो बेड मेटाउन निश्चित हुनुहुन्छ?",
      selectWard: "वार्ड छान्नुहोस्",
      noWards: "कुनै वार्ड फेला परेन। पहिले वार्डहरू सिर्जना गर्नुहोस्।",
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
    },
  };

  const tr = t[lang as keyof typeof t] || t.en;

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      AVAILABLE: tr.available,
      OCCUPIED: tr.occupied,
      RESERVED: tr.reserved,
      MAINTENANCE: tr.maintenance,
      OUT_OF_SERVICE: tr.outOfService,
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      AVAILABLE: "bg-verified text-white",
      OCCUPIED: "bg-primary-red text-white",
      RESERVED: "bg-primary-yellow text-foreground",
      MAINTENANCE: "bg-foreground/50 text-white",
      OUT_OF_SERVICE: "bg-foreground text-white",
    };
    return colors[status] || "bg-foreground/10 text-foreground";
  };

  const getWardTypeLabel = (type: string) => {
    return tr.wardTypes[type as keyof typeof tr.wardTypes] || type;
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNoClinic(false);

    try {
      // Fetch wards
      const wardsResponse = await fetch("/api/clinic/ipd/wards");
      if (wardsResponse.status === 404) {
        const data = await wardsResponse.json();
        if (data.code === "NO_CLINIC") {
          setNoClinic(true);
          return;
        }
      }
      if (!wardsResponse.ok) {
        throw new Error("Failed to fetch wards");
      }
      const wardsData = await wardsResponse.json();
      setWards(wardsData.wards);

      // Fetch beds
      const bedsUrl = selectedWard
        ? `/api/clinic/ipd/beds?ward_id=${selectedWard}`
        : "/api/clinic/ipd/beds";
      const bedsResponse = await fetch(bedsUrl);
      if (!bedsResponse.ok) {
        throw new Error("Failed to fetch beds");
      }
      const bedsData = await bedsResponse.json();
      setBeds(bedsData.beds);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(tr.errorLoading);
    } finally {
      setLoading(false);
    }
  }, [selectedWard, tr.errorLoading]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchData();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, fetchData]);

  useEffect(() => {
    if (wardIdFromUrl) {
      setSelectedWard(wardIdFromUrl);
    }
  }, [wardIdFromUrl]);

  const openAddModal = () => {
    setEditingBed(null);
    setFormData({
      ward_id: selectedWard || (wards[0]?.id || ""),
      bed_number: "",
      type: "",
      daily_rate: "0",
      features: [],
      notes: "",
    });
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (bed: Bed) => {
    setEditingBed(bed);
    setFormData({
      ward_id: bed.ward_id,
      bed_number: bed.bed_number,
      type: bed.type || "",
      daily_rate: bed.daily_rate,
      features: bed.features,
      notes: bed.notes || "",
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleFeatureToggle = (feature: string) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter((f) => f !== feature)
        : [...prev.features, feature],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    try {
      const method = editingBed ? "PATCH" : "POST";
      const body = editingBed
        ? { id: editingBed.id, ...formData }
        : formData;

      const response = await fetch("/api/clinic/ipd/beds", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save bed");
      }

      setShowModal(false);
      fetchData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save bed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (bed: Bed) => {
    if (!confirm(tr.confirmDelete)) {
      return;
    }

    try {
      const response = await fetch(`/api/clinic/ipd/beds?id=${bed.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete bed");
      }

      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete bed");
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
              <Link href={`/${lang}/login?callbackUrl=/${lang}/clinic/dashboard/ipd/beds`}>
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
              <Button variant="primary" onClick={fetchData}>
                {tr.retry}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Group beds by ward for visual display
  const bedsByWard = beds.reduce((acc, bed) => {
    const wardId = bed.ward.id;
    if (!acc[wardId]) {
      acc[wardId] = {
        ward: bed.ward,
        beds: [],
      };
    }
    acc[wardId].beds.push(bed);
    return acc;
  }, {} as Record<string, { ward: Ward; beds: Bed[] }>);

  return (
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <Link
              href={`/${lang}/clinic/dashboard/ipd`}
              className="text-primary-blue hover:underline text-sm mb-2 inline-block"
            >
              ← {tr.backToIPD}
            </Link>
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground">
              {tr.title}
            </h1>
            <p className="text-foreground/60">{tr.subtitle}</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button variant="primary" onClick={openAddModal} disabled={wards.length === 0}>
              {tr.addBed}
            </Button>
          </div>
        </div>

        {/* Ward Filter */}
        <div className="mb-6">
          <select
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            className="px-4 py-2 border-4 border-foreground rounded focus:border-primary-blue focus:outline-none min-w-[200px]"
          >
            <option value="">{tr.allWards}</option>
            {wards.map((ward) => (
              <option key={ward.id} value={ward.id}>
                {ward.name}
              </option>
            ))}
          </select>
        </div>

        {/* No wards warning */}
        {wards.length === 0 && (
          <Card decorator="yellow" decoratorPosition="top-right" className="mb-6">
            <CardContent className="py-6 text-center">
              <p className="text-foreground/70">{tr.noWards}</p>
              <Link href={`/${lang}/clinic/dashboard/ipd`}>
                <Button variant="outline" className="mt-4">
                  {tr.backToIPD}
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Visual Bed Map */}
        {Object.keys(bedsByWard).length === 0 && wards.length > 0 ? (
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
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">{tr.noBeds}</h3>
              <p className="text-foreground/60 mb-4">{tr.noBedsDesc}</p>
              <Button variant="primary" onClick={openAddModal}>
                {tr.addBed}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.values(bedsByWard).map(({ ward, beds: wardBeds }) => (
              <div key={ward.id}>
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  {ward.name}
                  <span className="text-sm font-normal text-foreground/60">
                    ({getWardTypeLabel(ward.type)})
                  </span>
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {wardBeds.map((bed) => (
                    <div
                      key={bed.id}
                      className={`relative p-4 rounded-lg border-4 border-foreground cursor-pointer transition-all hover:-translate-y-1 ${
                        bed.status === "AVAILABLE"
                          ? "bg-verified/10"
                          : bed.status === "OCCUPIED"
                          ? "bg-primary-red/10"
                          : bed.status === "RESERVED"
                          ? "bg-primary-yellow/10"
                          : "bg-foreground/5"
                      }`}
                      onClick={() => openEditModal(bed)}
                    >
                      {/* Status Badge */}
                      <span
                        className={`absolute -top-2 -right-2 text-xs font-bold px-2 py-1 rounded ${getStatusColor(
                          bed.status
                        )}`}
                      >
                        {getStatusLabel(bed.status)}
                      </span>

                      {/* Bed Icon */}
                      <div className="w-full aspect-square flex items-center justify-center mb-2">
                        <svg
                          className={`w-12 h-12 ${
                            bed.status === "OCCUPIED"
                              ? "text-primary-red"
                              : bed.status === "AVAILABLE"
                              ? "text-verified"
                              : "text-foreground/50"
                          }`}
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M7 14c1.66 0 3-1.34 3-3S8.66 8 7 8s-3 1.34-3 3 1.34 3 3 3zm0-4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm12-3h-8v5H3V7H1v11h2v-3h18v3h2v-8c0-2.21-1.79-4-4-4zm2 6h-8V9h6c1.1 0 2 .9 2 2v2z" />
                        </svg>
                      </div>

                      {/* Bed Number */}
                      <p className="text-center font-bold text-foreground">
                        {bed.bed_number}
                      </p>

                      {/* Patient Info (if occupied) */}
                      {bed.current_patient && (
                        <p className="text-center text-xs text-foreground/60 mt-1 truncate">
                          {bed.current_patient.full_name}
                        </p>
                      )}

                      {/* Daily Rate */}
                      {parseFloat(bed.daily_rate) > 0 && (
                        <p className="text-center text-xs text-foreground/50 mt-1">
                          Rs. {bed.daily_rate}/day
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Legend */}
        <div className="mt-8 flex flex-wrap items-center gap-4 text-sm">
          <span className="font-bold text-foreground">Legend:</span>
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-verified" />
            {tr.available}
          </span>
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-primary-red" />
            {tr.occupied}
          </span>
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-primary-yellow" />
            {tr.reserved}
          </span>
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-foreground/50" />
            {tr.maintenance}
          </span>
        </div>

        {/* Add/Edit Bed Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50">
            <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <h2 className="text-2xl font-bold text-foreground">
                  {editingBed ? tr.editBed : tr.addBed}
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
                      {tr.ward} *
                    </label>
                    <select
                      value={formData.ward_id}
                      onChange={(e) =>
                        setFormData({ ...formData, ward_id: e.target.value })
                      }
                      className="w-full px-4 py-2 border-4 border-foreground rounded focus:border-primary-blue focus:outline-none"
                      required
                      disabled={!!editingBed}
                    >
                      <option value="">{tr.selectWard}</option>
                      {wards.map((ward) => (
                        <option key={ward.id} value={ward.id}>
                          {ward.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-foreground mb-1">
                      {tr.bedNumber} *
                    </label>
                    <input
                      type="text"
                      value={formData.bed_number}
                      onChange={(e) =>
                        setFormData({ ...formData, bed_number: e.target.value })
                      }
                      className="w-full px-4 py-2 border-4 border-foreground rounded focus:border-primary-blue focus:outline-none"
                      placeholder="e.g., A-101"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-foreground mb-1">
                      {tr.dailyRate}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.daily_rate}
                      onChange={(e) =>
                        setFormData({ ...formData, daily_rate: e.target.value })
                      }
                      className="w-full px-4 py-2 border-4 border-foreground rounded focus:border-primary-blue focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-foreground mb-2">
                      {tr.features}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {BED_FEATURES.map((feature) => (
                        <button
                          key={feature}
                          type="button"
                          onClick={() => handleFeatureToggle(feature)}
                          className={`px-3 py-1 rounded border-2 text-sm font-bold transition-colors ${
                            formData.features.includes(feature)
                              ? "bg-primary-blue text-white border-primary-blue"
                              : "bg-white text-foreground border-foreground hover:border-primary-blue"
                          }`}
                        >
                          {feature}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-foreground mb-1">
                      {tr.notes}
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      className="w-full px-4 py-2 border-4 border-foreground rounded focus:border-primary-blue focus:outline-none resize-none"
                      rows={3}
                    />
                  </div>

                  {/* Delete button for existing beds */}
                  {editingBed && editingBed.status !== "OCCUPIED" && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowModal(false);
                          handleDelete(editingBed);
                        }}
                        className="text-primary-red text-sm font-bold hover:underline"
                      >
                        {tr.delete} this bed
                      </button>
                    </div>
                  )}

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

export default function BedsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary-blue border-t-transparent rounded-full animate-spin" /></div>}>
      <BedsPageContent />
    </Suspense>
  );
}
