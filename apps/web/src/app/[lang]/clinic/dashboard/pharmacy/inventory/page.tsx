"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface OverviewData {
  totalProducts: number;
  activeProducts: number;
  totalBatches: number;
  lowStockProducts: number;
  expiring: {
    in30Days: number;
    in60Days: number;
    in90Days: number;
    expired: number;
  };
  totalStockValue: number;
  totalUnits: number;
}

interface Supplier {
  id: string;
  name: string;
}

interface Batch {
  id: string;
  quantity: number;
  expiry_date: string;
  batch_number: string;
  selling_price: string;
}

interface LowStockProduct {
  id: string;
  name: string;
  generic_name: string | null;
  category: string;
  unit: string;
  min_stock_level: number;
  supplier: Supplier | null;
  batches: Batch[];
  totalStock: number;
  nearestExpiry: string | null;
  stockDeficit: number;
}

interface ProductInfo {
  id: string;
  name: string;
  generic_name: string | null;
  category: string;
  unit: string;
}

interface ExpiringBatch {
  id: string;
  batch_number: string;
  expiry_date: string;
  quantity: number;
  selling_price: string;
  mrp: string;
  product: ProductInfo;
  supplier: Supplier | null;
  daysUntilExpiry: number;
  isExpired: boolean;
  expiryStatus: "expired" | "critical" | "warning" | "caution";
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type ViewType = "overview" | "low-stock" | "expiring";
type AdjustmentType = "damage" | "loss" | "theft" | "expired" | "found" | "correction" | "other";

export default function PharmacyInventoryPage() {
  const { data: session, status } = useSession();
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en";

  const [currentView, setCurrentView] = useState<ViewType>("overview");
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [expiringBatches, setExpiringBatches] = useState<ExpiringBatch[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });
  const [expiryDays, setExpiryDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noClinic, setNoClinic] = useState(false);

