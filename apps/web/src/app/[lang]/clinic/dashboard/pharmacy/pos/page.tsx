"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Types
interface Product {
  id: string;
  name: string;
  generic_name: string | null;
  category: string;
  unit: string;
  pack_size: number;
  gst_rate: string;
  is_active: boolean;
}

interface Batch {
  id: string;
  batch_number: string;
  expiry_date: string;
  quantity: number;
  mrp: string;
  selling_price: string;
  purchase_price: string;
}

interface ProductWithBatch extends Product {
  batches: Batch[];
  totalStock: number;
}

interface CartItem {
  product_id: string;
  batch_id: string;
  product_name: string;
  batch_number: string;
  quantity: number;
  unit_price: number;
  mrp: number;
  discount: number;
  discount_type: "percent" | "amount";
  gst_rate: number;
  gst_amount: number;
  amount: number;
  max_quantity: number;
  expiry_date: string;
  unit: string;
}

interface CreditAccount {
  id: string;
  customer_name: string;
  phone: string | null;
  current_balance: string;
  credit_limit: string;
}

// Payment modes
const PAYMENT_MODES = [
  { value: "CASH", labelEn: "Cash", labelNe: "नगद" },
  { value: "CARD", labelEn: "Card", labelNe: "कार्ड" },
  { value: "UPI", labelEn: "UPI", labelNe: "यूपीआई" },
  { value: "BANK_TRANSFER", labelEn: "Bank Transfer", labelNe: "बैंक ट्रान्सफर" },
  { value: "CREDIT", labelEn: "Credit (Khata)", labelNe: "उधारो (खाता)" },
];

