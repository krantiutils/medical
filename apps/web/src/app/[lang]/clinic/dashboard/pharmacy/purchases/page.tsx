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
}

interface Product {
  id: string;
  name: string;
  generic_name: string | null;
  category: string;
  unit: string;
  gst_rate: string;
}

interface PurchaseItem {
  id: string;
  product_id: string;
  product_name: string;
  product_unit: string;
  batch_number: string;
  expiry_date: string;
  quantity: number;
  purchase_price: number;
  mrp: number;
  selling_price: number;
  gst_rate: number;
}

interface PurchaseHistory {
  id: string;
  batch_number: string;
  invoice_number: string | null;
  received_date: string;
  quantity: number;
  original_qty: number;
  purchase_price: string;
  mrp: string;
  selling_price: string;
  product: {
    id: string;
    name: string;
    generic_name: string | null;
    category: string;
    unit: string;
  };
  supplier: {
    id: string;
    name: string;
  } | null;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type ViewMode = "receive" | "history";

export default function PharmacyPurchasesPage() {
  const { data: session, status } = useSession();
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en";

  const [viewMode, setViewMode] = useState<ViewMode>("receive");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistory[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noClinic, setNoClinic] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [receivedDate, setReceivedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<PurchaseItem[]>([]);

  // Product search state
  const [productSearch, setProductSearch] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  // History filter state
  const [filterSupplierId, setFilterSupplierId] = useState("");
  const [filterInvoice, setFilterInvoice] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  const t = {
    en: {
      title: "Stock Receiving",
      subtitle: "Receive stock from suppliers and track purchases",
      backToDashboard: "Back to Dashboard",
      inventory: "Inventory",
      products: "Products",
      suppliers: "Suppliers",
      // Tabs
      receiveStock: "Receive Stock",
      purchaseHistory: "Purchase History",
      // Form
      supplier: "Supplier",
      selectSupplier: "Select Supplier",
      invoiceNumber: "Invoice Number",
      invoiceNumberPlaceholder: "e.g., INV-2026-001",
      invoiceDate: "Invoice Date",
      receivedDate: "Received Date",
      notes: "Notes",
      notesPlaceholder: "Additional notes about this purchase...",
      // Items
      addItems: "Add Items",
      searchProduct: "Search product...",
      noProductsFound: "No products found",
      product: "Product",
      batch: "Batch No.",
      batchPlaceholder: "e.g., B001",
      expiry: "Expiry Date",
      quantity: "Qty",
      purchasePrice: "Purchase Price",
      mrp: "MRP",
      sellingPrice: "Selling Price",
      gst: "GST %",
      amount: "Amount",
      remove: "Remove",
      // Summary
      itemsCount: "Items",
      totalQuantity: "Total Quantity",
      totalValue: "Total Value",
      // Actions
      receiveStockBtn: "Receive Stock",
      receiving: "Receiving...",
      clearAll: "Clear All",
      // History
      filterBySupplier: "Filter by Supplier",
      allSuppliers: "All Suppliers",
      filterByInvoice: "Filter by Invoice",
      fromDate: "From Date",
      toDate: "To Date",
      applyFilters: "Apply Filters",
      clearFilters: "Clear Filters",
      noHistory: "No Purchase History",
      noHistoryMessage: "No stock has been received yet.",
      date: "Date",
      invoice: "Invoice",
      status: "Status",
      value: "Value",
      // Common
      loading: "Loading...",
      errorLoading: "Failed to load data",
      retry: "Retry",
      loginRequired: "Please log in to manage purchases",
      login: "Login",
      noClinic: "No Verified Clinic",
      noClinicMessage: "You don't have a verified clinic yet.",
      registerClinic: "Register Clinic",
      rs: "Rs.",
      page: "Page",
      of: "of",
      previous: "Previous",
      next: "Next",
      // Validation
      supplierRequired: "Please select a supplier",
      itemsRequired: "Please add at least one item",
      success: "Stock received successfully!",
      itemsCreated: "items added",
      itemsUpdated: "batches updated",
    },
    ne: {
      title: "स्टक प्राप्ति",
      subtitle: "आपूर्तिकर्ताबाट स्टक प्राप्त गर्नुहोस् र खरिदहरू ट्र्याक गर्नुहोस्",
      backToDashboard: "ड्यासबोर्डमा फर्कनुहोस्",
      inventory: "इन्भेन्टरी",
      products: "उत्पादनहरू",
      suppliers: "आपूर्तिकर्ताहरू",
      receiveStock: "स्टक प्राप्त गर्नुहोस्",
      purchaseHistory: "खरिद इतिहास",
      supplier: "आपूर्तिकर्ता",
      selectSupplier: "आपूर्तिकर्ता छान्नुहोस्",
      invoiceNumber: "बिल नम्बर",
      invoiceNumberPlaceholder: "जस्तै, INV-2026-001",
      invoiceDate: "बिल मिति",
      receivedDate: "प्राप्त मिति",
      notes: "टिप्पणी",
      notesPlaceholder: "यस खरिदको बारेमा थप टिप्पणीहरू...",
      addItems: "वस्तुहरू थप्नुहोस्",
      searchProduct: "उत्पादन खोज्नुहोस्...",
      noProductsFound: "कुनै उत्पादन फेला परेन",
      product: "उत्पादन",
      batch: "ब्याच नं.",
      batchPlaceholder: "जस्तै, B001",
      expiry: "म्याद मिति",
      quantity: "मात्रा",
      purchasePrice: "खरिद मूल्य",
      mrp: "MRP",
      sellingPrice: "बिक्री मूल्य",
      gst: "GST %",
      amount: "रकम",
      remove: "हटाउनुहोस्",
      itemsCount: "वस्तुहरू",
      totalQuantity: "कुल मात्रा",
      totalValue: "कुल मूल्य",
      receiveStockBtn: "स्टक प्राप्त गर्नुहोस्",
      receiving: "प्राप्त गर्दै...",
      clearAll: "सबै हटाउनुहोस्",
      filterBySupplier: "आपूर्तिकर्ताद्वारा फिल्टर",
      allSuppliers: "सबै आपूर्तिकर्ता",
      filterByInvoice: "बिलद्वारा फिल्टर",
      fromDate: "मिति देखि",
      toDate: "मिति सम्म",
      applyFilters: "फिल्टर लागू गर्नुहोस्",
      clearFilters: "फिल्टर हटाउनुहोस्",
      noHistory: "कुनै खरिद इतिहास छैन",
      noHistoryMessage: "अहिलेसम्म कुनै स्टक प्राप्त भएको छैन।",
      date: "मिति",
      invoice: "बिल",
      status: "स्थिति",
      value: "मूल्य",
      loading: "लोड हुँदैछ...",
      errorLoading: "डाटा लोड गर्न असफल भयो",
      retry: "पुन: प्रयास गर्नुहोस्",
      loginRequired: "खरिद व्यवस्थापन गर्न कृपया लगइन गर्नुहोस्",
      login: "लगइन गर्नुहोस्",
      noClinic: "कुनै प्रमाणित क्लिनिक छैन",
      noClinicMessage: "तपाईंसँग अझै प्रमाणित क्लिनिक छैन।",
      registerClinic: "क्लिनिक दर्ता गर्नुहोस्",
      rs: "रु.",
      page: "पृष्ठ",
      of: "को",
      previous: "अघिल्लो",
      next: "अर्को",
      supplierRequired: "कृपया आपूर्तिकर्ता छान्नुहोस्",
      itemsRequired: "कृपया कम्तिमा एउटा वस्तु थप्नुहोस्",
      success: "स्टक सफलतापूर्वक प्राप्त भयो!",
      itemsCreated: "वस्तुहरू थपिए",
      itemsUpdated: "ब्याचहरू अपडेट भए",
    },
  };

  const tr = t[lang as keyof typeof t] || t.en;

  const formatCurrency = (amount: number) => {
    return `${tr.rs} ${amount.toLocaleString(lang === "ne" ? "ne-NP" : "en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(
      lang === "ne" ? "ne-NP" : "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  };

  const fetchSuppliers = useCallback(async () => {
    try {
      const response = await fetch("/api/clinic/pharmacy/suppliers?isActive=true");
      if (response.status === 404) {
        const data = await response.json();
        if (data.code === "NO_CLINIC") {
          setNoClinic(true);
          return;
        }
      }
      if (!response.ok) throw new Error("Failed to fetch suppliers");
      const data = await response.json();
      setSuppliers(data.suppliers || []);
    } catch (err) {
      console.error("Error fetching suppliers:", err);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch(
        "/api/clinic/pharmacy/products?isActive=true&limit=1000"
      );
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  }, []);

  const fetchPurchaseHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", pagination.page.toString());
      params.set("limit", "20");
      if (filterSupplierId) params.set("supplierId", filterSupplierId);
      if (filterInvoice) params.set("invoiceNumber", filterInvoice);
      if (filterStartDate) params.set("startDate", filterStartDate);
      if (filterEndDate) params.set("endDate", filterEndDate);

      const response = await fetch(`/api/clinic/pharmacy/purchases?${params}`);
      if (!response.ok) throw new Error("Failed to fetch purchase history");
      const data = await response.json();
      setPurchaseHistory(data.batches || []);
      setPagination(
        data.pagination || { total: 0, page: 1, limit: 20, totalPages: 0 }
      );
    } catch (err) {
      console.error("Error fetching purchase history:", err);
      setError(tr.errorLoading);
    } finally {
      setLoading(false);
    }
  }, [
    pagination.page,
    filterSupplierId,
    filterInvoice,
    filterStartDate,
    filterEndDate,
    tr.errorLoading,
  ]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchSuppliers();
      fetchProducts();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, fetchSuppliers, fetchProducts]);

  useEffect(() => {
    if (status === "authenticated" && viewMode === "history") {
      fetchPurchaseHistory();
    }
  }, [status, viewMode, fetchPurchaseHistory]);

  useEffect(() => {
    if (productSearch.trim()) {
      const filtered = products.filter(
        (p) =>
          p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
          p.generic_name?.toLowerCase().includes(productSearch.toLowerCase())
      );
      setFilteredProducts(filtered.slice(0, 10));
      setShowProductDropdown(true);
    } else {
      setFilteredProducts([]);
      setShowProductDropdown(false);
    }
  }, [productSearch, products]);

  const addItem = (product: Product) => {
    const newItem: PurchaseItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      product_id: product.id,
      product_name: product.name,
      product_unit: product.unit,
      batch_number: "",
      expiry_date: "",
      quantity: 1,
      purchase_price: 0,
      mrp: 0,
      selling_price: 0,
      gst_rate: parseFloat(product.gst_rate) || 0,
    };
    setItems([...items, newItem]);
    setProductSearch("");
    setShowProductDropdown(false);
  };

  const updateItem = (
    id: string,
    field: keyof PurchaseItem,
    value: string | number
  ) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const clearForm = () => {
    setSelectedSupplierId("");
    setInvoiceNumber("");
    setInvoiceDate("");
    setReceivedDate(new Date().toISOString().split("T")[0]);
    setNotes("");
    setItems([]);
    setSuccessMessage(null);
    setError(null);
  };

  const calculateItemAmount = (item: PurchaseItem) => {
    return item.purchase_price * item.quantity;
  };

  const calculateTotals = () => {
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = items.reduce(
      (sum, item) => sum + calculateItemAmount(item),
      0
    );
    return { totalQuantity, totalValue };
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccessMessage(null);

    // Validation
    if (!selectedSupplierId) {
      setError(tr.supplierRequired);
      return;
    }

    if (items.length === 0) {
      setError(tr.itemsRequired);
      return;
    }

    // Validate all items have required fields
    const invalidItems = items.filter(
      (item) =>
        !item.batch_number.trim() ||
        !item.expiry_date ||
        item.quantity <= 0 ||
        item.purchase_price < 0 ||
        item.mrp < 0 ||
        item.selling_price < 0
    );

    if (invalidItems.length > 0) {
      setError(
        lang === "ne"
          ? "कृपया सबै वस्तुहरूको विवरण पूरा गर्नुहोस्"
          : "Please complete all item details"
      );
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/clinic/pharmacy/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplier_id: selectedSupplierId,
          invoice_number: invoiceNumber.trim() || null,
          invoice_date: invoiceDate || null,
          received_date: receivedDate || null,
          notes: notes.trim() || null,
          items: items.map((item) => ({
            product_id: item.product_id,
            batch_number: item.batch_number.trim(),
            expiry_date: item.expiry_date,
            quantity: item.quantity,
            purchase_price: item.purchase_price,
            mrp: item.mrp,
            selling_price: item.selling_price,
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          data.details?.join(", ") || data.error || "Failed to receive stock"
        );
      }

      const data = await response.json();
      setSuccessMessage(
        `${tr.success} ${data.summary.created} ${tr.itemsCreated}, ${data.summary.updated} ${tr.itemsUpdated}`
      );
      clearForm();
    } catch (err) {
      console.error("Error receiving stock:", err);
      setError(err instanceof Error ? err.message : "Failed to receive stock");
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (
    status === "loading" ||
    (status === "authenticated" && loading && suppliers.length === 0)
  ) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-foreground/10 rounded w-1/3"></div>
            <div className="h-4 bg-foreground/10 rounded w-1/2"></div>
            <div className="h-64 bg-foreground/10 rounded mt-8"></div>
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
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
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
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
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

  const { totalQuantity, totalValue } = calculateTotals();

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-foreground/60 mb-2">
              <Link
                href={`/${lang}/clinic/dashboard`}
                className="hover:text-primary-blue"
              >
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
            <Link href={`/${lang}/clinic/dashboard/pharmacy/inventory`}>
              <Button variant="outline" size="sm">
                {tr.inventory}
              </Button>
            </Link>
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
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setViewMode("receive")}
            className={`px-4 py-2 font-bold text-sm uppercase tracking-wider border-2 border-foreground transition-all ${
              viewMode === "receive"
                ? "bg-primary-blue text-white shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
                : "bg-white hover:bg-gray-50"
            }`}
          >
            {tr.receiveStock}
          </button>
          <button
            onClick={() => setViewMode("history")}
            className={`px-4 py-2 font-bold text-sm uppercase tracking-wider border-2 border-foreground transition-all ${
              viewMode === "history"
                ? "bg-primary-yellow text-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
                : "bg-white hover:bg-gray-50"
            }`}
          >
            {tr.purchaseHistory}
          </button>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-100 border-2 border-green-500 rounded text-green-700 flex items-center gap-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-100 border-2 border-red-500 rounded text-red-700 flex items-center gap-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            {error}
          </div>
        )}

        {/* Receive Stock View */}
        {viewMode === "receive" && (
          <div className="space-y-6">
            {/* Invoice Details */}
            <Card className="border-4 border-foreground shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
              <CardHeader className="border-b-4 border-foreground bg-foreground text-white">
                <h2 className="text-lg font-bold uppercase tracking-wider">
                  {lang === "ne" ? "बिल विवरण" : "Invoice Details"}
                </h2>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Supplier */}
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-wider mb-2">
                      {tr.supplier} <span className="text-primary-red">*</span>
                    </label>
                    <select
                      value={selectedSupplierId}
                      onChange={(e) => setSelectedSupplierId(e.target.value)}
                      className="w-full p-3 border-2 border-foreground focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    >
                      <option value="">{tr.selectSupplier}</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Invoice Number */}
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-wider mb-2">
                      {tr.invoiceNumber}
                    </label>
                    <input
                      type="text"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      placeholder={tr.invoiceNumberPlaceholder}
                      className="w-full p-3 border-2 border-foreground focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    />
                  </div>

                  {/* Invoice Date */}
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-wider mb-2">
                      {tr.invoiceDate}
                    </label>
                    <input
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      className="w-full p-3 border-2 border-foreground focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    />
                  </div>

                  {/* Received Date */}
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-wider mb-2">
                      {tr.receivedDate}
                    </label>
                    <input
                      type="date"
                      value={receivedDate}
                      onChange={(e) => setReceivedDate(e.target.value)}
                      className="w-full p-3 border-2 border-foreground focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="mt-4">
                  <label className="block text-sm font-bold uppercase tracking-wider mb-2">
                    {tr.notes}
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={tr.notesPlaceholder}
                    rows={2}
                    className="w-full p-3 border-2 border-foreground focus:outline-none focus:ring-2 focus:ring-primary-blue resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Add Items */}
            <Card className="border-4 border-foreground shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
              <CardHeader className="border-b-4 border-foreground bg-primary-blue text-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold uppercase tracking-wider">
                    {tr.addItems}
                  </h2>
                  <span className="bg-white text-primary-blue px-3 py-1 rounded-full text-sm font-bold">
                    {items.length} {tr.itemsCount}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {/* Product Search */}
                <div className="relative mb-4">
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder={tr.searchProduct}
                    className="w-full p-3 border-2 border-foreground focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  />
                  {showProductDropdown && filteredProducts.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border-2 border-foreground shadow-lg max-h-60 overflow-auto">
                      {filteredProducts.map((product) => (
                        <button
                          key={product.id}
                          onClick={() => addItem(product)}
                          className="w-full p-3 text-left hover:bg-primary-blue/10 border-b border-foreground/20 last:border-b-0"
                        >
                          <div className="font-bold">{product.name}</div>
                          {product.generic_name && (
                            <div className="text-xs text-foreground/60">
                              {product.generic_name}
                            </div>
                          )}
                          <div className="text-xs text-primary-blue mt-1">
                            {product.category} | {product.unit}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {showProductDropdown && filteredProducts.length === 0 && productSearch.trim() && (
                    <div className="absolute z-10 w-full mt-1 bg-white border-2 border-foreground shadow-lg p-3 text-foreground/60">
                      {tr.noProductsFound}
                    </div>
                  )}
                </div>

                {/* Items Table */}
                {items.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full border-2 border-foreground">
                      <thead>
                        <tr className="bg-foreground/10">
                          <th className="p-2 text-left text-xs uppercase tracking-wider border-b-2 border-foreground">
                            {tr.product}
                          </th>
                          <th className="p-2 text-left text-xs uppercase tracking-wider border-b-2 border-foreground">
                            {tr.batch}
                          </th>
                          <th className="p-2 text-left text-xs uppercase tracking-wider border-b-2 border-foreground">
                            {tr.expiry}
                          </th>
                          <th className="p-2 text-center text-xs uppercase tracking-wider border-b-2 border-foreground">
                            {tr.quantity}
                          </th>
                          <th className="p-2 text-right text-xs uppercase tracking-wider border-b-2 border-foreground">
                            {tr.purchasePrice}
                          </th>
                          <th className="p-2 text-right text-xs uppercase tracking-wider border-b-2 border-foreground">
                            {tr.mrp}
                          </th>
                          <th className="p-2 text-right text-xs uppercase tracking-wider border-b-2 border-foreground">
                            {tr.sellingPrice}
                          </th>
                          <th className="p-2 text-right text-xs uppercase tracking-wider border-b-2 border-foreground">
                            {tr.amount}
                          </th>
                          <th className="p-2 text-center text-xs uppercase tracking-wider border-b-2 border-foreground">
                            {tr.remove}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, idx) => (
                          <tr
                            key={item.id}
                            className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                          >
                            <td className="p-2 border-b border-foreground/20">
                              <div className="font-bold text-sm">
                                {item.product_name}
                              </div>
                              <div className="text-xs text-foreground/60">
                                {item.product_unit}
                              </div>
                            </td>
                            <td className="p-2 border-b border-foreground/20">
                              <input
                                type="text"
                                value={item.batch_number}
                                onChange={(e) =>
                                  updateItem(item.id, "batch_number", e.target.value)
                                }
                                placeholder={tr.batchPlaceholder}
                                className="w-24 p-1 text-sm border-2 border-foreground/50 focus:border-foreground focus:outline-none"
                              />
                            </td>
                            <td className="p-2 border-b border-foreground/20">
                              <input
                                type="date"
                                value={item.expiry_date}
                                onChange={(e) =>
                                  updateItem(item.id, "expiry_date", e.target.value)
                                }
                                className="w-32 p-1 text-sm border-2 border-foreground/50 focus:border-foreground focus:outline-none"
                              />
                            </td>
                            <td className="p-2 border-b border-foreground/20 text-center">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) =>
                                  updateItem(
                                    item.id,
                                    "quantity",
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className="w-16 p-1 text-sm text-center border-2 border-foreground/50 focus:border-foreground focus:outline-none"
                              />
                            </td>
                            <td className="p-2 border-b border-foreground/20 text-right">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.purchase_price}
                                onChange={(e) =>
                                  updateItem(
                                    item.id,
                                    "purchase_price",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-20 p-1 text-sm text-right border-2 border-foreground/50 focus:border-foreground focus:outline-none"
                              />
                            </td>
                            <td className="p-2 border-b border-foreground/20 text-right">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.mrp}
                                onChange={(e) =>
                                  updateItem(
                                    item.id,
                                    "mrp",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-20 p-1 text-sm text-right border-2 border-foreground/50 focus:border-foreground focus:outline-none"
                              />
                            </td>
                            <td className="p-2 border-b border-foreground/20 text-right">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.selling_price}
                                onChange={(e) =>
                                  updateItem(
                                    item.id,
                                    "selling_price",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-20 p-1 text-sm text-right border-2 border-foreground/50 focus:border-foreground focus:outline-none"
                              />
                            </td>
                            <td className="p-2 border-b border-foreground/20 text-right font-bold">
                              {formatCurrency(calculateItemAmount(item))}
                            </td>
                            <td className="p-2 border-b border-foreground/20 text-center">
                              <button
                                onClick={() => removeItem(item.id)}
                                className="text-primary-red hover:text-primary-red/80"
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {items.length === 0 && (
                  <div className="text-center py-8 text-foreground/60">
                    <svg
                      className="w-12 h-12 mx-auto mb-2 text-foreground/30"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                    <p>
                      {lang === "ne"
                        ? "वस्तुहरू थप्न माथिको खोजमा उत्पादन खोज्नुहोस्"
                        : "Search for products above to add items"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Summary and Actions */}
            {items.length > 0 && (
              <Card className="border-4 border-foreground shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex gap-8">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-foreground/60">
                          {tr.itemsCount}
                        </p>
                        <p className="text-2xl font-black">{items.length}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-foreground/60">
                          {tr.totalQuantity}
                        </p>
                        <p className="text-2xl font-black">{totalQuantity}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-foreground/60">
                          {tr.totalValue}
                        </p>
                        <p className="text-2xl font-black text-primary-blue">
                          {formatCurrency(totalValue)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={clearForm}
                        disabled={submitting}
                      >
                        {tr.clearAll}
                      </Button>
                      <Button
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={submitting}
                      >
                        {submitting ? tr.receiving : tr.receiveStockBtn}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Purchase History View */}
        {viewMode === "history" && (
          <div className="space-y-6">
            {/* Filters */}
            <Card className="border-4 border-foreground shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-wider mb-2">
                      {tr.filterBySupplier}
                    </label>
                    <select
                      value={filterSupplierId}
                      onChange={(e) => setFilterSupplierId(e.target.value)}
                      className="w-full p-2 border-2 border-foreground focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    >
                      <option value="">{tr.allSuppliers}</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-wider mb-2">
                      {tr.filterByInvoice}
                    </label>
                    <input
                      type="text"
                      value={filterInvoice}
                      onChange={(e) => setFilterInvoice(e.target.value)}
                      placeholder={tr.invoiceNumberPlaceholder}
                      className="w-full p-2 border-2 border-foreground focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-wider mb-2">
                      {tr.fromDate}
                    </label>
                    <input
                      type="date"
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                      className="w-full p-2 border-2 border-foreground focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-wider mb-2">
                      {tr.toDate}
                    </label>
                    <input
                      type="date"
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                      className="w-full p-2 border-2 border-foreground focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <Button
                      variant="primary"
                      onClick={() => {
                        setPagination((prev) => ({ ...prev, page: 1 }));
                        fetchPurchaseHistory();
                      }}
                    >
                      {tr.applyFilters}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFilterSupplierId("");
                        setFilterInvoice("");
                        setFilterStartDate("");
                        setFilterEndDate("");
                      }}
                    >
                      {tr.clearFilters}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* History Table */}
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-foreground/10 rounded"></div>
                ))}
              </div>
            ) : purchaseHistory.length === 0 ? (
              <Card className="border-4 border-foreground shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{tr.noHistory}</h3>
                  <p className="text-foreground/70">{tr.noHistoryMessage}</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full border-4 border-foreground bg-white">
                    <thead>
                      <tr className="bg-foreground text-white">
                        <th className="p-3 text-left text-xs uppercase tracking-wider">
                          {tr.date}
                        </th>
                        <th className="p-3 text-left text-xs uppercase tracking-wider">
                          {tr.invoice}
                        </th>
                        <th className="p-3 text-left text-xs uppercase tracking-wider">
                          {tr.product}
                        </th>
                        <th className="p-3 text-left text-xs uppercase tracking-wider">
                          {tr.batch}
                        </th>
                        <th className="p-3 text-left text-xs uppercase tracking-wider">
                          {tr.supplier}
                        </th>
                        <th className="p-3 text-center text-xs uppercase tracking-wider">
                          {tr.quantity}
                        </th>
                        <th className="p-3 text-right text-xs uppercase tracking-wider">
                          {tr.purchasePrice}
                        </th>
                        <th className="p-3 text-right text-xs uppercase tracking-wider">
                          {tr.value}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseHistory.map((batch, idx) => (
                        <tr
                          key={batch.id}
                          className={`border-b-2 border-foreground/20 ${
                            idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }`}
                        >
                          <td className="p-3">
                            {formatDate(batch.received_date)}
                          </td>
                          <td className="p-3 font-mono text-sm">
                            {batch.invoice_number || "-"}
                          </td>
                          <td className="p-3">
                            <div className="font-bold">{batch.product.name}</div>
                            {batch.product.generic_name && (
                              <div className="text-xs text-foreground/60">
                                {batch.product.generic_name}
                              </div>
                            )}
                          </td>
                          <td className="p-3 font-mono text-sm">
                            {batch.batch_number}
                          </td>
                          <td className="p-3 text-sm">
                            {batch.supplier?.name || "-"}
                          </td>
                          <td className="p-3 text-center">
                            <span className="font-bold">
                              {batch.original_qty}
                            </span>
                            <span className="text-xs text-foreground/60 ml-1">
                              {batch.product.unit}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            {formatCurrency(parseFloat(batch.purchase_price))}
                          </td>
                          <td className="p-3 text-right font-bold">
                            {formatCurrency(
                              parseFloat(batch.purchase_price) *
                                batch.original_qty
                            )}
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
                        onClick={() =>
                          setPagination((prev) => ({
                            ...prev,
                            page: prev.page - 1,
                          }))
                        }
                      >
                        {tr.previous}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page >= pagination.totalPages}
                        onClick={() =>
                          setPagination((prev) => ({
                            ...prev,
                            page: prev.page + 1,
                          }))
                        }
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
      </div>
    </div>
  );
}
