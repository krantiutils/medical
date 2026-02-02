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
}

interface Product {
  id: string;
  name: string;
  generic_name: string | null;
  category: string;
  schedule: string | null;
  manufacturer: string | null;
  barcode: string | null;
  hsn_code: string | null;
  gst_rate: string;
  unit: string;
  pack_size: number;
  min_stock_level: number;
  max_stock_level: number | null;
  description: string | null;
  storage_info: string | null;
  is_active: boolean;
  supplier: Supplier | null;
  totalStock: number;
  nearestExpiry: string | null;
  batchCount: number;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const CATEGORY_OPTIONS = [
  { value: "MEDICINE", labelEn: "Medicine", labelNe: "औषधि" },
  { value: "MEDICAL_DEVICE", labelEn: "Medical Device", labelNe: "चिकित्सा उपकरण" },
  { value: "COSMETIC", labelEn: "Cosmetic", labelNe: "कस्मेटिक" },
  { value: "AYURVEDIC", labelEn: "Ayurvedic", labelNe: "आयुर्वेदिक" },
  { value: "HOMEOPATHIC", labelEn: "Homeopathic", labelNe: "होमियोप्याथिक" },
  { value: "SUPPLEMENT", labelEn: "Supplement", labelNe: "पूरक" },
  { value: "OTHER", labelEn: "Other", labelNe: "अन्य" },
];

const SCHEDULE_OPTIONS = [
  { value: "", labelEn: "No Schedule", labelNe: "तालिका छैन" },
  { value: "OTC", labelEn: "OTC (Over the Counter)", labelNe: "ओटीसी" },
  { value: "SCHEDULE_H", labelEn: "Schedule H", labelNe: "तालिका H" },
  { value: "SCHEDULE_H1", labelEn: "Schedule H1", labelNe: "तालिका H1" },
  { value: "SCHEDULE_X", labelEn: "Schedule X (Narcotic)", labelNe: "तालिका X" },
  { value: "SCHEDULE_G", labelEn: "Schedule G", labelNe: "तालिका G" },
];

const UNIT_OPTIONS = [
  { value: "strip", labelEn: "Strip", labelNe: "स्ट्रिप" },
  { value: "tablet", labelEn: "Tablet", labelNe: "ट्याब्लेट" },
  { value: "capsule", labelEn: "Capsule", labelNe: "क्याप्सुल" },
  { value: "bottle", labelEn: "Bottle", labelNe: "बोतल" },
  { value: "vial", labelEn: "Vial", labelNe: "भायल" },
  { value: "ampoule", labelEn: "Ampoule", labelNe: "एम्प्यूल" },
  { value: "tube", labelEn: "Tube", labelNe: "ट्यूब" },
  { value: "sachet", labelEn: "Sachet", labelNe: "स्याचेट" },
  { value: "box", labelEn: "Box", labelNe: "बक्स" },
  { value: "piece", labelEn: "Piece", labelNe: "टुक्रा" },
  { value: "ml", labelEn: "ml", labelNe: "मिलि" },
  { value: "g", labelEn: "g", labelNe: "ग्राम" },
];

export default function PharmacyProductsPage() {
  const { data: session, status } = useSession();
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en";

  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noClinic, setNoClinic] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterSupplier, setFilterSupplier] = useState("");
  const [filterActive, setFilterActive] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    generic_name: "",
    category: "MEDICINE",
    schedule: "",
    manufacturer: "",
    barcode: "",
    hsn_code: "",
    gst_rate: "0",
    unit: "strip",
    pack_size: "1",
    min_stock_level: "0",
    max_stock_level: "",
    description: "",
    storage_info: "",
    supplier_id: "",
  });

  // Translations
  const t = {
    en: {
      title: "Product Catalog",
      subtitle: "Manage your pharmacy products and inventory items",
      backToDashboard: "Back to Dashboard",
      addProduct: "Add Product",
      searchPlaceholder: "Search by name, generic name, barcode...",
      search: "Search",
      filterByCategory: "Category",
      filterBySupplier: "Supplier",
      filterByStatus: "Status",
      allCategories: "All Categories",
      allSuppliers: "All Suppliers",
      allStatuses: "All",
      active: "Active",
      inactive: "Inactive",
      noProducts: "No products found",
      noProductsMessage: "Add your first product to start managing inventory.",
      noResults: "No matching products",
      noResultsMessage: "Try adjusting your search or filters.",
      product: "Product",
      genericName: "Generic Name",
      category: "Category",
      schedule: "Schedule",
      manufacturer: "Manufacturer",
      barcode: "Barcode",
      hsnCode: "HSN Code",
      gstRate: "GST %",
      unit: "Unit",
      packSize: "Pack Size",
      minStock: "Min Stock",
      maxStock: "Max Stock",
      description: "Description",
      storageInfo: "Storage Info",
      supplier: "Supplier",
      stock: "Stock",
      expiry: "Nearest Expiry",
      batches: "Batches",
      edit: "Edit",
      delete: "Delete",
      deactivate: "Deactivate",
      activate: "Activate",
      deleteConfirm: "Are you sure you want to delete this product?",
      cannotDelete: "Cannot delete product with existing stock",
      save: "Save",
      saving: "Saving...",
      cancel: "Cancel",
      addNewProduct: "Add New Product",
      editProduct: "Edit Product",
      required: "Required",
      optional: "Optional",
      generateBarcode: "Generate",
      loginRequired: "Please log in to manage products",
      login: "Login",
      noClinic: "No Verified Clinic",
      noClinicMessage: "You don't have a verified clinic yet.",
      registerClinic: "Register Clinic",
      loading: "Loading...",
      errorLoading: "Failed to load products",
      retry: "Retry",
      lowStock: "Low Stock",
      expiringSoon: "Expiring Soon",
      suppliers: "Manage Suppliers",
      page: "Page",
      of: "of",
      previous: "Previous",
      next: "Next",
    },
    ne: {
      title: "उत्पादन सूची",
      subtitle: "तपाईंको फार्मेसी उत्पादनहरू र इन्भेन्टरी वस्तुहरू व्यवस्थापन गर्नुहोस्",
      backToDashboard: "ड्यासबोर्डमा फर्कनुहोस्",
      addProduct: "उत्पादन थप्नुहोस्",
      searchPlaceholder: "नाम, जेनेरिक नाम, बारकोडद्वारा खोज्नुहोस्...",
      search: "खोज्नुहोस्",
      filterByCategory: "श्रेणी",
      filterBySupplier: "आपूर्तिकर्ता",
      filterByStatus: "स्थिति",
      allCategories: "सबै श्रेणी",
      allSuppliers: "सबै आपूर्तिकर्ता",
      allStatuses: "सबै",
      active: "सक्रिय",
      inactive: "निष्क्रिय",
      noProducts: "कुनै उत्पादन फेला परेन",
      noProductsMessage: "इन्भेन्टरी व्यवस्थापन सुरु गर्न आफ्नो पहिलो उत्पादन थप्नुहोस्।",
      noResults: "कुनै मिल्दो उत्पादन छैन",
      noResultsMessage: "आफ्नो खोज वा फिल्टरहरू समायोजन गर्नुहोस्।",
      product: "उत्पादन",
      genericName: "जेनेरिक नाम",
      category: "श्रेणी",
      schedule: "तालिका",
      manufacturer: "निर्माता",
      barcode: "बारकोड",
      hsnCode: "HSN कोड",
      gstRate: "GST %",
      unit: "एकाइ",
      packSize: "प्याक साइज",
      minStock: "न्यूनतम स्टक",
      maxStock: "अधिकतम स्टक",
      description: "विवरण",
      storageInfo: "भण्डारण जानकारी",
      supplier: "आपूर्तिकर्ता",
      stock: "स्टक",
      expiry: "नजिकको म्याद",
      batches: "ब्याचहरू",
      edit: "सम्पादन",
      delete: "मेटाउनुहोस्",
      deactivate: "निष्क्रिय गर्नुहोस्",
      activate: "सक्रिय गर्नुहोस्",
      deleteConfirm: "के तपाईं यो उत्पादन मेटाउन निश्चित हुनुहुन्छ?",
      cannotDelete: "अवस्थित स्टक भएको उत्पादन मेटाउन सकिँदैन",
      save: "सेभ गर्नुहोस्",
      saving: "सेभ हुँदैछ...",
      cancel: "रद्द गर्नुहोस्",
      addNewProduct: "नयाँ उत्पादन थप्नुहोस्",
      editProduct: "उत्पादन सम्पादन गर्नुहोस्",
      required: "आवश्यक",
      optional: "ऐच्छिक",
      generateBarcode: "उत्पन्न गर्नुहोस्",
      loginRequired: "उत्पादनहरू व्यवस्थापन गर्न कृपया लगइन गर्नुहोस्",
      login: "लगइन गर्नुहोस्",
      noClinic: "कुनै प्रमाणित क्लिनिक छैन",
      noClinicMessage: "तपाईंसँग अझै प्रमाणित क्लिनिक छैन।",
      registerClinic: "क्लिनिक दर्ता गर्नुहोस्",
      loading: "लोड हुँदैछ...",
      errorLoading: "उत्पादनहरू लोड गर्न असफल भयो",
      retry: "पुन: प्रयास गर्नुहोस्",
      lowStock: "कम स्टक",
      expiringSoon: "छिट्टै म्याद सकिँदैछ",
      suppliers: "आपूर्तिकर्ता व्यवस्थापन",
      page: "पृष्ठ",
      of: "को",
      previous: "अघिल्लो",
      next: "अर्को",
    },
  };

  const tr = t[lang as keyof typeof t] || t.en;

  const getCategoryLabel = (category: string) => {
    const option = CATEGORY_OPTIONS.find((c) => c.value === category);
    return lang === "ne" ? option?.labelNe : option?.labelEn || category;
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

  const getScheduleLabel = (schedule: string | null) => {
    if (!schedule) return null;
    const option = SCHEDULE_OPTIONS.find((s) => s.value === schedule);
    return lang === "ne" ? option?.labelNe : option?.labelEn;
  };

  const generateBarcode = () => {
    // Generate a random 13-digit EAN-13 barcode
    const prefix = "890"; // India/Nepal country code
    const random = Math.floor(Math.random() * 1000000000).toString().padStart(9, "0");
    const base = prefix + random;
    // Calculate check digit
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(base[i]) * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    setFormData((prev) => ({ ...prev, barcode: base + checkDigit }));
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNoClinic(false);

    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (filterCategory) params.set("category", filterCategory);
      if (filterSupplier) params.set("supplierId", filterSupplier);
      if (filterActive) params.set("isActive", filterActive);
      params.set("page", pagination.page.toString());
      params.set("limit", "20");

      const response = await fetch(`/api/clinic/pharmacy/products?${params}`);

      if (response.status === 404) {
        const data = await response.json();
        if (data.code === "NO_CLINIC") {
          setNoClinic(true);
          return;
        }
      }

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await response.json();
      setProducts(data.products || []);
      setPagination(data.pagination || { total: 0, page: 1, limit: 20, totalPages: 0 });
    } catch (err) {
      console.error("Error fetching products:", err);
      setError(tr.errorLoading);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterCategory, filterSupplier, filterActive, pagination.page, tr.errorLoading]);

  const fetchSuppliers = useCallback(async () => {
    try {
      const response = await fetch("/api/clinic/pharmacy/suppliers?isActive=true");
      if (response.ok) {
        const data = await response.json();
        setSuppliers(data.suppliers || []);
      }
    } catch (err) {
      console.error("Error fetching suppliers:", err);
    }
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      generic_name: "",
      category: "MEDICINE",
      schedule: "",
      manufacturer: "",
      barcode: "",
      hsn_code: "",
      gst_rate: "0",
      unit: "strip",
      pack_size: "1",
      min_stock_level: "0",
      max_stock_level: "",
      description: "",
      storage_info: "",
      supplier_id: "",
    });
    setEditingProduct(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      generic_name: product.generic_name || "",
      category: product.category,
      schedule: product.schedule || "",
      manufacturer: product.manufacturer || "",
      barcode: product.barcode || "",
      hsn_code: product.hsn_code || "",
      gst_rate: product.gst_rate || "0",
      unit: product.unit,
      pack_size: product.pack_size.toString(),
      min_stock_level: product.min_stock_level.toString(),
      max_stock_level: product.max_stock_level?.toString() || "",
      description: product.description || "",
      storage_info: product.storage_info || "",
      supplier_id: product.supplier?.id || "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert("Product name is required");
      return;
    }

    setSaving(true);

    try {
      const method = editingProduct ? "PUT" : "POST";
      const body = editingProduct
        ? { id: editingProduct.id, ...formData }
        : formData;

      const response = await fetch("/api/clinic/pharmacy/products", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save product");
      }

      const savedProduct = await response.json();

      if (editingProduct) {
        setProducts((prev) =>
          prev.map((p) => (p.id === savedProduct.id ? { ...savedProduct, totalStock: p.totalStock, nearestExpiry: p.nearestExpiry, batchCount: p.batchCount } : p))
        );
      } else {
        setProducts((prev) => [{ ...savedProduct, totalStock: 0, nearestExpiry: null, batchCount: 0 }, ...prev]);
      }

      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error("Error saving product:", err);
      alert(err instanceof Error ? err.message : "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      const response = await fetch("/api/clinic/pharmacy/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product.id, is_active: !product.is_active }),
      });

      if (!response.ok) {
        throw new Error("Failed to update product");
      }

      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_active: !p.is_active } : p))
      );
    } catch (err) {
      console.error("Error toggling product status:", err);
      alert("Failed to update product status");
    }
  };

  const handleDelete = async (product: Product) => {
    if (product.totalStock > 0) {
      alert(tr.cannotDelete);
      return;
    }

    if (!confirm(tr.deleteConfirm)) return;

    try {
      const response = await fetch(`/api/clinic/pharmacy/products?id=${product.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete product");
      }

      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (err) {
      console.error("Error deleting product:", err);
      alert(err instanceof Error ? err.message : "Failed to delete product");
    }
  };

  const isLowStock = (product: Product) => {
    return product.totalStock <= product.min_stock_level && product.min_stock_level > 0;
  };

  const isExpiringSoon = (product: Product) => {
    if (!product.nearestExpiry) return false;
    const expiryDate = new Date(product.nearestExpiry);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiryDate <= thirtyDaysFromNow;
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchProducts();
      fetchSuppliers();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, fetchProducts, fetchSuppliers]);

  // Loading state
  if (status === "loading" || loading) {
    return (
      <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
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
              <Link href={`/${lang}/login?callbackUrl=/${lang}/clinic/dashboard/pharmacy/products`}>
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
              <Button variant="primary" onClick={fetchProducts}>
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <Link
              href={`/${lang}/clinic/dashboard`}
              className="text-primary-blue hover:underline text-sm mb-2 inline-block"
            >
              ← {tr.backToDashboard}
            </Link>
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground">{tr.title}</h1>
            <p className="text-foreground/60 mt-1">{tr.subtitle}</p>
          </div>
          <div className="mt-4 sm:mt-0 flex gap-2">
            <Link href={`/${lang}/clinic/dashboard/pharmacy/suppliers`}>
              <Button variant="outline">{tr.suppliers}</Button>
            </Link>
            <Button variant="primary" onClick={openAddModal}>
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {tr.addProduct}
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchProducts()}
                  placeholder={tr.searchPlaceholder}
                  className="flex-1 px-4 py-2 border-2 border-foreground bg-white text-foreground placeholder:text-foreground/50 focus:outline-none focus:border-primary-blue"
                />
                <Button variant="primary" onClick={() => { setPagination(p => ({ ...p, page: 1 })); fetchProducts(); }}>
                  {tr.search}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={filterCategory}
                  onChange={(e) => { setFilterCategory(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
                  className="px-3 py-2 border-2 border-foreground bg-white text-foreground focus:outline-none focus:border-primary-blue"
                >
                  <option value="">{tr.allCategories}</option>
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {lang === "ne" ? option.labelNe : option.labelEn}
                    </option>
                  ))}
                </select>
                <select
                  value={filterSupplier}
                  onChange={(e) => { setFilterSupplier(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
                  className="px-3 py-2 border-2 border-foreground bg-white text-foreground focus:outline-none focus:border-primary-blue"
                >
                  <option value="">{tr.allSuppliers}</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
                <select
                  value={filterActive}
                  onChange={(e) => { setFilterActive(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
                  className="px-3 py-2 border-2 border-foreground bg-white text-foreground focus:outline-none focus:border-primary-blue"
                >
                  <option value="">{tr.allStatuses}</option>
                  <option value="true">{tr.active}</option>
                  <option value="false">{tr.inactive}</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products List */}
        {products.length === 0 ? (
          <Card decorator="yellow" decoratorPosition="top-right">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 bg-primary-yellow/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                {searchQuery || filterCategory || filterSupplier || filterActive ? tr.noResults : tr.noProducts}
              </h3>
              <p className="text-foreground/60 mb-6">
                {searchQuery || filterCategory || filterSupplier || filterActive ? tr.noResultsMessage : tr.noProductsMessage}
              </p>
              {!searchQuery && !filterCategory && !filterSupplier && !filterActive && (
                <Button variant="primary" onClick={openAddModal}>
                  {tr.addProduct}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-4 border-foreground bg-white">
                <thead>
                  <tr className="border-b-4 border-foreground bg-foreground/5">
                    <th className="px-4 py-3 text-left font-bold text-foreground">{tr.product}</th>
                    <th className="px-4 py-3 text-left font-bold text-foreground hidden md:table-cell">{tr.category}</th>
                    <th className="px-4 py-3 text-left font-bold text-foreground hidden lg:table-cell">{tr.supplier}</th>
                    <th className="px-4 py-3 text-right font-bold text-foreground">{tr.stock}</th>
                    <th className="px-4 py-3 text-left font-bold text-foreground hidden sm:table-cell">{tr.barcode}</th>
                    <th className="px-4 py-3 text-center font-bold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      className={`border-b-2 border-foreground/20 hover:bg-foreground/5 ${
                        !product.is_active ? "opacity-50" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-bold text-foreground">{product.name}</div>
                          {product.generic_name && (
                            <div className="text-sm text-foreground/60">{product.generic_name}</div>
                          )}
                          {product.manufacturer && (
                            <div className="text-xs text-foreground/40">{product.manufacturer}</div>
                          )}
                          <div className="flex gap-1 mt-1">
                            {isLowStock(product) && (
                              <span className="px-2 py-0.5 text-xs font-bold text-white bg-primary-red rounded">
                                {tr.lowStock}
                              </span>
                            )}
                            {isExpiringSoon(product) && (
                              <span className="px-2 py-0.5 text-xs font-bold text-foreground bg-primary-yellow rounded">
                                {tr.expiringSoon}
                              </span>
                            )}
                            {!product.is_active && (
                              <span className="px-2 py-0.5 text-xs font-bold text-white bg-foreground/50 rounded">
                                {tr.inactive}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className={`px-2 py-1 text-xs font-bold text-white rounded ${getCategoryColor(product.category)}`}>
                          {getCategoryLabel(product.category)}
                        </span>
                        {product.schedule && (
                          <div className="text-xs text-foreground/60 mt-1">
                            {getScheduleLabel(product.schedule)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {product.supplier?.name || "-"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="font-bold text-foreground">{product.totalStock} {product.unit}</div>
                        {product.nearestExpiry && (
                          <div className="text-xs text-foreground/60">
                            {tr.expiry}: {new Date(product.nearestExpiry).toLocaleDateString()}
                          </div>
                        )}
                        <div className="text-xs text-foreground/40">
                          {product.batchCount} {tr.batches}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell font-mono text-sm">
                        {product.barcode || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => openEditModal(product)}
                            className="p-2 text-primary-blue hover:bg-primary-blue/10 rounded"
                            title={tr.edit}
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleToggleActive(product)}
                            className={`p-2 rounded ${
                              product.is_active
                                ? "text-primary-yellow hover:bg-primary-yellow/10"
                                : "text-verified hover:bg-verified/10"
                            }`}
                            title={product.is_active ? tr.deactivate : tr.activate}
                          >
                            {product.is_active ? (
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
                            onClick={() => handleDelete(product)}
                            className="p-2 text-primary-red hover:bg-primary-red/10 rounded"
                            title={tr.delete}
                            disabled={product.totalStock > 0}
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                  disabled={pagination.page <= 1}
                >
                  {tr.previous}
                </Button>
                <span className="text-foreground">
                  {tr.page} {pagination.page} {tr.of} {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  {tr.next}
                </Button>
              </div>
            )}
          </>
        )}

        {/* Add/Edit Product Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden">
              <CardHeader className="border-b-4 border-foreground">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-foreground">
                    {editingProduct ? tr.editProduct : tr.addNewProduct}
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
                  {/* Product Name */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-foreground mb-1">
                      {tr.product} <span className="text-primary-red">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-foreground bg-white focus:outline-none focus:border-primary-blue"
                      placeholder="e.g., Paracetamol 500mg"
                    />
                  </div>

                  {/* Generic Name */}
                  <div>
                    <label className="block text-sm font-bold text-foreground mb-1">
                      {tr.genericName} <span className="text-foreground/40">({tr.optional})</span>
                    </label>
                    <input
                      type="text"
                      value={formData.generic_name}
                      onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-foreground bg-white focus:outline-none focus:border-primary-blue"
                      placeholder="e.g., Acetaminophen"
                    />
                  </div>

                  {/* Manufacturer */}
                  <div>
                    <label className="block text-sm font-bold text-foreground mb-1">
                      {tr.manufacturer} <span className="text-foreground/40">({tr.optional})</span>
                    </label>
                    <input
                      type="text"
                      value={formData.manufacturer}
                      onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-foreground bg-white focus:outline-none focus:border-primary-blue"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-bold text-foreground mb-1">{tr.category}</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-foreground bg-white focus:outline-none focus:border-primary-blue"
                    >
                      {CATEGORY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {lang === "ne" ? option.labelNe : option.labelEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Schedule */}
                  <div>
                    <label className="block text-sm font-bold text-foreground mb-1">{tr.schedule}</label>
                    <select
                      value={formData.schedule}
                      onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-foreground bg-white focus:outline-none focus:border-primary-blue"
                    >
                      {SCHEDULE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {lang === "ne" ? option.labelNe : option.labelEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Barcode */}
                  <div>
                    <label className="block text-sm font-bold text-foreground mb-1">
                      {tr.barcode} <span className="text-foreground/40">({tr.optional})</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.barcode}
                        onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                        className="flex-1 px-4 py-2 border-2 border-foreground bg-white font-mono focus:outline-none focus:border-primary-blue"
                        placeholder="EAN-13 or custom"
                      />
                      <Button variant="outline" onClick={generateBarcode} type="button">
                        {tr.generateBarcode}
                      </Button>
                    </div>
                  </div>

                  {/* Supplier */}
                  <div>
                    <label className="block text-sm font-bold text-foreground mb-1">
                      {tr.supplier} <span className="text-foreground/40">({tr.optional})</span>
                    </label>
                    <select
                      value={formData.supplier_id}
                      onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-foreground bg-white focus:outline-none focus:border-primary-blue"
                    >
                      <option value="">-- Select Supplier --</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Unit */}
                  <div>
                    <label className="block text-sm font-bold text-foreground mb-1">{tr.unit}</label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-foreground bg-white focus:outline-none focus:border-primary-blue"
                    >
                      {UNIT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {lang === "ne" ? option.labelNe : option.labelEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Pack Size */}
                  <div>
                    <label className="block text-sm font-bold text-foreground mb-1">{tr.packSize}</label>
                    <input
                      type="number"
                      value={formData.pack_size}
                      onChange={(e) => setFormData({ ...formData, pack_size: e.target.value })}
                      min="1"
                      className="w-full px-4 py-2 border-2 border-foreground bg-white focus:outline-none focus:border-primary-blue"
                    />
                  </div>

                  {/* HSN Code */}
                  <div>
                    <label className="block text-sm font-bold text-foreground mb-1">
                      {tr.hsnCode} <span className="text-foreground/40">({tr.optional})</span>
                    </label>
                    <input
                      type="text"
                      value={formData.hsn_code}
                      onChange={(e) => setFormData({ ...formData, hsn_code: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-foreground bg-white focus:outline-none focus:border-primary-blue"
                    />
                  </div>

                  {/* GST Rate */}
                  <div>
                    <label className="block text-sm font-bold text-foreground mb-1">{tr.gstRate}</label>
                    <input
                      type="number"
                      value={formData.gst_rate}
                      onChange={(e) => setFormData({ ...formData, gst_rate: e.target.value })}
                      min="0"
                      max="100"
                      step="0.01"
                      className="w-full px-4 py-2 border-2 border-foreground bg-white focus:outline-none focus:border-primary-blue"
                    />
                  </div>

                  {/* Min Stock Level */}
                  <div>
                    <label className="block text-sm font-bold text-foreground mb-1">{tr.minStock}</label>
                    <input
                      type="number"
                      value={formData.min_stock_level}
                      onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
                      min="0"
                      className="w-full px-4 py-2 border-2 border-foreground bg-white focus:outline-none focus:border-primary-blue"
                    />
                  </div>

                  {/* Max Stock Level */}
                  <div>
                    <label className="block text-sm font-bold text-foreground mb-1">
                      {tr.maxStock} <span className="text-foreground/40">({tr.optional})</span>
                    </label>
                    <input
                      type="number"
                      value={formData.max_stock_level}
                      onChange={(e) => setFormData({ ...formData, max_stock_level: e.target.value })}
                      min="0"
                      className="w-full px-4 py-2 border-2 border-foreground bg-white focus:outline-none focus:border-primary-blue"
                    />
                  </div>

                  {/* Storage Info */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-foreground mb-1">
                      {tr.storageInfo} <span className="text-foreground/40">({tr.optional})</span>
                    </label>
                    <input
                      type="text"
                      value={formData.storage_info}
                      onChange={(e) => setFormData({ ...formData, storage_info: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-foreground bg-white focus:outline-none focus:border-primary-blue"
                      placeholder="e.g., Store below 25°C"
                    />
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-foreground mb-1">
                      {tr.description} <span className="text-foreground/40">({tr.optional})</span>
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