export default function PharmacyPOSPage() {
  const { data: session, status } = useSession();
  const params = useParams<{ lang: string }>();
  const router = useRouter();
  const lang = params?.lang || "en";
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // State
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noClinic, setNoClinic] = useState(false);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [clinicName, setClinicName] = useState<string>("");

  // Product search state
  const [searchQuery, setSearchQuery] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [searchResults, setSearchResults] = useState<ProductWithBatch[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [globalDiscount, setGlobalDiscount] = useState<number>(0);
  const [globalDiscountType, setGlobalDiscountType] = useState<"percent" | "amount">("percent");

  // Payment state
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [amountReceived, setAmountReceived] = useState("");
  const [notes, setNotes] = useState("");
  const [prescriptionId, setPrescriptionId] = useState("");

  // Credit sale state
  const [creditAccounts, setCreditAccounts] = useState<CreditAccount[]>([]);
  const [selectedCreditAccount, setSelectedCreditAccount] = useState<string>("");
  const [newCreditCustomer, setNewCreditCustomer] = useState({
    name: "",
    phone: "",
    address: "",
  });
  const [showNewCreditForm, setShowNewCreditForm] = useState(false);

  // Sale completion state
  const [saleComplete, setSaleComplete] = useState(false);
  const [completedSale, setCompletedSale] = useState<{
    sale_number: string;
    total: number;
    amount_paid: number;
    change: number;
    receipt: string;
  } | null>(null);

  // Translations
  const t = {
    en: {
      title: "Pharmacy POS",
      subtitle: "Process sales and manage billing",
      backToDashboard: "Back to Dashboard",
      searchProduct: "Search product by name, generic name, or barcode",
      barcodeInput: "Scan barcode or enter product code",
      scan: "Scan",
      noProducts: "No products found",
      addToCart: "Add to Cart",
      cart: "Cart",
      emptyCart: "Cart is empty",
      emptyCartMessage: "Search for products to add them to the cart",
      product: "Product",
      batch: "Batch",
      expiry: "Expiry",
      qty: "Qty",
      price: "Price",
      discount: "Discount",
      gst: "GST",
      amount: "Amount",
      remove: "Remove",
      subtotal: "Subtotal",
      totalDiscount: "Total Discount",
      totalGST: "Total GST",
      grandTotal: "Grand Total",
      globalDiscount: "Bill Discount",
      percent: "%",
      amount_label: "Rs.",
      payment: "Payment",
      paymentMode: "Payment Mode",
      amountReceived: "Amount Received",
      change: "Change",
      notes: "Notes (optional)",
      prescriptionId: "Prescription ID (optional)",
      completeSale: "Complete Sale",
      processing: "Processing...",
      printReceipt: "Print Receipt",
      newSale: "New Sale",
      saleComplete: "Sale Complete!",
      saleNumber: "Sale #",
      totalAmount: "Total Amount",
      paidAmount: "Amount Paid",
      changeAmount: "Change",
      creditSale: "Credit Sale",
      selectCustomer: "Select Customer",
      newCustomer: "New Customer",
      customerName: "Customer Name",
      customerPhone: "Phone Number",
      customerAddress: "Address (optional)",
      addCustomer: "Add Customer",
      cancel: "Cancel",
      creditBalance: "Current Balance",
      creditLimit: "Credit Limit",
      outOfStock: "Out of Stock",
      lowStock: "Low Stock",
      expiringSoon: "Expiring Soon",
      expired: "Expired",
      unit: "Unit",
      inStock: "in stock",
      loginRequired: "Please log in to access the POS",
      login: "Login",
      noClinic: "No Verified Clinic",
      noClinicMessage: "You don't have a verified pharmacy/clinic. Register your clinic to access the POS.",
      registerClinic: "Register Clinic",
      errorLoading: "Failed to load",
      retry: "Retry",
      insufficientStock: "Insufficient stock",
      invalidQuantity: "Invalid quantity",
      maxQuantity: "Max available",
      fefo: "FEFO: First Expired First Out",
    },
    ne: {
      title: "फार्मेसी पीओएस",
      subtitle: "बिक्री प्रक्रिया र बिलिङ व्यवस्थापन",
      backToDashboard: "ड्यासबोर्डमा फर्कनुहोस्",
      searchProduct: "नाम, जेनेरिक नाम, वा बारकोडद्वारा उत्पादन खोज्नुहोस्",
      barcodeInput: "बारकोड स्क्यान गर्नुहोस् वा उत्पादन कोड राख्नुहोस्",
      scan: "स्क्यान",
      noProducts: "कुनै उत्पादन फेला परेन",
      addToCart: "कार्टमा थप्नुहोस्",
      cart: "कार्ट",
      emptyCart: "कार्ट खाली छ",
      emptyCartMessage: "उत्पादनहरू कार्टमा थप्न खोज्नुहोस्",
      product: "उत्पादन",
      batch: "ब्याच",
      expiry: "म्याद",
      qty: "मात्रा",
      price: "मूल्य",
      discount: "छुट",
      gst: "जीएसटी",
      amount: "रकम",
      remove: "हटाउनुहोस्",
      subtotal: "उप-कुल",
      totalDiscount: "कुल छुट",
      totalGST: "कुल जीएसटी",
      grandTotal: "जम्मा कुल",
      globalDiscount: "बिल छुट",
      percent: "%",
      amount_label: "रु.",
      payment: "भुक्तानी",
      paymentMode: "भुक्तानी मोड",
      amountReceived: "प्राप्त रकम",
      change: "फिर्ता",
      notes: "नोट (वैकल्पिक)",
      prescriptionId: "प्रिस्क्रिप्शन आईडी (वैकल्पिक)",
      completeSale: "बिक्री पूरा गर्नुहोस्",
      processing: "प्रशोधन हुँदैछ...",
      printReceipt: "रसिद प्रिन्ट गर्नुहोस्",
      newSale: "नयाँ बिक्री",
      saleComplete: "बिक्री पूरा भयो!",
      saleNumber: "बिक्री #",
      totalAmount: "कुल रकम",
      paidAmount: "भुक्तानी गरिएको रकम",
      changeAmount: "फिर्ता",
      creditSale: "उधारो बिक्री",
      selectCustomer: "ग्राहक छान्नुहोस्",
      newCustomer: "नयाँ ग्राहक",
      customerName: "ग्राहकको नाम",
      customerPhone: "फोन नम्बर",
      customerAddress: "ठेगाना (वैकल्पिक)",
      addCustomer: "ग्राहक थप्नुहोस्",
      cancel: "रद्द गर्नुहोस्",
      creditBalance: "हालको ब्यालेन्स",
      creditLimit: "क्रेडिट लिमिट",
      outOfStock: "स्टक छैन",
      lowStock: "कम स्टक",
      expiringSoon: "छिट्टै म्याद सकिने",
      expired: "म्याद सकिएको",
      unit: "इकाई",
      inStock: "स्टकमा",
      loginRequired: "पीओएस पहुँच गर्न कृपया लगइन गर्नुहोस्",
      login: "लगइन गर्नुहोस्",
      noClinic: "कुनै प्रमाणित क्लिनिक छैन",
      noClinicMessage: "तपाईंसँग प्रमाणित फार्मेसी/क्लिनिक छैन। पीओएस पहुँच गर्न तपाईंको क्लिनिक दर्ता गर्नुहोस्।",
      registerClinic: "क्लिनिक दर्ता गर्नुहोस्",
      errorLoading: "लोड गर्न असफल",
      retry: "पुन: प्रयास",
      insufficientStock: "स्टक अपर्याप्त",
      invalidQuantity: "अमान्य मात्रा",
      maxQuantity: "अधिकतम उपलब्ध",
      fefo: "FEFO: पहिले म्याद सकिने पहिले बाहिर",
    },
  };

  const text = t[lang as keyof typeof t] || t.en;

  // Load clinic info on mount
  const loadClinicInfo = useCallback(async () => {
    try {
      const response = await fetch("/api/clinic/dashboard");
      if (!response.ok) {
        const data = await response.json();
        if (data.code === "NO_CLINIC") {
          setNoClinic(true);
          return;
        }
        throw new Error(data.error);
      }
      const data = await response.json();
      setClinicId(data.clinic.id);
      setClinicName(data.clinic.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load clinic info");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load credit accounts
  const loadCreditAccounts = useCallback(async () => {
    try {
      const response = await fetch("/api/clinic/pharmacy/credit-accounts");
      if (response.ok) {
        const data = await response.json();
        setCreditAccounts(data.accounts || []);
      }
    } catch (err) {
      console.error("Failed to load credit accounts:", err);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      loadClinicInfo();
      loadCreditAccounts();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, loadClinicInfo, loadCreditAccounts]);

  // Focus barcode input on load
  useEffect(() => {
    if (!loading && !noClinic && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [loading, noClinic]);

  // Search products
  const searchProducts = useCallback(
    async (query: string) => {
      if (!query.trim() || query.length < 2) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      setSearching(true);
      try {
        const response = await fetch(
          `/api/clinic/pharmacy/pos/search?q=${encodeURIComponent(query)}`
        );
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data.products || []);
          setShowSearchResults(true);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setSearching(false);
      }
    },
    []
  );

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchProducts(searchQuery);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchProducts]);

  // Handle barcode scan
  const handleBarcodeScan = async () => {
    if (!barcodeInput.trim()) return;

    setSearching(true);
    try {
      const response = await fetch(
        `/api/clinic/pharmacy/pos/search?barcode=${encodeURIComponent(barcodeInput)}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.products && data.products.length === 1) {
          // Auto-add to cart if single product found
          addToCart(data.products[0]);
        } else if (data.products && data.products.length > 1) {
          // Show search results if multiple
          setSearchResults(data.products);
          setShowSearchResults(true);
        } else {
          setError("Product not found");
          setTimeout(() => setError(null), 3000);
        }
      }
    } catch (err) {
      console.error("Barcode scan error:", err);
    } finally {
      setSearching(false);
      setBarcodeInput("");
      barcodeInputRef.current?.focus();
    }
  };

  // Add product to cart using FEFO (First Expired First Out)
  const addToCart = (product: ProductWithBatch) => {
    // Filter active batches with stock and sort by expiry date (FEFO)
    const availableBatches = product.batches
      .filter(
        (b) =>
          b.quantity > 0 && new Date(b.expiry_date) > new Date()
      )
      .sort(
        (a, b) =>
          new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()
      );

    if (availableBatches.length === 0) {
      setError(text.outOfStock);
      setTimeout(() => setError(null), 3000);
      return;
    }

    const batch = availableBatches[0]; // FEFO - first expired first
    const gstRate = parseFloat(product.gst_rate) || 0;
    const unitPrice = parseFloat(batch.selling_price);
    const gstAmount = (unitPrice * gstRate) / 100;

    // Check if already in cart
    const existingIndex = cart.findIndex(
      (item) => item.product_id === product.id && item.batch_id === batch.id
    );

    if (existingIndex >= 0) {
      // Increment quantity if already in cart
      const existing = cart[existingIndex];
      if (existing.quantity >= batch.quantity) {
        setError(`${text.maxQuantity}: ${batch.quantity}`);
        setTimeout(() => setError(null), 3000);
        return;
      }
      updateCartItemQuantity(existingIndex, existing.quantity + 1);
    } else {
      // Add new item
      const newItem: CartItem = {
        product_id: product.id,
        batch_id: batch.id,
        product_name: product.name,
        batch_number: batch.batch_number,
        quantity: 1,
        unit_price: unitPrice,
        mrp: parseFloat(batch.mrp),
        discount: 0,
        discount_type: "percent",
        gst_rate: gstRate,
        gst_amount: gstAmount,
        amount: unitPrice + gstAmount,
        max_quantity: batch.quantity,
        expiry_date: batch.expiry_date,
        unit: product.unit,
      };
      setCart([...cart, newItem]);
    }

    // Clear search
    setSearchQuery("");
    setShowSearchResults(false);
    barcodeInputRef.current?.focus();
  };

  // Update cart item quantity
  const updateCartItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    const item = cart[index];
    if (newQuantity > item.max_quantity) {
      setError(`${text.maxQuantity}: ${item.max_quantity}`);
      setTimeout(() => setError(null), 3000);
      return;
    }

    const updatedCart = [...cart];
    const unitPrice = item.unit_price;
    const discount =
      item.discount_type === "percent"
        ? (unitPrice * item.discount) / 100
        : item.discount / newQuantity;
    const priceAfterDiscount = unitPrice - discount;
    const gstAmount = (priceAfterDiscount * item.gst_rate) / 100;

    updatedCart[index] = {
      ...item,
      quantity: newQuantity,
      gst_amount: gstAmount * newQuantity,
      amount: (priceAfterDiscount + gstAmount) * newQuantity,
    };

    setCart(updatedCart);
  };

  // Update cart item discount
  const updateCartItemDiscount = (
    index: number,
    discount: number,
    discountType: "percent" | "amount"
  ) => {
    const item = cart[index];
    const updatedCart = [...cart];

    const unitPrice = item.unit_price;
    let discountAmount: number;
    if (discountType === "percent") {
      discountAmount = (unitPrice * discount) / 100;
    } else {
      discountAmount = discount / item.quantity;
    }
    const priceAfterDiscount = unitPrice - discountAmount;
    const gstAmount = (priceAfterDiscount * item.gst_rate) / 100;

    updatedCart[index] = {
      ...item,
      discount,
      discount_type: discountType,
      gst_amount: gstAmount * item.quantity,
      amount: (priceAfterDiscount + gstAmount) * item.quantity,
    };

    setCart(updatedCart);
  };

  // Remove item from cart
  const removeFromCart = (index: number) => {
    const updatedCart = [...cart];
    updatedCart.splice(index, 1);
    setCart(updatedCart);
  };

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = cart.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0
    );
    const itemDiscount = cart.reduce((sum, item) => {
      if (item.discount_type === "percent") {
        return sum + (item.unit_price * item.discount * item.quantity) / 100;
      }
      return sum + item.discount;
    }, 0);
    const priceAfterItemDiscount = subtotal - itemDiscount;
    const billDiscount =
      globalDiscountType === "percent"
        ? (priceAfterItemDiscount * globalDiscount) / 100
        : globalDiscount;
    const totalDiscount = itemDiscount + billDiscount;
    const totalGST = cart.reduce((sum, item) => sum + item.gst_amount, 0);
    const grandTotal = subtotal - totalDiscount + totalGST;

    return {
      subtotal,
      itemDiscount,
      billDiscount,
      totalDiscount,
      totalGST,
      grandTotal,
    };
  };

  const totals = calculateTotals();

  // Calculate change
  const change =
    paymentMode !== "CREDIT"
      ? Math.max(0, parseFloat(amountReceived || "0") - totals.grandTotal)
      : 0;

  // Create new credit account
  const createCreditAccount = async () => {
    if (!newCreditCustomer.name.trim()) return;

    try {
      const response = await fetch("/api/clinic/pharmacy/credit-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCreditCustomer),
      });

      if (response.ok) {
        const data = await response.json();
        setCreditAccounts([...creditAccounts, data.account]);
        setSelectedCreditAccount(data.account.id);
        setShowNewCreditForm(false);
        setNewCreditCustomer({ name: "", phone: "", address: "" });
      }
    } catch (err) {
      console.error("Failed to create credit account:", err);
    }
  };

  // Complete sale
  const completeSale = async () => {
    if (cart.length === 0) return;
    if (
      paymentMode !== "CREDIT" &&
      parseFloat(amountReceived || "0") < totals.grandTotal
    ) {
      setError("Insufficient payment amount");
      setTimeout(() => setError(null), 3000);
      return;
    }
    if (paymentMode === "CREDIT" && !selectedCreditAccount) {
      setError("Please select a credit account");
      setTimeout(() => setError(null), 3000);
      return;
    }

    setProcessing(true);
    try {
      const saleData = {
        items: cart.map((item) => ({
          product_id: item.product_id,
          batch_id: item.batch_id,
          product_name: item.product_name,
          batch_number: item.batch_number,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: item.discount,
          discount_type: item.discount_type,
          gst_rate: item.gst_rate,
          gst_amount: item.gst_amount,
          amount: item.amount,
        })),
        subtotal: totals.subtotal,
        discount: totals.totalDiscount,
        tax_amount: totals.totalGST,
        total: totals.grandTotal,
        amount_paid: paymentMode === "CREDIT" ? 0 : parseFloat(amountReceived),
        payment_mode: paymentMode,
        is_credit: paymentMode === "CREDIT",
        credit_account_id:
          paymentMode === "CREDIT" ? selectedCreditAccount : null,
        prescription_id: prescriptionId || null,
        notes: notes || null,
      };

      const response = await fetch("/api/clinic/pharmacy/pos/sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saleData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to complete sale");
      }

      const data = await response.json();
      setCompletedSale({
        sale_number: data.sale.sale_number,
        total: totals.grandTotal,
        amount_paid:
          paymentMode === "CREDIT" ? 0 : parseFloat(amountReceived),
        change,
        receipt: data.receipt,
      });
      setSaleComplete(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete sale");
      setTimeout(() => setError(null), 5000);
    } finally {
      setProcessing(false);
    }
  };

  // Print receipt
  const printReceipt = () => {
    if (!completedSale?.receipt) return;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Receipt - ${completedSale.sale_number}</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              max-width: 300px;
              margin: 0 auto;
              padding: 10px;
            }
            .header { text-align: center; margin-bottom: 10px; }
            .header h1 { font-size: 16px; margin: 0; }
            .header p { margin: 2px 0; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            table { width: 100%; border-collapse: collapse; }
            td { padding: 2px 0; }
            .right { text-align: right; }
            .total { font-weight: bold; font-size: 14px; }
            .footer { text-align: center; margin-top: 10px; font-size: 10px; }
            @media print {
              body { max-width: 80mm; }
            }
          </style>
        </head>
        <body>
          ${completedSale.receipt}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // Start new sale
  const startNewSale = () => {
    setCart([]);
    setGlobalDiscount(0);
    setGlobalDiscountType("percent");
    setPaymentMode("CASH");
    setAmountReceived("");
    setNotes("");
    setPrescriptionId("");
    setSelectedCreditAccount("");
    setSaleComplete(false);
    setCompletedSale(null);
    barcodeInputRef.current?.focus();
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      lang === "ne" ? "ne-NP" : "en-US",
      {
        year: "numeric",
        month: "short",
      }
    );
  };

  // Check if expiring soon (within 30 days)
  const isExpiringSoon = (dateString: string) => {
    const expiryDate = new Date(dateString);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiryDate <= thirtyDaysFromNow && expiryDate > new Date();
  };

  // Loading state
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-8" />
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-96 bg-gray-200 rounded" />
              <div className="h-96 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Login required
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-background p-4 lg:p-8 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-primary-blue/20 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-primary-blue"
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
            <h2 className="text-xl font-bold mb-2">{text.loginRequired}</h2>
            <Link href={`/${lang}/login?callbackUrl=/${lang}/clinic/dashboard/pharmacy/pos`}>
              <Button variant="primary" className="mt-4">
                {text.login}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No clinic
  if (noClinic) {
    return (
      <div className="min-h-screen bg-background p-4 lg:p-8 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-primary-yellow/20 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-primary-yellow"
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
            <h2 className="text-xl font-bold mb-2">{text.noClinic}</h2>
            <p className="text-gray-600 mb-4">{text.noClinicMessage}</p>
            <Link href={`/${lang}/clinic/register`}>
              <Button variant="primary">{text.registerClinic}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Sale complete screen
  if (saleComplete && completedSale) {
    return (
      <div className="min-h-screen bg-background p-4 lg:p-8 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-verified/20 rounded-full flex items-center justify-center">
              <svg
                className="w-10 h-10 text-verified"
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
            </div>
            <h2 className="text-2xl font-bold mb-4 text-verified">
              {text.saleComplete}
            </h2>

            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">{text.saleNumber}</span>
                <span className="font-mono font-bold">
                  {completedSale.sale_number}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">{text.totalAmount}</span>
                <span className="font-bold">
                  Rs. {completedSale.total.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">{text.paidAmount}</span>
                <span className="font-bold">
                  Rs. {completedSale.amount_paid.toFixed(2)}
                </span>
              </div>
              {completedSale.change > 0 && (
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span className="text-gray-600">{text.changeAmount}</span>
                  <span className="font-bold text-primary-blue">
                    Rs. {completedSale.change.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={printReceipt}
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
                {text.printReceipt}
              </Button>
              <Button variant="primary" className="flex-1" onClick={startNewSale}>
                {text.newSale}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main POS interface
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b-4 border-foreground sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold">{text.title}</h1>
              <p className="text-sm text-gray-600">
                {clinicName} - {text.subtitle}
              </p>
            </div>
            <Link href={`/${lang}/clinic/dashboard`}>
              <Button variant="outline" size="sm">
                <svg
                  className="w-4 h-4 mr-2"
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
                {text.backToDashboard}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-4">
          <div className="bg-primary-red/10 border-2 border-primary-red text-primary-red px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Product search and results */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search inputs */}
            <Card>
              <CardContent className="pt-4">
                {/* Barcode input */}
                <div className="flex gap-2 mb-4">
                  <div className="relative flex-1">
                    <input
                      ref={barcodeInputRef}
                      type="text"
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleBarcodeScan()}
                      placeholder={text.barcodeInput}
                      className="w-full px-4 py-3 border-4 border-foreground bg-white focus:border-primary-blue focus:outline-none font-mono"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h2m6 6h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                        />
                      </svg>
                    </div>
                  </div>
                  <Button variant="primary" onClick={handleBarcodeScan}>
                    {text.scan}
                  </Button>
                </div>

                {/* Product search */}
                <div className="relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchQuery && setShowSearchResults(true)}
                    placeholder={text.searchProduct}
                    className="w-full px-4 py-3 border-4 border-foreground bg-white focus:border-primary-blue focus:outline-none"
                  />
                  {searching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-5 h-5 border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}

                  {/* Search results dropdown */}
                  {showSearchResults && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border-4 border-foreground shadow-[4px_4px_0_0_black] max-h-96 overflow-y-auto z-50">
                      {searchResults.map((product) => (
                        <button
                          key={product.id}
                          onClick={() => addToCart(product)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-200 last:border-0 flex items-center justify-between"
                        >
                          <div>
                            <div className="font-semibold">{product.name}</div>
                            {product.generic_name && (
                              <div className="text-sm text-gray-500">
                                {product.generic_name}
                              </div>
                            )}
                            <div className="text-xs text-gray-400 mt-1">
                              {product.batches.length > 0 && (
                                <span className="mr-3">
                                  Rs.{" "}
                                  {parseFloat(
                                    product.batches[0].selling_price
                                  ).toFixed(2)}
                                </span>
                              )}
                              <span
                                className={
                                  product.totalStock <= 10
                                    ? "text-primary-red"
                                    : "text-verified"
                                }
                              >
                                {product.totalStock} {text.inStock}
                              </span>
                            </div>
                          </div>
                          <div className="text-primary-blue text-sm font-medium">
                            {text.addToCart}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {showSearchResults && searchResults.length === 0 && searchQuery && !searching && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border-4 border-foreground shadow-[4px_4px_0_0_black] p-4 text-center text-gray-500 z-50">
                      {text.noProducts}
                    </div>
                  )}
                </div>

                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {text.fefo}
                </p>
              </CardContent>
            </Card>

            {/* Cart table */}
            <Card decorator="blue">
              <CardHeader>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-primary-blue"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  {text.cart} ({cart.length})
                </h2>
              </CardHeader>
              <CardContent>
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <svg
                      className="w-12 h-12 mx-auto mb-3 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <p className="font-semibold">{text.emptyCart}</p>
                    <p className="text-sm">{text.emptyCartMessage}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left p-2">{text.product}</th>
                          <th className="text-center p-2">{text.batch}</th>
                          <th className="text-center p-2">{text.expiry}</th>
                          <th className="text-center p-2">{text.qty}</th>
                          <th className="text-right p-2">{text.price}</th>
                          <th className="text-center p-2">{text.discount}</th>
                          <th className="text-right p-2">{text.gst}</th>
                          <th className="text-right p-2">{text.amount}</th>
                          <th className="text-center p-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {cart.map((item, index) => (
                          <tr key={`${item.product_id}-${item.batch_id}`} className="border-t">
                            <td className="p-2">
                              <div className="font-medium">{item.product_name}</div>
                              <div className="text-xs text-gray-500">{item.unit}</div>
                            </td>
                            <td className="text-center p-2 font-mono text-xs">
                              {item.batch_number}
                            </td>
                            <td className="text-center p-2">
                              <span
                                className={`text-xs ${
                                  isExpiringSoon(item.expiry_date)
                                    ? "text-primary-yellow font-medium"
                                    : "text-gray-500"
                                }`}
                              >
                                {formatDate(item.expiry_date)}
                              </span>
                            </td>
                            <td className="text-center p-2">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() =>
                                    updateCartItemQuantity(index, item.quantity - 1)
                                  }
                                  className="w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) =>
                                    updateCartItemQuantity(
                                      index,
                                      parseInt(e.target.value) || 1
                                    )
                                  }
                                  className="w-12 text-center border border-gray-300 rounded px-1 py-0.5"
                                  min="1"
                                  max={item.max_quantity}
                                />
                                <button
                                  onClick={() =>
                                    updateCartItemQuantity(index, item.quantity + 1)
                                  }
                                  className="w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td className="text-right p-2">
                              Rs. {item.unit_price.toFixed(2)}
                            </td>
                            <td className="text-center p-2">
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  value={item.discount}
                                  onChange={(e) =>
                                    updateCartItemDiscount(
                                      index,
                                      parseFloat(e.target.value) || 0,
                                      item.discount_type
                                    )
                                  }
                                  className="w-14 text-center border border-gray-300 rounded px-1 py-0.5"
                                  min="0"
                                />
                                <select
                                  value={item.discount_type}
                                  onChange={(e) =>
                                    updateCartItemDiscount(
                                      index,
                                      item.discount,
                                      e.target.value as "percent" | "amount"
                                    )
                                  }
                                  className="text-xs border border-gray-300 rounded px-1 py-0.5"
                                >
                                  <option value="percent">{text.percent}</option>
                                  <option value="amount">{text.amount_label}</option>
                                </select>
                              </div>
                            </td>
                            <td className="text-right p-2 text-xs text-gray-500">
                              Rs. {item.gst_amount.toFixed(2)}
                            </td>
                            <td className="text-right p-2 font-semibold">
                              Rs. {item.amount.toFixed(2)}
                            </td>
                            <td className="text-center p-2">
                              <button
                                onClick={() => removeFromCart(index)}
                                className="text-primary-red hover:bg-primary-red/10 p-1 rounded"
                              >
                                <svg
                                  className="w-4 h-4"
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
              </CardContent>
            </Card>
          </div>

          {/* Right: Summary and payment */}
          <div className="space-y-4">
            {/* Bill summary */}
            <Card decorator="yellow">
              <CardHeader>
                <h2 className="text-lg font-bold">{text.grandTotal}</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{text.subtotal}</span>
                    <span>Rs. {totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-primary-red">
                    <span>{text.totalDiscount}</span>
                    <span>- Rs. {totals.totalDiscount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>{text.totalGST}</span>
                    <span>Rs. {totals.totalGST.toFixed(2)}</span>
                  </div>
                  <div className="border-t-2 border-foreground pt-3 flex justify-between text-xl font-bold">
                    <span>{text.grandTotal}</span>
                    <span>Rs. {totals.grandTotal.toFixed(2)}</span>
                  </div>

                  {/* Global discount */}
                  <div className="pt-3 border-t">
                    <label className="block text-sm font-medium mb-2">
                      {text.globalDiscount}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={globalDiscount}
                        onChange={(e) =>
                          setGlobalDiscount(parseFloat(e.target.value) || 0)
                        }
                        className="flex-1 px-3 py-2 border-2 border-foreground focus:border-primary-blue focus:outline-none"
                        min="0"
                        placeholder="0"
                      />
                      <select
                        value={globalDiscountType}
                        onChange={(e) =>
                          setGlobalDiscountType(e.target.value as "percent" | "amount")
                        }
                        className="px-3 py-2 border-2 border-foreground focus:border-primary-blue focus:outline-none"
                      >
                        <option value="percent">{text.percent}</option>
                        <option value="amount">{text.amount_label}</option>
                      </select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment */}
            <Card decorator="red">
              <CardHeader>
                <h2 className="text-lg font-bold">{text.payment}</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Payment mode */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {text.paymentMode}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {PAYMENT_MODES.map((mode) => (
                        <button
                          key={mode.value}
                          onClick={() => setPaymentMode(mode.value)}
                          className={`px-3 py-2 border-2 text-sm font-medium transition-all ${
                            paymentMode === mode.value
                              ? "border-primary-blue bg-primary-blue text-white"
                              : "border-foreground bg-white hover:bg-gray-50"
                          }`}
                        >
                          {lang === "ne" ? mode.labelNe : mode.labelEn}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Credit account selection */}
                  {paymentMode === "CREDIT" && (
                    <div className="p-3 bg-primary-yellow/10 border-2 border-primary-yellow rounded">
                      <label className="block text-sm font-medium mb-2">
                        {text.selectCustomer}
                      </label>
                      <select
                        value={selectedCreditAccount}
                        onChange={(e) => setSelectedCreditAccount(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-foreground focus:border-primary-blue focus:outline-none"
                      >
                        <option value="">{text.selectCustomer}</option>
                        {creditAccounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.customer_name}{" "}
                            {account.phone && `(${account.phone})`} - Rs.{" "}
                            {parseFloat(account.current_balance).toFixed(2)}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => setShowNewCreditForm(!showNewCreditForm)}
                        className="mt-2 text-sm text-primary-blue hover:underline"
                      >
                        + {text.newCustomer}
                      </button>

                      {showNewCreditForm && (
                        <div className="mt-3 p-3 bg-white border rounded space-y-2">
                          <input
                            type="text"
                            placeholder={text.customerName}
                            value={newCreditCustomer.name}
                            onChange={(e) =>
                              setNewCreditCustomer({
                                ...newCreditCustomer,
                                name: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded"
                          />
                          <input
                            type="text"
                            placeholder={text.customerPhone}
                            value={newCreditCustomer.phone}
                            onChange={(e) =>
                              setNewCreditCustomer({
                                ...newCreditCustomer,
                                phone: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded"
                          />
                          <input
                            type="text"
                            placeholder={text.customerAddress}
                            value={newCreditCustomer.address}
                            onChange={(e) =>
                              setNewCreditCustomer({
                                ...newCreditCustomer,
                                address: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded"
                          />
                          <div className="flex gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={createCreditAccount}
                            >
                              {text.addCustomer}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowNewCreditForm(false)}
                            >
                              {text.cancel}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Amount received (not for credit sales) */}
                  {paymentMode !== "CREDIT" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {text.amountReceived}
                        </label>
                        <input
                          type="number"
                          value={amountReceived}
                          onChange={(e) => setAmountReceived(e.target.value)}
                          className="w-full px-4 py-3 border-4 border-foreground focus:border-primary-blue focus:outline-none text-xl font-bold"
                          placeholder={totals.grandTotal.toFixed(2)}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      {parseFloat(amountReceived || "0") > totals.grandTotal && (
                        <div className="flex justify-between p-3 bg-verified/10 border-2 border-verified rounded font-bold">
                          <span>{text.change}</span>
                          <span className="text-verified">
                            Rs. {change.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {text.notes}
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-foreground focus:border-primary-blue focus:outline-none"
                      rows={2}
                    />
                  </div>

                  {/* Prescription ID */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {text.prescriptionId}
                    </label>
                    <input
                      type="text"
                      value={prescriptionId}
                      onChange={(e) => setPrescriptionId(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-foreground focus:border-primary-blue focus:outline-none"
                    />
                  </div>

                  {/* Complete sale button */}
                  <Button
                    variant="primary"
                    className="w-full py-4 text-lg"
                    onClick={completeSale}
                    disabled={
                      processing ||
                      cart.length === 0 ||
                      (paymentMode !== "CREDIT" &&
                        parseFloat(amountReceived || "0") < totals.grandTotal) ||
                      (paymentMode === "CREDIT" && !selectedCreditAccount)
                    }
                  >
                    {processing ? text.processing : text.completeSale}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Click outside to close search results */}
      {showSearchResults && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSearchResults(false)}
        />
      )}
    </div>
  );
}
