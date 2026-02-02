"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface CreditAccount {
  id: string;
  customer_name: string;
  phone: string | null;
  address: string | null;
  credit_limit: string;
  current_balance: string;
  is_active: boolean;
  created_at: string;
}

interface Transaction {
  id: string;
  type: "SALE" | "PAYMENT" | "ADJUSTMENT" | "REFUND";
  amount: string;
  balance: string;
  description: string | null;
  notes: string | null;
  created_at: string;
  sale_id: string | null;
}

interface Sale {
  id: string;
  sale_number: string;
  total: string;
  amount_due: string;
  created_at: string;
}

export default function CustomerLedgerPage() {
  const { data: session, status } = useSession();
  const params = useParams<{ lang: string; id: string }>();
  const router = useRouter();
  const lang = params?.lang || "en";
  const accountId = params?.id;

  const [account, setAccount] = useState<CreditAccount | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [noClinic, setNoClinic] = useState(false);

  // Payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: "",
    notes: "",
  });

  // Translations
  const t = {
    en: {
      title: "Customer Ledger",
      subtitle: "Transaction history and account details",
      backToKhata: "Back to Khata",
      customerDetails: "Customer Details",
      customerName: "Customer Name",
      phone: "Phone",
      address: "Address",
      creditLimit: "Credit Limit",
      currentBalance: "Outstanding Balance",
      memberSince: "Member Since",
      status: "Status",
      active: "Active",
      inactive: "Inactive",
      transactionHistory: "Transaction History",
      noTransactions: "No transactions yet",
      noTransactionsMessage: "All credit transactions will appear here.",
      recentSales: "Recent Credit Sales",
      noSales: "No credit sales yet",
      date: "Date",
      type: "Type",
      description: "Description",
      debit: "Debit",
      credit: "Credit",
      balance: "Balance",
      sale: "Sale",
      payment: "Payment",
      adjustment: "Adjustment",
      refund: "Refund",
      saleNumber: "Sale #",
      total: "Total",
      amountDue: "Due",
      recordPayment: "Record Payment",
      paymentAmount: "Payment Amount",
      paymentNotes: "Notes (optional)",
      recording: "Recording...",
      paymentSuccess: "Payment recorded successfully",
      paymentError: "Failed to record payment",
      nrs: "Rs.",
      cleared: "Cleared",
      loginRequired: "Please log in to access this page",
      login: "Login",
      noClinic: "No Verified Clinic",
      noClinicMessage: "You need a verified pharmacy/clinic to view ledger.",
      registerClinic: "Register Clinic",
      notFound: "Account not found",
      notFoundMessage: "The credit account you are looking for does not exist.",
      print: "Print Ledger",
      export: "Export CSV",
      cancel: "Cancel",
    },
    ne: {
      title: "ग्राहक खाता",
      subtitle: "लेनदेन इतिहास र खाता विवरण",
      backToKhata: "खातामा फर्कनुहोस्",
      customerDetails: "ग्राहक विवरण",
      customerName: "ग्राहकको नाम",
      phone: "फोन",
      address: "ठेगाना",
      creditLimit: "उधारो सीमा",
      currentBalance: "बाँकी रकम",
      memberSince: "सदस्य भएको मिति",
      status: "स्थिति",
      active: "सक्रिय",
      inactive: "निष्क्रिय",
      transactionHistory: "लेनदेन इतिहास",
      noTransactions: "अहिलेसम्म कुनै लेनदेन छैन",
      noTransactionsMessage: "सबै उधारो लेनदेनहरू यहाँ देखिनेछन्।",
      recentSales: "हालैका उधारो बिक्री",
      noSales: "अहिलेसम्म कुनै उधारो बिक्री छैन",
      date: "मिति",
      type: "प्रकार",
      description: "विवरण",
      debit: "डेबिट",
      credit: "क्रेडिट",
      balance: "ब्यालेन्स",
      sale: "बिक्री",
      payment: "भुक्तानी",
      adjustment: "समायोजन",
      refund: "फिर्ता",
      saleNumber: "बिक्री #",
      total: "कुल",
      amountDue: "बाँकी",
      recordPayment: "भुक्तानी रेकर्ड",
      paymentAmount: "भुक्तानी रकम",
      paymentNotes: "नोट (वैकल्पिक)",
      recording: "रेकर्ड हुँदैछ...",
      paymentSuccess: "भुक्तानी सफलतापूर्वक रेकर्ड भयो",
      paymentError: "भुक्तानी रेकर्ड गर्न असफल",
      nrs: "रु.",
      cleared: "चुक्ता",
      loginRequired: "यो पृष्ठ पहुँच गर्न कृपया लगइन गर्नुहोस्",
      login: "लगइन गर्नुहोस्",
      noClinic: "कुनै प्रमाणित क्लिनिक छैन",
      noClinicMessage: "खाता हेर्न तपाईंलाई प्रमाणित फार्मेसी/क्लिनिक चाहिन्छ।",
      registerClinic: "क्लिनिक दर्ता गर्नुहोस्",
      notFound: "खाता फेला परेन",
      notFoundMessage: "तपाईंले खोजिरहनुभएको उधारो खाता अवस्थित छैन।",
      print: "खाता प्रिन्ट",
      export: "CSV निर्यात",
      cancel: "रद्द गर्नुहोस्",
    },
  };

  const text = t[lang as keyof typeof t] || t.en;

  // Load account data
  const loadAccountData = useCallback(async () => {
    if (!accountId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/clinic/pharmacy/credit-accounts/${accountId}`);

      if (!response.ok) {
        const data = await response.json();
        if (data.code === "NO_CLINIC") {
          setNoClinic(true);
          return;
        }
        if (response.status === 404) {
          setAccount(null);
          return;
        }
        throw new Error(data.error);
      }

      const data = await response.json();
      setAccount(data.account);
      setTransactions(data.transactions || []);
      setSales(data.sales || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load account");
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    if (status === "authenticated") {
      loadAccountData();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, loadAccountData]);

  // Handle payment submit
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/clinic/pharmacy/credit-accounts/${account.id}/payment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: parseFloat(paymentData.amount),
            notes: paymentData.notes || null,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      setShowPaymentModal(false);
      setPaymentData({ amount: "", notes: "" });
      setSuccess(text.paymentSuccess);
      setTimeout(() => setSuccess(null), 3000);
      loadAccountData();
    } catch (err) {
      setError(err instanceof Error ? err.message : text.paymentError);
    } finally {
      setSaving(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(lang === "ne" ? "ne-NP" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get transaction type display
  const getTransactionTypeDisplay = (type: Transaction["type"]) => {
    const types = {
      SALE: { label: text.sale, color: "text-primary-red", icon: "+" },
      PAYMENT: { label: text.payment, color: "text-verified", icon: "-" },
      ADJUSTMENT: { label: text.adjustment, color: "text-primary-yellow", icon: "±" },
      REFUND: { label: text.refund, color: "text-primary-blue", icon: "-" },
    };
    return types[type] || { label: type, color: "text-gray-600", icon: "" };
  };

  // Print ledger
  const printLedger = () => {
    if (!account) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ledger - ${account.customer_name}</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { font-size: 24px; margin-bottom: 10px; }
          .info { margin-bottom: 20px; }
          .info p { margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #f5f5f5; }
          .credit { color: green; }
          .debit { color: red; }
          .total { font-weight: bold; font-size: 18px; margin-top: 20px; }
          @media print { body { margin: 0; padding: 10px; } }
        </style>
      </head>
      <body>
        <h1>Customer Ledger</h1>
        <div class="info">
          <p><strong>Customer:</strong> ${account.customer_name}</p>
          <p><strong>Phone:</strong> ${account.phone || "-"}</p>
          <p><strong>Address:</strong> ${account.address || "-"}</p>
          <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Description</th>
              <th>Debit</th>
              <th>Credit</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            ${transactions.map((t) => {
              const typeInfo = getTransactionTypeDisplay(t.type);
              const isDebit = t.type === "SALE";
              return `
                <tr>
                  <td>${formatDate(t.created_at)}</td>
                  <td>${typeInfo.label}</td>
                  <td>${t.description || ""} ${t.notes ? `(${t.notes})` : ""}</td>
                  <td class="debit">${isDebit ? `Rs. ${parseFloat(t.amount).toFixed(2)}` : ""}</td>
                  <td class="credit">${!isDebit ? `Rs. ${parseFloat(t.amount).toFixed(2)}` : ""}</td>
                  <td>Rs. ${parseFloat(t.balance).toFixed(2)}</td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>

        <p class="total">Outstanding Balance: Rs. ${parseFloat(account.current_balance).toFixed(2)}</p>

        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
    }
  };

  // Export CSV
  const exportCSV = () => {
    if (!account || transactions.length === 0) return;

    const headers = ["Date", "Type", "Description", "Debit", "Credit", "Balance"];
    const rows = transactions.map((t) => {
      const isDebit = t.type === "SALE";
      return [
        formatDate(t.created_at),
        t.type,
        `"${(t.description || "") + (t.notes ? ` (${t.notes})` : "")}"`,
        isDebit ? parseFloat(t.amount).toFixed(2) : "",
        !isDebit ? parseFloat(t.amount).toFixed(2) : "",
        parseFloat(t.balance).toFixed(2),
      ];
    });

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ledger-${account.customer_name.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
              <div className="h-64 bg-gray-200 rounded" />
              <div className="lg:col-span-2 h-96 bg-gray-200 rounded" />
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
              <svg className="w-8 h-8 text-primary-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">{text.loginRequired}</h2>
            <Link href={`/${lang}/login?callbackUrl=/${lang}/clinic/dashboard/pharmacy/khata`}>
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
              <svg className="w-8 h-8 text-primary-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
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

  // Not found
  if (!account) {
    return (
      <div className="min-h-screen bg-background p-4 lg:p-8 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">{text.notFound}</h2>
            <p className="text-gray-600 mb-4">{text.notFoundMessage}</p>
            <Link href={`/${lang}/clinic/dashboard/pharmacy/khata`}>
              <Button variant="primary">{text.backToKhata}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b-4 border-foreground sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold">{account.customer_name}</h1>
              <p className="text-sm text-gray-600">{text.subtitle}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/${lang}/clinic/dashboard/pharmacy/khata`}>
                <Button variant="outline" size="sm">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  {text.backToKhata}
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={printLedger}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                {text.print}
              </Button>
              <Button variant="outline" size="sm" onClick={exportCSV} disabled={transactions.length === 0}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {text.export}
              </Button>
              {parseFloat(account.current_balance) > 0 && (
                <Button variant="primary" size="sm" onClick={() => setShowPaymentModal(true)}>
                  {text.recordPayment}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-4">
          <div className="bg-primary-red/10 border-2 border-primary-red text-primary-red px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      )}
      {success && (
        <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-4">
          <div className="bg-verified/10 border-2 border-verified text-verified px-4 py-3 rounded-lg">
            {success}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Customer details */}
          <div className="space-y-6">
            <Card decorator="blue">
              <CardHeader>
                <h2 className="text-lg font-bold">{text.customerDetails}</h2>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm text-gray-600">{text.customerName}</dt>
                    <dd className="font-medium">{account.customer_name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-600">{text.phone}</dt>
                    <dd className="font-medium">{account.phone || "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-600">{text.address}</dt>
                    <dd className="font-medium">{account.address || "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-600">{text.creditLimit}</dt>
                    <dd className="font-medium">{text.nrs} {parseFloat(account.credit_limit).toFixed(2)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-600">{text.memberSince}</dt>
                    <dd className="font-medium">
                      {new Date(account.created_at).toLocaleDateString(lang === "ne" ? "ne-NP" : "en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-600">{text.status}</dt>
                    <dd>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                        account.is_active
                          ? "bg-verified/20 text-verified"
                          : "bg-gray-200 text-gray-600"
                      }`}>
                        {account.is_active ? text.active : text.inactive}
                      </span>
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            {/* Outstanding balance card */}
            <Card decorator="red">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">{text.currentBalance}</p>
                  <p className={`text-3xl font-bold ${
                    parseFloat(account.current_balance) > 0 ? "text-primary-red" : "text-verified"
                  }`}>
                    {parseFloat(account.current_balance) > 0
                      ? `${text.nrs} ${parseFloat(account.current_balance).toFixed(2)}`
                      : text.cleared}
                  </p>
                  {parseFloat(account.current_balance) > 0 && (
                    <Button
                      variant="primary"
                      className="mt-4"
                      onClick={() => setShowPaymentModal(true)}
                    >
                      {text.recordPayment}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent sales */}
            {sales.length > 0 && (
              <Card decorator="yellow">
                <CardHeader>
                  <h2 className="text-lg font-bold">{text.recentSales}</h2>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {sales.slice(0, 5).map((sale) => (
                      <div key={sale.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div>
                          <p className="font-mono text-sm">{sale.sale_number}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(sale.created_at).toLocaleDateString(lang === "ne" ? "ne-NP" : "en-US")}
                          </p>
                        </div>
                        <p className="font-bold">{text.nrs} {parseFloat(sale.total).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Transaction history */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-bold">{text.transactionHistory}</h2>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{text.noTransactions}</h3>
                    <p className="text-gray-600">{text.noTransactionsMessage}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b-2 border-foreground">
                        <tr>
                          <th className="text-left p-3 font-bold">{text.date}</th>
                          <th className="text-left p-3 font-bold">{text.type}</th>
                          <th className="text-left p-3 font-bold">{text.description}</th>
                          <th className="text-right p-3 font-bold">{text.debit}</th>
                          <th className="text-right p-3 font-bold">{text.credit}</th>
                          <th className="text-right p-3 font-bold">{text.balance}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((transaction) => {
                          const typeInfo = getTransactionTypeDisplay(transaction.type);
                          const isDebit = transaction.type === "SALE";
                          return (
                            <tr key={transaction.id} className="border-b hover:bg-gray-50">
                              <td className="p-3 text-sm">
                                {formatDate(transaction.created_at)}
                              </td>
                              <td className="p-3">
                                <span className={`inline-flex items-center gap-1 text-sm font-medium ${typeInfo.color}`}>
                                  <span className="text-lg">{typeInfo.icon}</span>
                                  {typeInfo.label}
                                </span>
                              </td>
                              <td className="p-3">
                                <p className="text-sm">{transaction.description}</p>
                                {transaction.notes && (
                                  <p className="text-xs text-gray-500">{transaction.notes}</p>
                                )}
                              </td>
                              <td className="p-3 text-right">
                                {isDebit && (
                                  <span className="text-primary-red font-medium">
                                    {text.nrs} {parseFloat(transaction.amount).toFixed(2)}
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-right">
                                {!isDebit && (
                                  <span className="text-verified font-medium">
                                    {text.nrs} {parseFloat(transaction.amount).toFixed(2)}
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-right font-bold">
                                {text.nrs} {parseFloat(transaction.balance).toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <h2 className="text-xl font-bold">{text.recordPayment}</h2>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">{text.customerName}</p>
                <p className="font-bold">{account.customer_name}</p>
                <p className="text-sm text-gray-600 mt-2">{text.currentBalance}</p>
                <p className="text-xl font-bold text-primary-red">
                  {text.nrs} {parseFloat(account.current_balance).toFixed(2)}
                </p>
              </div>

              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {text.paymentAmount} <span className="text-primary-red">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">{text.nrs}</span>
                    <input
                      type="number"
                      value={paymentData.amount}
                      onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                      className="w-full px-4 py-3 pl-12 border-4 border-foreground focus:border-primary-blue focus:outline-none text-xl font-bold"
                      min="0.01"
                      max={parseFloat(account.current_balance)}
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">{text.paymentNotes}</label>
                  <textarea
                    value={paymentData.notes}
                    onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-foreground focus:border-primary-blue focus:outline-none"
                    rows={2}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowPaymentModal(false)}
                  >
                    {text.cancel}
                  </Button>
                  <Button type="submit" variant="primary" className="flex-1" disabled={saving}>
                    {saving ? text.recording : text.recordPayment}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