  // Stock adjustment modal state
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjustingBatch, setAdjustingBatch] = useState<{
    id: string;
    batchNumber: string;
    productName: string;
    currentQuantity: number;
  } | null>(null);
  const [adjustmentForm, setAdjustmentForm] = useState({
    adjustmentType: "damage" as AdjustmentType,
    quantity: "",
    reason: "",
    notes: "",
  });
  const [adjusting, setAdjusting] = useState(false);

  // Translations
  const t = {
    en: {
      title: "Inventory Dashboard",
      subtitle: "Track stock levels, expiring items, and manage adjustments",
      backToDashboard: "Back to Dashboard",
      products: "Products",
      suppliers: "Suppliers",
      pos: "POS",
      // Tab navigation
      overview: "Overview",
      lowStock: "Low Stock",
      expiring: "Expiring Items",
      // Overview cards
      totalProducts: "Total Products",
      activeProducts: "Active Products",
      totalBatches: "Stock Batches",
      lowStockAlerts: "Low Stock Alerts",
      stockValue: "Stock Value",
      totalUnits: "Total Units",
      // Expiry cards
      expired: "Expired",
      expiringIn30: "Expiring in 30 Days",
      expiringIn60: "31-60 Days",
      expiringIn90: "61-90 Days",
      // Low stock table
      product: "Product",
      category: "Category",
      currentStock: "Current Stock",
      minStock: "Min Stock",
      deficit: "Deficit",
      nearestExpiry: "Nearest Expiry",
      supplier: "Supplier",
      actions: "Actions",
      orderMore: "Order More",
      noLowStock: "No Low Stock Items",
      noLowStockMessage: "All products are above minimum stock levels.",
      // Expiring table
      batch: "Batch",
      expiryDate: "Expiry Date",
      daysLeft: "Days Left",
      quantity: "Quantity",
      value: "Value",
      status: "Status",
      statusExpired: "Expired",
      statusCritical: "Critical",
      statusWarning: "Warning",
      statusCaution: "Caution",
      noExpiring: "No Expiring Items",
      noExpiringMessage: "No items expiring within the selected period.",
      // Filter
      expiryPeriod: "Expiry Period",
      days30: "30 Days",
      days60: "60 Days",
      days90: "90 Days",
      days180: "180 Days",
      allExpiring: "All Expiring",
      // Adjustment modal
      adjustStock: "Adjust Stock",
      adjustmentType: "Adjustment Type",
      adjustmentDamage: "Damage",
      adjustmentLoss: "Loss",
      adjustmentTheft: "Theft",
      adjustmentExpired: "Expired",
      adjustmentFound: "Found",
      adjustmentCorrection: "Correction",
      adjustmentOther: "Other",
      adjustQuantity: "Quantity",
      reason: "Reason",
      notes: "Notes",
      save: "Save Adjustment",
      saving: "Saving...",
      cancel: "Cancel",
      adjustSuccess: "Stock adjusted successfully",
      // Common
      loading: "Loading...",
      errorLoading: "Failed to load data",
      retry: "Retry",
      loginRequired: "Please log in to view inventory",
      login: "Login",
      noClinic: "No Verified Clinic",
      noClinicMessage: "You don't have a verified clinic yet.",
      registerClinic: "Register Clinic",
      page: "Page",
      of: "of",
      previous: "Previous",
      next: "Next",
      rs: "Rs.",
    },
    ne: {
      title: "इन्भेन्टरी ड्यासबोर्ड",
      subtitle: "स्टक स्तर, म्याद सकिने वस्तुहरू ट्र्याक गर्नुहोस् र समायोजन व्यवस्थापन गर्नुहोस्",
      backToDashboard: "ड्यासबोर्डमा फर्कनुहोस्",
      products: "उत्पादनहरू",
      suppliers: "आपूर्तिकर्ता",
      pos: "POS",
      overview: "अवलोकन",
      lowStock: "कम स्टक",
      expiring: "म्याद सकिँदै",
      totalProducts: "कुल उत्पादन",
      activeProducts: "सक्रिय उत्पादन",
      totalBatches: "स्टक ब्याचहरू",
      lowStockAlerts: "कम स्टक अलर्ट",
      stockValue: "स्टक मूल्य",
      totalUnits: "कुल एकाइ",
      expired: "म्याद सकियो",
      expiringIn30: "३० दिनमा म्याद सकिने",
      expiringIn60: "३१-६० दिन",
      expiringIn90: "६१-९० दिन",
      product: "उत्पादन",
      category: "श्रेणी",
      currentStock: "हालको स्टक",
      minStock: "न्यूनतम स्टक",
      deficit: "घाटा",
      nearestExpiry: "नजिकको म्याद",
      supplier: "आपूर्तिकर्ता",
      actions: "कार्यहरू",
      orderMore: "थप अर्डर",
      noLowStock: "कम स्टक छैन",
      noLowStockMessage: "सबै उत्पादनहरू न्यूनतम स्टक स्तर भन्दा माथि छन्।",
      batch: "ब्याच",
      expiryDate: "म्याद मिति",
      daysLeft: "बाँकी दिन",
      quantity: "मात्रा",
      value: "मूल्य",
      status: "स्थिति",
      statusExpired: "म्याद सकियो",
      statusCritical: "गम्भीर",
      statusWarning: "चेतावनी",
      statusCaution: "सावधानी",
      noExpiring: "म्याद सकिने वस्तु छैन",
      noExpiringMessage: "चयन गरिएको अवधिमा कुनै वस्तु म्याद सकिँदैन।",
      expiryPeriod: "म्याद अवधि",
      days30: "३० दिन",
      days60: "६० दिन",
      days90: "९० दिन",
      days180: "१८० दिन",
      allExpiring: "सबै म्याद सकिने",
      adjustStock: "स्टक समायोजन",
      adjustmentType: "समायोजन प्रकार",
      adjustmentDamage: "क्षति",
      adjustmentLoss: "हानि",
      adjustmentTheft: "चोरी",
      adjustmentExpired: "म्याद सकियो",
      adjustmentFound: "फेला परियो",
      adjustmentCorrection: "सुधार",
      adjustmentOther: "अन्य",
      adjustQuantity: "मात्रा",
      reason: "कारण",
      notes: "टिप्पणी",
      save: "समायोजन सेभ गर्नुहोस्",
      saving: "सेभ हुँदैछ...",
      cancel: "रद्द गर्नुहोस्",
      adjustSuccess: "स्टक सफलतापूर्वक समायोजित भयो",
      loading: "लोड हुँदैछ...",
      errorLoading: "डाटा लोड गर्न असफल भयो",
      retry: "पुन: प्रयास गर्नुहोस्",
      loginRequired: "इन्भेन्टरी हेर्न कृपया लगइन गर्नुहोस्",
      login: "लगइन गर्नुहोस्",
      noClinic: "कुनै प्रमाणित क्लिनिक छैन",
      noClinicMessage: "तपाईंसँग अझै प्रमाणित क्लिनिक छैन।",
      registerClinic: "क्लिनिक दर्ता गर्नुहोस्",
      page: "पृष्ठ",
      of: "को",
      previous: "अघिल्लो",
      next: "अर्को",
      rs: "रु.",
    },
  };

  const tr = t[lang as keyof typeof t] || t.en;

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, { en: string; ne: string }> = {
      MEDICINE: { en: "Medicine", ne: "औषधि" },
      MEDICAL_DEVICE: { en: "Medical Device", ne: "चिकित्सा उपकरण" },
      COSMETIC: { en: "Cosmetic", ne: "कस्मेटिक" },
      AYURVEDIC: { en: "Ayurvedic", ne: "आयुर्वेदिक" },
      HOMEOPATHIC: { en: "Homeopathic", ne: "होमियोप्याथिक" },
      SUPPLEMENT: { en: "Supplement", ne: "पूरक" },
      OTHER: { en: "Other", ne: "अन्य" },
    };
    return labels[category]?.[lang as "en" | "ne"] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      MEDICINE: "bg-primary-blue",
      MEDICAL_DEVICE: "bg-primary-red",
      COSMETIC: "bg-pink-500",
      AYURVEDIC: "bg-green-600",
      HOMEOPATHIC: "bg-purple-500",
      SUPPLEMENT: "bg-orange-500",
      OTHER: "bg-foreground/50",
    };
    return colors[category] || "bg-foreground/50";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      expired: "bg-primary-red text-white",
      critical: "bg-orange-500 text-white",
      warning: "bg-primary-yellow text-black",
      caution: "bg-yellow-200 text-black",
    };
    return colors[status] || "bg-gray-200";
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(lang === "ne" ? "ne-NP" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return `${tr.rs} ${amount.toLocaleString(lang === "ne" ? "ne-NP" : "en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const fetchInventoryData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNoClinic(false);

    try {
      const params = new URLSearchParams();
      params.set("view", currentView);
      if (currentView === "expiring") {
        params.set("expiryDays", expiryDays.toString());
      }
      params.set("page", pagination.page.toString());
      params.set("limit", "20");

      const response = await fetch(`/api/clinic/pharmacy/inventory?${params}`);

      if (response.status === 404) {
        const data = await response.json();
        if (data.code === "NO_CLINIC") {
          setNoClinic(true);
          return;
        }
      }

      if (!response.ok) {
        throw new Error("Failed to fetch inventory data");
      }

      const data = await response.json();

      if (currentView === "overview") {
        setOverview(data.overview);
      } else if (currentView === "low-stock") {
        setLowStockProducts(data.products || []);
        setPagination(data.pagination || { total: 0, page: 1, limit: 20, totalPages: 0 });
      } else if (currentView === "expiring") {
        setExpiringBatches(data.batches || []);
        setPagination(data.pagination || { total: 0, page: 1, limit: 20, totalPages: 0 });
      }
    } catch (err) {
      console.error("Error fetching inventory:", err);
      setError(tr.errorLoading);
    } finally {
      setLoading(false);
    }
  }, [currentView, expiryDays, pagination.page, tr.errorLoading]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchInventoryData();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, fetchInventoryData]);

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleExpiryDaysChange = (days: number) => {
    setExpiryDays(days);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const openAdjustmentModal = (batch: {
    id: string;
    batchNumber: string;
    productName: string;
    currentQuantity: number;
  }) => {
    setAdjustingBatch(batch);
    setAdjustmentForm({
      adjustmentType: "damage",
      quantity: "",
      reason: "",
      notes: "",
    });
    setShowAdjustmentModal(true);
  };

  const handleAdjustStock = async () => {
    if (!adjustingBatch || !adjustmentForm.quantity) {
      alert("Please enter a quantity");
      return;
    }

    const qty = parseInt(adjustmentForm.quantity);
    if (isNaN(qty) || qty <= 0) {
      alert("Please enter a valid positive quantity");
      return;
    }

    setAdjusting(true);

    try {
      const response = await fetch("/api/clinic/pharmacy/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId: adjustingBatch.id,
          adjustmentType: adjustmentForm.adjustmentType,
          quantity: qty,
          reason: adjustmentForm.reason,
          notes: adjustmentForm.notes,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to adjust stock");
      }

      alert(tr.adjustSuccess);
      setShowAdjustmentModal(false);
      setAdjustingBatch(null);
      fetchInventoryData();
    } catch (err) {
      console.error("Error adjusting stock:", err);
      alert(err instanceof Error ? err.message : "Failed to adjust stock");
    } finally {
      setAdjusting(false);
    }
  };

  // Loading state
  if (status === "loading" || (status === "authenticated" && loading && !overview && lowStockProducts.length === 0 && expiringBatches.length === 0)) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-foreground/10 rounded w-1/3"></div>
            <div className="h-4 bg-foreground/10 rounded w-1/2"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-foreground/10 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Unauthenticated state
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Card className="border-4 border-foreground shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-primary-yellow rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">{tr.loginRequired}</h2>
              <Link href={`/${lang}/login`}>
                <Button variant="primary" className="mt-4">
                  {tr.login}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // No clinic state
  if (noClinic) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Card className="border-4 border-foreground shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-primary-blue rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">{tr.noClinic}</h2>
              <p className="text-foreground/70 mb-4">{tr.noClinicMessage}</p>
              <Link href={`/${lang}/clinic/register`}>
                <Button variant="primary">{tr.registerClinic}</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Card className="border-4 border-foreground shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-primary-red rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">{error}</h2>
              <Button variant="primary" onClick={fetchInventoryData} className="mt-4">
                {tr.retry}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-foreground/60 mb-2">
              <Link href={`/${lang}/clinic/dashboard`} className="hover:text-primary-blue">
                {tr.backToDashboard}
              </Link>
              <span>/</span>
              <span>{tr.title}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight">
              {tr.title}
            </h1>
            <p className="text-foreground/70 mt-1">{tr.subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/${lang}/clinic/dashboard/pharmacy/products`}>
              <Button variant="outline" size="sm">
                {tr.products}
              </Button>
            </Link>
            <Link href={`/${lang}/clinic/dashboard/pharmacy/suppliers`}>
              <Button variant="outline" size="sm">
                {tr.suppliers}
              </Button>
            </Link>
            <Link href={`/${lang}/clinic/dashboard/pharmacy/pos`}>
              <Button variant="primary" size="sm">
                {tr.pos}
              </Button>
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => handleViewChange("overview")}
            className={`px-4 py-2 font-bold text-sm uppercase tracking-wider border-2 border-foreground transition-all ${
              currentView === "overview"
                ? "bg-primary-blue text-white shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
                : "bg-white hover:bg-gray-50"
            }`}
          >
            {tr.overview}
          </button>
          <button
            onClick={() => handleViewChange("low-stock")}
            className={`px-4 py-2 font-bold text-sm uppercase tracking-wider border-2 border-foreground transition-all ${
              currentView === "low-stock"
                ? "bg-primary-red text-white shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
                : "bg-white hover:bg-gray-50"
            }`}
          >
            {tr.lowStock}
            {overview && overview.lowStockProducts > 0 && (
              <span className="ml-2 bg-white text-primary-red px-2 py-0.5 text-xs rounded-full">
                {overview.lowStockProducts}
              </span>
            )}
          </button>
          <button
            onClick={() => handleViewChange("expiring")}
            className={`px-4 py-2 font-bold text-sm uppercase tracking-wider border-2 border-foreground transition-all ${
              currentView === "expiring"
                ? "bg-primary-yellow text-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
                : "bg-white hover:bg-gray-50"
            }`}
          >
            {tr.expiring}
            {overview && (overview.expiring.expired + overview.expiring.in30Days) > 0 && (
              <span className="ml-2 bg-white text-primary-red px-2 py-0.5 text-xs rounded-full">
                {overview.expiring.expired + overview.expiring.in30Days}
              </span>
            )}
          </button>
        </div>

        {/* Overview View */}
        {currentView === "overview" && overview && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-4 border-foreground shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary-blue rounded flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-foreground/60">{tr.totalProducts}</p>
                      <p className="text-2xl font-black">{overview.activeProducts}</p>
                      <p className="text-xs text-foreground/50">/ {overview.totalProducts} total</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-4 border-foreground shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-600 rounded flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-foreground/60">{tr.totalBatches}</p>
                      <p className="text-2xl font-black">{overview.totalBatches}</p>
                      <p className="text-xs text-foreground/50">{overview.totalUnits.toLocaleString()} units</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-4 border-foreground shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary-yellow rounded flex items-center justify-center">
                      <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-foreground/60">{tr.stockValue}</p>
                      <p className="text-xl font-black">{formatCurrency(overview.totalStockValue)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`border-4 border-foreground shadow-[8px_8px_0_0_rgba(0,0,0,1)] cursor-pointer hover:-translate-y-1 transition-transform ${
                  overview.lowStockProducts > 0 ? "bg-primary-red/10" : ""
                }`}
                onClick={() => handleViewChange("low-stock")}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded flex items-center justify-center ${overview.lowStockProducts > 0 ? "bg-primary-red" : "bg-gray-400"}`}>
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-foreground/60">{tr.lowStockAlerts}</p>
                      <p className="text-2xl font-black">{overview.lowStockProducts}</p>
                      <p className="text-xs text-primary-blue hover:underline">{lang === "ne" ? "हेर्नुहोस् →" : "View →"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Expiry Status Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card
                className={`border-4 border-foreground shadow-[8px_8px_0_0_rgba(0,0,0,1)] cursor-pointer hover:-translate-y-1 transition-transform ${
                  overview.expiring.expired > 0 ? "bg-primary-red/20" : ""
                }`}
                onClick={() => {
                  setExpiryDays(0);
                  handleViewChange("expiring");
                }}
              >
                <CardContent className="p-4 text-center">
                  <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-2 ${overview.expiring.expired > 0 ? "bg-primary-red" : "bg-gray-300"}`}>
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <p className="text-2xl font-black">{overview.expiring.expired}</p>
                  <p className="text-xs uppercase tracking-wider text-foreground/60">{tr.expired}</p>
                </CardContent>
              </Card>

              <Card
                className={`border-4 border-foreground shadow-[8px_8px_0_0_rgba(0,0,0,1)] cursor-pointer hover:-translate-y-1 transition-transform ${
                  overview.expiring.in30Days > 0 ? "bg-orange-100" : ""
                }`}
                onClick={() => {
                  setExpiryDays(30);
                  handleViewChange("expiring");
                }}
              >
                <CardContent className="p-4 text-center">
                  <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-2 ${overview.expiring.in30Days > 0 ? "bg-orange-500" : "bg-gray-300"}`}>
                    <span className="text-white font-bold text-sm">30</span>
                  </div>
                  <p className="text-2xl font-black">{overview.expiring.in30Days}</p>
                  <p className="text-xs uppercase tracking-wider text-foreground/60">{tr.expiringIn30}</p>
                </CardContent>
              </Card>

              <Card
                className="border-4 border-foreground shadow-[8px_8px_0_0_rgba(0,0,0,1)] cursor-pointer hover:-translate-y-1 transition-transform"
                onClick={() => {
                  setExpiryDays(60);
                  handleViewChange("expiring");
                }}
              >
                <CardContent className="p-4 text-center">
                  <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-2 ${overview.expiring.in60Days > 0 ? "bg-primary-yellow" : "bg-gray-300"}`}>
                    <span className={`font-bold text-sm ${overview.expiring.in60Days > 0 ? "text-black" : "text-white"}`}>60</span>
                  </div>
                  <p className="text-2xl font-black">{overview.expiring.in60Days}</p>
                  <p className="text-xs uppercase tracking-wider text-foreground/60">{tr.expiringIn60}</p>
                </CardContent>
              </Card>

              <Card
                className="border-4 border-foreground shadow-[8px_8px_0_0_rgba(0,0,0,1)] cursor-pointer hover:-translate-y-1 transition-transform"
                onClick={() => {
                  setExpiryDays(90);
                  handleViewChange("expiring");
                }}
              >
                <CardContent className="p-4 text-center">
                  <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-2 ${overview.expiring.in90Days > 0 ? "bg-yellow-200 border-2 border-foreground" : "bg-gray-300"}`}>
                    <span className={`font-bold text-sm ${overview.expiring.in90Days > 0 ? "text-black" : "text-white"}`}>90</span>
                  </div>
                  <p className="text-2xl font-black">{overview.expiring.in90Days}</p>
                  <p className="text-xs uppercase tracking-wider text-foreground/60">{tr.expiringIn90}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Low Stock View */}
        {currentView === "low-stock" && (
          <div>
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-foreground/10 rounded"></div>
                ))}
              </div>
            ) : lowStockProducts.length === 0 ? (
              <Card className="border-4 border-foreground shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{tr.noLowStock}</h3>
                  <p className="text-foreground/70">{tr.noLowStockMessage}</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full border-4 border-foreground bg-white">
                    <thead>
                      <tr className="bg-foreground text-white">
                        <th className="p-3 text-left text-xs uppercase tracking-wider">{tr.product}</th>
                        <th className="p-3 text-left text-xs uppercase tracking-wider">{tr.category}</th>
                        <th className="p-3 text-center text-xs uppercase tracking-wider">{tr.currentStock}</th>
                        <th className="p-3 text-center text-xs uppercase tracking-wider">{tr.minStock}</th>
                        <th className="p-3 text-center text-xs uppercase tracking-wider">{tr.deficit}</th>
                        <th className="p-3 text-left text-xs uppercase tracking-wider">{tr.nearestExpiry}</th>
                        <th className="p-3 text-left text-xs uppercase tracking-wider">{tr.supplier}</th>
                        <th className="p-3 text-center text-xs uppercase tracking-wider">{tr.actions}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStockProducts.map((product, idx) => (
                        <tr key={product.id} className={`border-b-2 border-foreground/20 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                          <td className="p-3">
                            <div className="font-bold">{product.name}</div>
                            {product.generic_name && (
                              <div className="text-xs text-foreground/60">{product.generic_name}</div>
                            )}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-1 text-xs text-white rounded ${getCategoryColor(product.category)}`}>
                              {getCategoryLabel(product.category)}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="font-bold text-primary-red">{product.totalStock}</span>
                            <span className="text-xs text-foreground/60 ml-1">{product.unit}</span>
                          </td>
                          <td className="p-3 text-center">{product.min_stock_level}</td>
                          <td className="p-3 text-center">
                            <span className="bg-primary-red text-white px-2 py-1 rounded font-bold text-sm">
                              -{product.stockDeficit}
                            </span>
                          </td>
                          <td className="p-3">
                            {product.nearestExpiry ? formatDate(product.nearestExpiry) : "-"}
                          </td>
                          <td className="p-3 text-sm">{product.supplier?.name || "-"}</td>
                          <td className="p-3 text-center">
                            <Button variant="outline" size="sm">
                              {tr.orderMore}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-foreground/70">
                      {tr.page} {pagination.page} {tr.of} {pagination.totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page <= 1}
                        onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                      >
                        {tr.previous}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page >= pagination.totalPages}
                        onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                      >
                        {tr.next}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Expiring Items View */}
        {currentView === "expiring" && (
          <div>
            {/* Expiry Period Filter */}
            <div className="mb-4 flex flex-wrap gap-2 items-center">
              <span className="text-sm font-bold uppercase tracking-wider">{tr.expiryPeriod}:</span>
              {[
                { days: 30, label: tr.days30 },
                { days: 60, label: tr.days60 },
                { days: 90, label: tr.days90 },
                { days: 180, label: tr.days180 },
                { days: 365, label: tr.allExpiring },
              ].map((option) => (
                <button
                  key={option.days}
                  onClick={() => handleExpiryDaysChange(option.days)}
                  className={`px-3 py-1 text-sm font-bold border-2 border-foreground transition-all ${
                    expiryDays === option.days
                      ? "bg-primary-yellow text-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                      : "bg-white hover:bg-gray-50"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-foreground/10 rounded"></div>
                ))}
              </div>
            ) : expiringBatches.length === 0 ? (
              <Card className="border-4 border-foreground shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{tr.noExpiring}</h3>
                  <p className="text-foreground/70">{tr.noExpiringMessage}</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full border-4 border-foreground bg-white">
                    <thead>
                      <tr className="bg-foreground text-white">
                        <th className="p-3 text-left text-xs uppercase tracking-wider">{tr.product}</th>
                        <th className="p-3 text-left text-xs uppercase tracking-wider">{tr.batch}</th>
                        <th className="p-3 text-center text-xs uppercase tracking-wider">{tr.quantity}</th>
                        <th className="p-3 text-left text-xs uppercase tracking-wider">{tr.expiryDate}</th>
                        <th className="p-3 text-center text-xs uppercase tracking-wider">{tr.daysLeft}</th>
                        <th className="p-3 text-center text-xs uppercase tracking-wider">{tr.status}</th>
                        <th className="p-3 text-right text-xs uppercase tracking-wider">{tr.value}</th>
                        <th className="p-3 text-center text-xs uppercase tracking-wider">{tr.actions}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expiringBatches.map((batch, idx) => (
                        <tr key={batch.id} className={`border-b-2 border-foreground/20 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                          <td className="p-3">
                            <div className="font-bold">{batch.product.name}</div>
                            {batch.product.generic_name && (
                              <div className="text-xs text-foreground/60">{batch.product.generic_name}</div>
                            )}
                            <span className={`inline-block px-2 py-0.5 text-xs text-white rounded mt-1 ${getCategoryColor(batch.product.category)}`}>
                              {getCategoryLabel(batch.product.category)}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="font-mono text-sm">{batch.batch_number}</div>
                            {batch.supplier && (
                              <div className="text-xs text-foreground/60">{batch.supplier.name}</div>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <span className="font-bold">{batch.quantity}</span>
                            <span className="text-xs text-foreground/60 ml-1">{batch.product.unit}</span>
                          </td>
                          <td className="p-3">{formatDate(batch.expiry_date)}</td>
                          <td className="p-3 text-center">
                            <span className={`font-bold ${batch.isExpired ? "text-primary-red" : batch.daysUntilExpiry <= 30 ? "text-orange-500" : "text-foreground"}`}>
                              {batch.isExpired ? (lang === "ne" ? "म्याद सकियो" : "Expired") : batch.daysUntilExpiry}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-1 text-xs font-bold rounded ${getStatusColor(batch.expiryStatus)}`}>
                              {batch.expiryStatus === "expired" ? tr.statusExpired :
                               batch.expiryStatus === "critical" ? tr.statusCritical :
                               batch.expiryStatus === "warning" ? tr.statusWarning : tr.statusCaution}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            {formatCurrency(parseFloat(batch.mrp) * batch.quantity)}
                          </td>
                          <td className="p-3 text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openAdjustmentModal({
                                id: batch.id,
                                batchNumber: batch.batch_number,
                                productName: batch.product.name,
                                currentQuantity: batch.quantity,
                              })}
                            >
                              {tr.adjustStock}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-foreground/70">
                      {tr.page} {pagination.page} {tr.of} {pagination.totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page <= 1}
                        onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                      >
                        {tr.previous}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page >= pagination.totalPages}
                        onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                      >
                        {tr.next}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Stock Adjustment Modal */}
        {showAdjustmentModal && adjustingBatch && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md border-4 border-foreground shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
              <CardHeader className="border-b-4 border-foreground bg-foreground text-white">
                <h2 className="text-xl font-bold uppercase tracking-wider">{tr.adjustStock}</h2>
                <p className="text-sm text-white/70">{adjustingBatch.productName} - {adjustingBatch.batchNumber}</p>
                <p className="text-sm text-white/70">Current qty: {adjustingBatch.currentQuantity}</p>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider mb-2">
                    {tr.adjustmentType}
                  </label>
                  <select
                    value={adjustmentForm.adjustmentType}
                    onChange={(e) => setAdjustmentForm((prev) => ({ ...prev, adjustmentType: e.target.value as AdjustmentType }))}
                    className="w-full p-3 border-2 border-foreground focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  >
                    <option value="damage">{tr.adjustmentDamage}</option>
                    <option value="loss">{tr.adjustmentLoss}</option>
                    <option value="theft">{tr.adjustmentTheft}</option>
                    <option value="expired">{tr.adjustmentExpired}</option>
                    <option value="found">{tr.adjustmentFound}</option>
                    <option value="correction">{tr.adjustmentCorrection}</option>
                    <option value="other">{tr.adjustmentOther}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider mb-2">
                    {tr.adjustQuantity}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={["found", "correction"].includes(adjustmentForm.adjustmentType) ? undefined : adjustingBatch.currentQuantity}
                    value={adjustmentForm.quantity}
                    onChange={(e) => setAdjustmentForm((prev) => ({ ...prev, quantity: e.target.value }))}
                    placeholder={["found", "correction"].includes(adjustmentForm.adjustmentType) ? "Quantity to add" : `Max: ${adjustingBatch.currentQuantity}`}
                    className="w-full p-3 border-2 border-foreground focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  />
                  <p className="text-xs text-foreground/60 mt-1">
                    {["found", "correction"].includes(adjustmentForm.adjustmentType)
                      ? lang === "ne" ? "यो मात्रा थपिनेछ" : "This quantity will be added"
                      : lang === "ne" ? "यो मात्रा घटाइनेछ" : "This quantity will be deducted"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider mb-2">
                    {tr.reason}
                  </label>
                  <input
                    type="text"
                    value={adjustmentForm.reason}
                    onChange={(e) => setAdjustmentForm((prev) => ({ ...prev, reason: e.target.value }))}
                    placeholder={lang === "ne" ? "समायोजनको कारण" : "Reason for adjustment"}
                    className="w-full p-3 border-2 border-foreground focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider mb-2">
                    {tr.notes}
                  </label>
                  <textarea
                    value={adjustmentForm.notes}
                    onChange={(e) => setAdjustmentForm((prev) => ({ ...prev, notes: e.target.value }))}
                    rows={2}
                    placeholder={lang === "ne" ? "थप टिप्पणीहरू (ऐच्छिक)" : "Additional notes (optional)"}
                    className="w-full p-3 border-2 border-foreground focus:outline-none focus:ring-2 focus:ring-primary-blue resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowAdjustmentModal(false);
                      setAdjustingBatch(null);
                    }}
                    disabled={adjusting}
                  >
                    {tr.cancel}
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={handleAdjustStock}
                    disabled={adjusting || !adjustmentForm.quantity}
                  >
                    {adjusting ? tr.saving : tr.save}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
