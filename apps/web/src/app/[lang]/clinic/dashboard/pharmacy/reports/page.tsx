"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Summary {
  totalSales: number;
  totalRevenue: number;
  totalDiscount: number;
  totalTax: number;
  netRevenue: number;
  totalCost: number;
  grossProfit: number;
  profitMargin: number;
  cashSales: number;
  creditSales: number;
  averageSaleValue: number;
}

interface DailyData {
  date: string;
  saleCount: number;
  revenue: number;
  cost: number;
  profit: number;
  discount: number;
  tax: number;
}

interface ProductData {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
  cost: number;
  profit: number;
  saleCount: number;
  averagePrice: number;
}

interface PaymentBreakdown {
  count: number;
  amount: number;
}

interface CreditAccount {
  id: string;
  customer_name: string;
}

interface Sale {
  id: string;
  sale_number: string;
  subtotal: number;
  discount: number;
  tax_amount: number;
  total: number;
  payment_mode: string;
  is_credit: boolean;
  credit_account: CreditAccount | null;
  created_at: string;
}

type ViewType = "overview" | "daily" | "products" | "sales";

export default function PharmacyReportsPage() {
  const { data: session, status } = useSession();
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en";

  const [currentView, setCurrentView] = useState<ViewType>("overview");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [productData, setProductData] = useState<ProductData[]>([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState<Record<string, PaymentBreakdown>>({});
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noClinic, setNoClinic] = useState(false);

  // Date filters
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [datePreset, setDatePreset] = useState("30days");

  // Translations
  const t = {
    en: {
      title: "Pharmacy Reports",
      subtitle: "Sales analytics, product performance, and profit margins",
      backToDashboard: "Back to Dashboard",
      pos: "POS",
      inventory: "Inventory",
      products: "Products",
      // Tab navigation
      overview: "Overview",
      dailySales: "Daily Sales",
      productSales: "Product Sales",
      salesHistory: "Sales History",
      // Date filters
      dateRange: "Date Range",
      from: "From",
      to: "To",
      apply: "Apply",
      today: "Today",
      yesterday: "Yesterday",
      thisWeek: "This Week",
      thisMonth: "This Month",
      last30Days: "Last 30 Days",
      last90Days: "Last 90 Days",
      custom: "Custom",
      // Summary cards
      totalSales: "Total Sales",
      totalRevenue: "Total Revenue",
      netRevenue: "Net Revenue",
      grossProfit: "Gross Profit",
      profitMargin: "Profit Margin",
      avgSaleValue: "Avg Sale Value",
      cashSales: "Cash Sales",
      creditSales: "Credit Sales",
      totalDiscount: "Total Discount",
      totalTax: "Total Tax",
      totalCost: "Total Cost (COGS)",
      // Payment breakdown
      paymentBreakdown: "Payment Mode Breakdown",
      mode: "Mode",
      count: "Count",
      amount: "Amount",
      // Daily table
      date: "Date",
      sales: "Sales",
      revenue: "Revenue",
      cost: "Cost",
      profit: "Profit",
      discount: "Discount",
      tax: "Tax",
      margin: "Margin",
      // Product table
      product: "Product",
      qtySold: "Qty Sold",
      avgPrice: "Avg Price",
      // Sales table
      saleNumber: "Sale #",
      paymentMode: "Payment",
      creditAccount: "Credit Account",
      total: "Total",
      time: "Time",
      // Export
      exportCSV: "Export CSV",
      exporting: "Exporting...",
      // States
      loading: "Loading...",
      errorLoading: "Failed to load data",
      retry: "Retry",
      loginRequired: "Please log in to view reports",
      login: "Login",
      noClinic: "No Verified Clinic",
      noClinicMessage: "You don't have a verified clinic yet.",
      registerClinic: "Register Clinic",
      noData: "No Data",
      noDataMessage: "No sales data found for the selected period.",
      rs: "Rs.",
    },
    ne: {
      title: "फार्मेसी रिपोर्टहरू",
      subtitle: "बिक्री विश्लेषण, उत्पादन कार्यसम्पादन, र नाफा मार्जिन",
      backToDashboard: "ड्यासबोर्डमा फर्कनुहोस्",
      pos: "POS",
      inventory: "इन्भेन्टरी",
      products: "उत्पादनहरू",
      overview: "अवलोकन",
      dailySales: "दैनिक बिक्री",
      productSales: "उत्पादन बिक्री",
      salesHistory: "बिक्री इतिहास",
      dateRange: "मिति दायरा",
      from: "देखि",
      to: "सम्म",
      apply: "लागू गर्नुहोस्",
      today: "आज",
      yesterday: "हिजो",
      thisWeek: "यो हप्ता",
      thisMonth: "यो महिना",
      last30Days: "गत ३० दिन",
      last90Days: "गत ९० दिन",
      custom: "कस्टम",
      totalSales: "कुल बिक्री",
      totalRevenue: "कुल आम्दानी",
      netRevenue: "शुद्ध आम्दानी",
      grossProfit: "कुल नाफा",
      profitMargin: "नाफा मार्जिन",
      avgSaleValue: "औसत बिक्री मूल्य",
      cashSales: "नगद बिक्री",
      creditSales: "उधारो बिक्री",
      totalDiscount: "कुल छुट",
      totalTax: "कुल कर",
      totalCost: "कुल लागत (COGS)",
      paymentBreakdown: "भुक्तानी मोड ब्रेकडाउन",
      mode: "मोड",
      count: "गणना",
      amount: "रकम",
      date: "मिति",
      sales: "बिक्री",
      revenue: "आम्दानी",
      cost: "लागत",
      profit: "नाफा",
      discount: "छुट",
      tax: "कर",
      margin: "मार्जिन",
      product: "उत्पादन",
      qtySold: "बिक्री मात्रा",
      avgPrice: "औसत मूल्य",
      saleNumber: "बिक्री #",
      paymentMode: "भुक्तानी",
      creditAccount: "उधारो खाता",
      total: "कुल",
      time: "समय",
      exportCSV: "CSV निर्यात",
      exporting: "निर्यात हुँदैछ...",
      loading: "लोड हुँदैछ...",
      errorLoading: "डाटा लोड गर्न असफल भयो",
      retry: "पुन: प्रयास गर्नुहोस्",
      loginRequired: "रिपोर्ट हेर्न कृपया लगइन गर्नुहोस्",
      login: "लगइन गर्नुहोस्",
      noClinic: "कुनै प्रमाणित क्लिनिक छैन",
      noClinicMessage: "तपाईंसँग अझै प्रमाणित क्लिनिक छैन।",
      registerClinic: "क्लिनिक दर्ता गर्नुहोस्",
      noData: "डाटा छैन",
      noDataMessage: "चयन गरिएको अवधिको लागि कुनै बिक्री डाटा भेटिएन।",
      rs: "रु.",
    },
  };

  const tr = t[lang as keyof typeof t] || t.en;

  const getPaymentModeLabel = (mode: string) => {
    const labels: Record<string, { en: string; ne: string }> = {
      CASH: { en: "Cash", ne: "नगद" },
      CARD: { en: "Card", ne: "कार्ड" },
      UPI: { en: "UPI", ne: "UPI" },
      BANK_TRANSFER: { en: "Bank Transfer", ne: "बैंक ट्रान्सफर" },
      INSURANCE: { en: "Insurance", ne: "बीमा" },
      CREDIT: { en: "Credit/Khata", ne: "उधारो/खाता" },
    };
    return labels[mode]?.[lang as "en" | "ne"] || mode;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(lang === "ne" ? "ne-NP" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(lang === "ne" ? "ne-NP" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return `${tr.rs} ${amount.toLocaleString(lang === "ne" ? "ne-NP" : "en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNoClinic(false);

    try {
      const params = new URLSearchParams();
      params.set("dateFrom", dateFrom);
      params.set("dateTo", dateTo);

      const response = await fetch(`/api/clinic/pharmacy/reports?${params}`);

      if (response.status === 404) {
        const data = await response.json();
        if (data.code === "NO_CLINIC") {
          setNoClinic(true);
          return;
        }
      }

      if (!response.ok) {
        throw new Error("Failed to fetch report data");
      }

      const data = await response.json();
      setSummary(data.summary);
      setDailyData(data.dailyData || []);
      setProductData(data.productData || []);
      setPaymentBreakdown(data.paymentModeBreakdown || {});
      setSales(data.sales || []);
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError(tr.errorLoading);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, tr.errorLoading]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchReportData();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, fetchReportData]);

  const handleDatePreset = (preset: string) => {
    setDatePreset(preset);
    const today = new Date();
    let from = new Date();

    switch (preset) {
      case "today":
        from = today;
        break;
      case "yesterday":
        from = new Date(today);
        from.setDate(from.getDate() - 1);
        setDateTo(from.toISOString().split("T")[0]);
        setDateFrom(from.toISOString().split("T")[0]);
        return;
      case "thisWeek":
        from.setDate(today.getDate() - today.getDay());
        break;
      case "thisMonth":
        from = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case "30days":
        from.setDate(today.getDate() - 30);
        break;
      case "90days":
        from.setDate(today.getDate() - 90);
        break;
      default:
        return;
    }

    setDateFrom(from.toISOString().split("T")[0]);
    setDateTo(today.toISOString().split("T")[0]);
  };

  const exportToCSV = () => {
    if (!summary || dailyData.length === 0) return;

    // Build CSV content
    let csv = "Pharmacy Sales Report\n";
    csv += `Date Range: ${formatDate(dateFrom)} to ${formatDate(dateTo)}\n\n`;

    // Summary section
    csv += "=== SUMMARY ===\n";
    csv += `Total Sales,${summary.totalSales}\n`;
    csv += `Total Revenue,${summary.totalRevenue.toFixed(2)}\n`;
    csv += `Total Discount,${summary.totalDiscount.toFixed(2)}\n`;
    csv += `Total Tax,${summary.totalTax.toFixed(2)}\n`;
    csv += `Net Revenue,${summary.netRevenue.toFixed(2)}\n`;
    csv += `Total Cost (COGS),${summary.totalCost.toFixed(2)}\n`;
    csv += `Gross Profit,${summary.grossProfit.toFixed(2)}\n`;
    csv += `Profit Margin,${summary.profitMargin.toFixed(2)}%\n`;
    csv += `Cash Sales,${summary.cashSales.toFixed(2)}\n`;
    csv += `Credit Sales,${summary.creditSales.toFixed(2)}\n`;
    csv += `Average Sale Value,${summary.averageSaleValue.toFixed(2)}\n\n`;

    // Payment breakdown
    csv += "=== PAYMENT MODE BREAKDOWN ===\n";
    csv += "Mode,Count,Amount\n";
    for (const [mode, data] of Object.entries(paymentBreakdown)) {
      if (data.count > 0) {
        csv += `${getPaymentModeLabel(mode)},${data.count},${data.amount.toFixed(2)}\n`;
      }
    }
    csv += "\n";

    // Daily breakdown
    csv += "=== DAILY SALES ===\n";
    csv += "Date,Sales Count,Revenue,Cost,Profit,Discount,Tax,Margin %\n";
    for (const day of dailyData) {
      const margin = day.revenue > 0 ? ((day.profit / day.revenue) * 100).toFixed(1) : "0";
      csv += `${day.date},${day.saleCount},${day.revenue.toFixed(2)},${day.cost.toFixed(2)},${day.profit.toFixed(2)},${day.discount.toFixed(2)},${day.tax.toFixed(2)},${margin}\n`;
    }
    csv += "\n";

    // Product breakdown
    if (productData.length > 0) {
      csv += "=== PRODUCT SALES (Top 50) ===\n";
      csv += "Product,Qty Sold,Revenue,Cost,Profit,Sales Count,Avg Price\n";
      for (const product of productData) {
        csv += `"${product.productName}",${product.quantitySold},${product.revenue.toFixed(2)},${product.cost.toFixed(2)},${product.profit.toFixed(2)},${product.saleCount},${product.averagePrice.toFixed(2)}\n`;
      }
    }

    // Download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `pharmacy-report-${dateFrom}-to-${dateTo}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Loading state
  if (status === "loading" || (status === "authenticated" && loading && !summary)) {
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
              <Button variant="primary" onClick={fetchReportData} className="mt-4">
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
            <Link href={`/${lang}/clinic/dashboard/pharmacy/pos`}>
              <Button variant="outline" size="sm">
                {tr.pos}
              </Button>
            </Link>
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
            <Button variant="primary" size="sm" onClick={exportToCSV} disabled={!summary || dailyData.length === 0}>
              {tr.exportCSV}
            </Button>
          </div>
        </div>

        {/* Date Filter */}
        <Card className="border-4 border-foreground shadow-[4px_4px_0_0_rgba(0,0,0,1)] mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-bold text-sm uppercase tracking-wider">{tr.dateRange}:</span>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "today", label: tr.today },
                  { key: "yesterday", label: tr.yesterday },
                  { key: "thisWeek", label: tr.thisWeek },
                  { key: "thisMonth", label: tr.thisMonth },
                  { key: "30days", label: tr.last30Days },
                  { key: "90days", label: tr.last90Days },
                ].map((preset) => (
                  <button
                    key={preset.key}
                    onClick={() => handleDatePreset(preset.key)}
                    className={`px-3 py-1 text-xs font-bold border-2 border-foreground transition-all ${
                      datePreset === preset.key
                        ? "bg-primary-blue text-white shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                        : "bg-white hover:bg-gray-50"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setDatePreset("custom");
                  }}
                  className="px-2 py-1 text-sm border-2 border-foreground focus:outline-none focus:ring-2 focus:ring-primary-blue"
                />
                <span className="text-sm">—</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setDatePreset("custom");
                  }}
                  className="px-2 py-1 text-sm border-2 border-foreground focus:outline-none focus:ring-2 focus:ring-primary-blue"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { key: "overview", label: tr.overview, color: "bg-primary-blue" },
            { key: "daily", label: tr.dailySales, color: "bg-green-600" },
            { key: "products", label: tr.productSales, color: "bg-primary-yellow text-black" },
            { key: "sales", label: tr.salesHistory, color: "bg-purple-600" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setCurrentView(tab.key as ViewType)}
              className={`px-4 py-2 font-bold text-sm uppercase tracking-wider border-2 border-foreground transition-all ${
                currentView === tab.key
                  ? `${tab.color} ${tab.key !== "products" ? "text-white" : ""} shadow-[4px_4px_0_0_rgba(0,0,0,1)]`
                  : "bg-white hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* No data state */}
        {summary && summary.totalSales === 0 && (
          <Card className="border-4 border-foreground shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">{tr.noData}</h3>
              <p className="text-foreground/70">{tr.noDataMessage}</p>
            </CardContent>
          </Card>
        )}

        {/* Overview View */}
        {currentView === "overview" && summary && summary.totalSales > 0 && (
          <div className="space-y-6">
            {/* Primary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-4 border-foreground shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary-blue rounded flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-foreground/60">{tr.totalSales}</p>
                      <p className="text-2xl font-black">{summary.totalSales}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-4 border-foreground shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-600 rounded flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-foreground/60">{tr.totalRevenue}</p>
                      <p className="text-xl font-black">{formatCurrency(summary.totalRevenue)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-4 border-foreground shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary-yellow rounded flex items-center justify-center">
                      <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-foreground/60">{tr.grossProfit}</p>
                      <p className={`text-xl font-black ${summary.grossProfit >= 0 ? "text-green-600" : "text-primary-red"}`}>
                        {formatCurrency(summary.grossProfit)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-4 border-foreground shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded flex items-center justify-center ${summary.profitMargin >= 20 ? "bg-green-600" : summary.profitMargin >= 10 ? "bg-primary-yellow" : "bg-primary-red"}`}>
                      <span className={`text-lg font-black ${summary.profitMargin >= 20 ? "text-white" : summary.profitMargin >= 10 ? "text-black" : "text-white"}`}>%</span>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-foreground/60">{tr.profitMargin}</p>
                      <p className={`text-2xl font-black ${summary.profitMargin >= 20 ? "text-green-600" : summary.profitMargin >= 10 ? "text-primary-yellow" : "text-primary-red"}`}>
                        {formatPercent(summary.profitMargin)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-2 border-foreground/30 shadow-[4px_4px_0_0_rgba(0,0,0,0.2)]">
                <CardContent className="p-4 text-center">
                  <p className="text-xs uppercase tracking-wider text-foreground/60 mb-1">{tr.netRevenue}</p>
                  <p className="text-lg font-bold">{formatCurrency(summary.netRevenue)}</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-foreground/30 shadow-[4px_4px_0_0_rgba(0,0,0,0.2)]">
                <CardContent className="p-4 text-center">
                  <p className="text-xs uppercase tracking-wider text-foreground/60 mb-1">{tr.totalCost}</p>
                  <p className="text-lg font-bold">{formatCurrency(summary.totalCost)}</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-foreground/30 shadow-[4px_4px_0_0_rgba(0,0,0,0.2)]">
                <CardContent className="p-4 text-center">
                  <p className="text-xs uppercase tracking-wider text-foreground/60 mb-1">{tr.totalDiscount}</p>
                  <p className="text-lg font-bold text-primary-red">-{formatCurrency(summary.totalDiscount)}</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-foreground/30 shadow-[4px_4px_0_0_rgba(0,0,0,0.2)]">
                <CardContent className="p-4 text-center">
                  <p className="text-xs uppercase tracking-wider text-foreground/60 mb-1">{tr.avgSaleValue}</p>
                  <p className="text-lg font-bold">{formatCurrency(summary.averageSaleValue)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Cash vs Credit */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-4 border-foreground shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
                <CardHeader className="border-b-2 border-foreground/20 pb-3">
                  <h3 className="font-bold uppercase tracking-wider">{tr.cashSales} vs {tr.creditSales}</h3>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-bold text-green-600">{tr.cashSales}</span>
                        <span className="font-bold">{formatCurrency(summary.cashSales)}</span>
                      </div>
                      <div className="h-4 bg-gray-200 rounded overflow-hidden">
                        <div
                          className="h-full bg-green-600"
                          style={{ width: `${summary.totalRevenue > 0 ? (summary.cashSales / summary.totalRevenue) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-bold text-primary-red">{tr.creditSales}</span>
                        <span className="font-bold">{formatCurrency(summary.creditSales)}</span>
                      </div>
                      <div className="h-4 bg-gray-200 rounded overflow-hidden">
                        <div
                          className="h-full bg-primary-red"
                          style={{ width: `${summary.totalRevenue > 0 ? (summary.creditSales / summary.totalRevenue) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Mode Breakdown */}
              <Card className="border-4 border-foreground shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
                <CardHeader className="border-b-2 border-foreground/20 pb-3">
                  <h3 className="font-bold uppercase tracking-wider">{tr.paymentBreakdown}</h3>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    {Object.entries(paymentBreakdown)
                      .filter(([_, data]) => data.count > 0)
                      .sort((a, b) => b[1].amount - a[1].amount)
                      .map(([mode, data]) => (
                        <div key={mode} className="flex items-center justify-between text-sm">
                          <span className="font-medium">{getPaymentModeLabel(mode)}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-foreground/60">{data.count} sales</span>
                            <span className="font-bold w-28 text-right">{formatCurrency(data.amount)}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Daily Sales View */}
        {currentView === "daily" && summary && summary.totalSales > 0 && (
          <div>
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-foreground/10 rounded"></div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-4 border-foreground bg-white">
                  <thead>
                    <tr className="bg-foreground text-white">
                      <th className="p-3 text-left text-xs uppercase tracking-wider">{tr.date}</th>
                      <th className="p-3 text-center text-xs uppercase tracking-wider">{tr.sales}</th>
                      <th className="p-3 text-right text-xs uppercase tracking-wider">{tr.revenue}</th>
                      <th className="p-3 text-right text-xs uppercase tracking-wider">{tr.cost}</th>
                      <th className="p-3 text-right text-xs uppercase tracking-wider">{tr.profit}</th>
                      <th className="p-3 text-right text-xs uppercase tracking-wider">{tr.discount}</th>
                      <th className="p-3 text-right text-xs uppercase tracking-wider">{tr.tax}</th>
                      <th className="p-3 text-center text-xs uppercase tracking-wider">{tr.margin}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyData.map((day, idx) => {
                      const margin = day.revenue > 0 ? (day.profit / day.revenue) * 100 : 0;
                      return (
                        <tr key={day.date} className={`border-b-2 border-foreground/20 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                          <td className="p-3 font-medium">{formatDate(day.date)}</td>
                          <td className="p-3 text-center">{day.saleCount}</td>
                          <td className="p-3 text-right font-bold">{formatCurrency(day.revenue)}</td>
                          <td className="p-3 text-right text-foreground/70">{formatCurrency(day.cost)}</td>
                          <td className={`p-3 text-right font-bold ${day.profit >= 0 ? "text-green-600" : "text-primary-red"}`}>
                            {formatCurrency(day.profit)}
                          </td>
                          <td className="p-3 text-right text-primary-red">-{formatCurrency(day.discount)}</td>
                          <td className="p-3 text-right text-foreground/70">{formatCurrency(day.tax)}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-1 text-xs font-bold rounded ${
                              margin >= 20 ? "bg-green-100 text-green-700" :
                              margin >= 10 ? "bg-yellow-100 text-yellow-700" :
                              "bg-red-100 text-red-700"
                            }`}>
                              {formatPercent(margin)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-foreground/10 font-bold">
                      <td className="p-3">{lang === "ne" ? "कुल" : "Total"}</td>
                      <td className="p-3 text-center">{summary.totalSales}</td>
                      <td className="p-3 text-right">{formatCurrency(summary.totalRevenue)}</td>
                      <td className="p-3 text-right">{formatCurrency(summary.totalCost)}</td>
                      <td className={`p-3 text-right ${summary.grossProfit >= 0 ? "text-green-600" : "text-primary-red"}`}>
                        {formatCurrency(summary.grossProfit)}
                      </td>
                      <td className="p-3 text-right text-primary-red">-{formatCurrency(summary.totalDiscount)}</td>
                      <td className="p-3 text-right">{formatCurrency(summary.totalTax)}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 text-xs font-bold rounded ${
                          summary.profitMargin >= 20 ? "bg-green-600 text-white" :
                          summary.profitMargin >= 10 ? "bg-primary-yellow text-black" :
                          "bg-primary-red text-white"
                        }`}>
                          {formatPercent(summary.profitMargin)}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Product Sales View */}
        {currentView === "products" && summary && summary.totalSales > 0 && (
          <div>
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-foreground/10 rounded"></div>
                ))}
              </div>
            ) : productData.length === 0 ? (
              <Card className="border-4 border-foreground shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
                <CardContent className="p-8 text-center">
                  <h3 className="text-xl font-bold mb-2">{tr.noData}</h3>
                  <p className="text-foreground/70">{tr.noDataMessage}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-4 border-foreground bg-white">
                  <thead>
                    <tr className="bg-foreground text-white">
                      <th className="p-3 text-left text-xs uppercase tracking-wider">#</th>
                      <th className="p-3 text-left text-xs uppercase tracking-wider">{tr.product}</th>
                      <th className="p-3 text-center text-xs uppercase tracking-wider">{tr.qtySold}</th>
                      <th className="p-3 text-right text-xs uppercase tracking-wider">{tr.revenue}</th>
                      <th className="p-3 text-right text-xs uppercase tracking-wider">{tr.cost}</th>
                      <th className="p-3 text-right text-xs uppercase tracking-wider">{tr.profit}</th>
                      <th className="p-3 text-right text-xs uppercase tracking-wider">{tr.avgPrice}</th>
                      <th className="p-3 text-center text-xs uppercase tracking-wider">{tr.margin}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productData.map((product, idx) => {
                      const margin = product.revenue > 0 ? (product.profit / product.revenue) * 100 : 0;
                      return (
                        <tr key={product.productId} className={`border-b-2 border-foreground/20 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                          <td className="p-3 text-foreground/50">{idx + 1}</td>
                          <td className="p-3">
                            <div className="font-bold">{product.productName}</div>
                            <div className="text-xs text-foreground/60">{product.saleCount} transactions</div>
                          </td>
                          <td className="p-3 text-center font-bold">{product.quantitySold}</td>
                          <td className="p-3 text-right font-bold">{formatCurrency(product.revenue)}</td>
                          <td className="p-3 text-right text-foreground/70">{formatCurrency(product.cost)}</td>
                          <td className={`p-3 text-right font-bold ${product.profit >= 0 ? "text-green-600" : "text-primary-red"}`}>
                            {formatCurrency(product.profit)}
                          </td>
                          <td className="p-3 text-right">{formatCurrency(product.averagePrice)}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-1 text-xs font-bold rounded ${
                              margin >= 20 ? "bg-green-100 text-green-700" :
                              margin >= 10 ? "bg-yellow-100 text-yellow-700" :
                              "bg-red-100 text-red-700"
                            }`}>
                              {formatPercent(margin)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Sales History View */}
        {currentView === "sales" && summary && summary.totalSales > 0 && (
          <div>
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-foreground/10 rounded"></div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-4 border-foreground bg-white">
                  <thead>
                    <tr className="bg-foreground text-white">
                      <th className="p-3 text-left text-xs uppercase tracking-wider">{tr.saleNumber}</th>
                      <th className="p-3 text-left text-xs uppercase tracking-wider">{tr.time}</th>
                      <th className="p-3 text-left text-xs uppercase tracking-wider">{tr.paymentMode}</th>
                      <th className="p-3 text-right text-xs uppercase tracking-wider">{tr.discount}</th>
                      <th className="p-3 text-right text-xs uppercase tracking-wider">{tr.tax}</th>
                      <th className="p-3 text-right text-xs uppercase tracking-wider">{tr.total}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((sale, idx) => (
                      <tr key={sale.id} className={`border-b-2 border-foreground/20 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                        <td className="p-3 font-mono text-sm">{sale.sale_number}</td>
                        <td className="p-3 text-sm">{formatDateTime(sale.created_at)}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 text-xs font-bold rounded ${
                            sale.is_credit ? "bg-primary-red text-white" : "bg-green-600 text-white"
                          }`}>
                            {getPaymentModeLabel(sale.payment_mode)}
                          </span>
                          {sale.is_credit && sale.credit_account && (
                            <div className="text-xs text-foreground/60 mt-1">{sale.credit_account.customer_name}</div>
                          )}
                        </td>
                        <td className="p-3 text-right text-primary-red">-{formatCurrency(sale.discount)}</td>
                        <td className="p-3 text-right text-foreground/70">{formatCurrency(sale.tax_amount)}</td>
                        <td className="p-3 text-right font-bold">{formatCurrency(sale.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {sales.length === 100 && (
                  <p className="text-sm text-foreground/60 mt-2 text-center">
                    {lang === "ne" ? "पछिल्लो १०० बिक्री देखाउँदै" : "Showing last 100 sales"}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
