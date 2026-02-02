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
  _count?: {
    sales: number;
    transactions: number;
  };
}

export default function PharmacyKhataPage() {
  const { data: session, status } = useSession();
  const params = useParams<{ lang: string }>();
  const router = useRouter();
  const lang = params?.lang || "en";

  const [accounts, setAccounts] = useState<CreditAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [noClinic, setNoClinic] = useState(false);

  // Search and filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActive, setFilterActive] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<CreditAccount | null>(null);
  const [payingAccount, setPayingAccount] = useState<CreditAccount | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    credit_limit: "",
  });

  // Payment form state
  const [paymentData, setPaymentData] = useState({
    amount: "",
    notes: "",
  });

  // Summary stats
  const [stats, setStats] = useState({
    totalAccounts: 0,
    totalOutstanding: 0,
    accountsWithBalance: 0,
  });

  // Translations
  const t = {
    en: {
      title: "Credit Accounts (Khata)",
      subtitle: "Manage credit customers and outstanding balances",
      backToDashboard: "Back to Dashboard",
      addAccount: "Add Customer",
      searchPlaceholder: "Search by name or phone...",
      filterByStatus: "Status",
      allStatuses: "All",
      active: "Active",
      inactive: "Inactive",
      noAccounts: "No credit accounts found",
      noAccountsMessage: "Add your first credit customer to start managing credit sales.",
      noResults: "No matching accounts",
      noResultsMessage: "Try adjusting your search or filters.",
      customerName: "Customer Name",
      phone: "Phone",
      address: "Address",
      creditLimit: "Credit Limit",
      currentBalance: "Outstanding Balance",
      actions: "Actions",
      edit: "Edit",
      delete: "Delete",
      deactivate: "Deactivate",
      activate: "Activate",
      recordPayment: "Record Payment",
      viewLedger: "View Ledger",
      deleteConfirm: "Are you sure you want to delete this credit account?",
      cannotDelete: "Cannot delete account with outstanding balance or transactions",
      save: "Save",
      saving: "Saving...",
      cancel: "Cancel",
      addNewAccount: "Add Credit Customer",
      editAccount: "Edit Customer",
      required: "Required",
      invalidPhone: "Invalid phone number",
      invalidCreditLimit: "Invalid credit limit",
      loginRequired: "Please log in to access this page",
      login: "Login",
      noClinic: "No Verified Clinic",
      noClinicMessage: "You need a verified pharmacy/clinic to manage credit accounts.",
      registerClinic: "Register Clinic",
      errorLoading: "Failed to load credit accounts",
      retry: "Retry",
      totalAccounts: "Total Accounts",
      totalOutstanding: "Total Outstanding",
      accountsWithBalance: "Active Credit",
      paymentAmount: "Payment Amount",
      paymentNotes: "Notes (optional)",
      recordingPayment: "Recording...",
      paymentSuccess: "Payment recorded successfully",
      paymentError: "Failed to record payment",
      nrs: "Rs.",
      cleared: "Cleared",
    },
    ne: {
      title: "उधारो खाता (खाता)",
      subtitle: "उधारो ग्राहकहरू र बाँकी रकम व्यवस्थापन",
      backToDashboard: "ड्यासबोर्डमा फर्कनुहोस्",
      addAccount: "ग्राहक थप्नुहोस्",
      searchPlaceholder: "नाम वा फोनद्वारा खोज्नुहोस्...",
      filterByStatus: "स्थिति",
      allStatuses: "सबै",
      active: "सक्रिय",
      inactive: "निष्क्रिय",
      noAccounts: "कुनै उधारो खाता फेला परेन",
      noAccountsMessage: "उधारो बिक्री व्यवस्थापन सुरु गर्न आफ्नो पहिलो उधारो ग्राहक थप्नुहोस्।",
      noResults: "कुनै मिल्दो खाता छैन",
      noResultsMessage: "तपाईंको खोज वा फिल्टरहरू समायोजन गर्ने प्रयास गर्नुहोस्।",
      customerName: "ग्राहकको नाम",
      phone: "फोन",
      address: "ठेगाना",
      creditLimit: "उधारो सीमा",
      currentBalance: "बाँकी रकम",
      actions: "कार्यहरू",
      edit: "सम्पादन",
      delete: "मेटाउनुहोस्",
      deactivate: "निष्क्रिय गर्नुहोस्",
      activate: "सक्रिय गर्नुहोस्",
      recordPayment: "भुक्तानी रेकर्ड",
      viewLedger: "खाता हेर्नुहोस्",
      deleteConfirm: "के तपाईं यो उधारो खाता मेटाउन निश्चित हुनुहुन्छ?",
      cannotDelete: "बाँकी रकम वा लेनदेन भएको खाता मेटाउन सकिँदैन",
      save: "सेभ गर्नुहोस्",
      saving: "सेभ हुँदैछ...",
      cancel: "रद्द गर्नुहोस्",
      addNewAccount: "उधारो ग्राहक थप्नुहोस्",
      editAccount: "ग्राहक सम्पादन",
      required: "आवश्यक",
      invalidPhone: "अमान्य फोन नम्बर",
      invalidCreditLimit: "अमान्य उधारो सीमा",
      loginRequired: "यो पृष्ठ पहुँच गर्न कृपया लगइन गर्नुहोस्",
      login: "लगइन गर्नुहोस्",
      noClinic: "कुनै प्रमाणित क्लिनिक छैन",
      noClinicMessage: "उधारो खाताहरू व्यवस्थापन गर्न तपाईंलाई प्रमाणित फार्मेसी/क्लिनिक चाहिन्छ।",
      registerClinic: "क्लिनिक दर्ता गर्नुहोस्",
      errorLoading: "उधारो खाताहरू लोड गर्न असफल",
      retry: "पुन: प्रयास",
      totalAccounts: "कुल खाताहरू",
      totalOutstanding: "कुल बाँकी",
      accountsWithBalance: "सक्रिय उधारो",
      paymentAmount: "भुक्तानी रकम",
      paymentNotes: "नोट (वैकल्पिक)",
      recordingPayment: "रेकर्ड हुँदैछ...",
      paymentSuccess: "भुक्तानी सफलतापूर्वक रेकर्ड भयो",
      paymentError: "भुक्तानी रेकर्ड गर्न असफल",
      nrs: "रु.",
      cleared: "चुक्ता",
    },
  };

  const text = t[lang as keyof typeof t] || t.en;

  // Load accounts
  const loadAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (filterActive) params.set("isActive", filterActive);

      const response = await fetch(`/api/clinic/pharmacy/credit-accounts?${params}`);

      if (!response.ok) {
        const data = await response.json();
        if (data.code === "NO_CLINIC") {
          setNoClinic(true);
          return;
        }
        throw new Error(data.error);
      }

      const data = await response.json();
      const accountsList = data.accounts || [];
      setAccounts(accountsList);

      // Calculate stats
      const totalOutstanding = accountsList.reduce(
        (sum: number, acc: CreditAccount) => sum + parseFloat(acc.current_balance || "0"),
        0
      );
      const accountsWithBalance = accountsList.filter(
        (acc: CreditAccount) => parseFloat(acc.current_balance || "0") > 0
      ).length;

      setStats({
        totalAccounts: accountsList.length,
        totalOutstanding,
        accountsWithBalance,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : text.errorLoading);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterActive, text.errorLoading]);

  useEffect(() => {
    if (status === "authenticated") {
      loadAccounts();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, loadAccounts]);

  // Open add modal
  const openAddModal = () => {
    setEditingAccount(null);
    setFormData({
      name: "",
      phone: "",
      address: "",
      credit_limit: "",
    });
    setShowModal(true);
  };

  // Open edit modal
  const openEditModal = (account: CreditAccount) => {
    setEditingAccount(account);
    setFormData({
      name: account.customer_name,
      phone: account.phone || "",
      address: account.address || "",
      credit_limit: account.credit_limit,
    });
    setShowModal(true);
  };

  // Open payment modal
  const openPaymentModal = (account: CreditAccount) => {
    setPayingAccount(account);
    setPaymentData({
      amount: "",
      notes: "",
    });
    setShowPaymentModal(true);
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const url = editingAccount
        ? `/api/clinic/pharmacy/credit-accounts/${editingAccount.id}`
        : "/api/clinic/pharmacy/credit-accounts";
      const method = editingAccount ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone || null,
          address: formData.address || null,
          credit_limit: parseFloat(formData.credit_limit) || 0,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      setShowModal(false);
      loadAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // Handle payment submit
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingAccount) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/clinic/pharmacy/credit-accounts/${payingAccount.id}/payment`,
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
      setSuccess(text.paymentSuccess);
      setTimeout(() => setSuccess(null), 3000);
      loadAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : text.paymentError);
    } finally {
      setSaving(false);
    }
  };

  // Toggle account active status
  const toggleAccountStatus = async (account: CreditAccount) => {
    try {
      const response = await fetch(
        `/api/clinic/pharmacy/credit-accounts/${account.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: account.customer_name,
            is_active: !account.is_active,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      loadAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  // Delete account
  const deleteAccount = async (account: CreditAccount) => {
    if (parseFloat(account.current_balance) > 0) {
      setError(text.cannotDelete);
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (!confirm(text.deleteConfirm)) return;

    try {
      const response = await fetch(
        `/api/clinic/pharmacy/credit-accounts/${account.id}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      loadAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  // Loading state
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-8" />
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded" />
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded" />
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b-4 border-foreground sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold">{text.title}</h1>
              <p className="text-sm text-gray-600">{text.subtitle}</p>
            </div>
            <div className="flex gap-2">
              <Link href={`/${lang}/clinic/dashboard`}>
                <Button variant="outline" size="sm">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  {text.backToDashboard}
                </Button>
              </Link>
              <Button variant="primary" onClick={openAddModal}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {text.addAccount}
              </Button>
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
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Card decorator="blue">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-blue/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{text.totalAccounts}</p>
                  <p className="text-2xl font-bold">{stats.totalAccounts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card decorator="red">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-red/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{text.totalOutstanding}</p>
                  <p className="text-2xl font-bold">{text.nrs} {stats.totalOutstanding.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card decorator="yellow">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-yellow/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{text.accountsWithBalance}</p>
                  <p className="text-2xl font-bold">{stats.accountsWithBalance}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and filters */}
        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder={text.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 border-4 border-foreground bg-white focus:border-primary-blue focus:outline-none"
                />
                <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <select
                value={filterActive}
                onChange={(e) => setFilterActive(e.target.value)}
                className="px-4 py-3 border-4 border-foreground bg-white focus:border-primary-blue focus:outline-none min-w-[150px]"
              >
                <option value="">{text.allStatuses}</option>
                <option value="true">{text.active}</option>
                <option value="false">{text.inactive}</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Accounts list */}
        {accounts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery || filterActive ? text.noResults : text.noAccounts}
              </h3>
              <p className="text-gray-600">
                {searchQuery || filterActive ? text.noResultsMessage : text.noAccountsMessage}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-foreground">
                    <tr>
                      <th className="text-left p-4 font-bold">{text.customerName}</th>
                      <th className="text-left p-4 font-bold">{text.phone}</th>
                      <th className="text-right p-4 font-bold">{text.creditLimit}</th>
                      <th className="text-right p-4 font-bold">{text.currentBalance}</th>
                      <th className="text-center p-4 font-bold">{text.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((account) => (
                      <tr key={account.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{account.customer_name}</span>
                            {!account.is_active && (
                              <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
                                {text.inactive}
                              </span>
                            )}
                          </div>
                          {account.address && (
                            <p className="text-sm text-gray-500">{account.address}</p>
                          )}
                        </td>
                        <td className="p-4 text-gray-600">
                          {account.phone || "-"}
                        </td>
                        <td className="p-4 text-right text-gray-600">
                          {text.nrs} {parseFloat(account.credit_limit).toFixed(2)}
                        </td>
                        <td className="p-4 text-right">
                          <span className={`font-bold ${
                            parseFloat(account.current_balance) > 0
                              ? "text-primary-red"
                              : "text-verified"
                          }`}>
                            {parseFloat(account.current_balance) > 0
                              ? `${text.nrs} ${parseFloat(account.current_balance).toFixed(2)}`
                              : text.cleared}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex justify-center gap-2 flex-wrap">
                            {parseFloat(account.current_balance) > 0 && (
                              <button
                                onClick={() => openPaymentModal(account)}
                                className="px-3 py-1 text-sm bg-verified text-white rounded hover:bg-verified/80 transition-colors"
                              >
                                {text.recordPayment}
                              </button>
                            )}
                            <Link href={`/${lang}/clinic/dashboard/pharmacy/khata/${account.id}`}>
                              <button className="px-3 py-1 text-sm bg-primary-blue text-white rounded hover:bg-primary-blue/80 transition-colors">
                                {text.viewLedger}
                              </button>
                            </Link>
                            <button
                              onClick={() => openEditModal(account)}
                              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                            >
                              {text.edit}
                            </button>
                            <button
                              onClick={() => toggleAccountStatus(account)}
                              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                            >
                              {account.is_active ? text.deactivate : text.activate}
                            </button>
                            <button
                              onClick={() => deleteAccount(account)}
                              className="px-3 py-1 text-sm text-primary-red border border-primary-red rounded hover:bg-primary-red/10"
                            >
                              {text.delete}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <h2 className="text-xl font-bold">
                {editingAccount ? text.editAccount : text.addNewAccount}
              </h2>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {text.customerName} <span className="text-primary-red">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-foreground focus:border-primary-blue focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">{text.phone}</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-foreground focus:border-primary-blue focus:outline-none"
                    placeholder="98XXXXXXXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">{text.address}</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-foreground focus:border-primary-blue focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">{text.creditLimit}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">{text.nrs}</span>
                    <input
                      type="number"
                      value={formData.credit_limit}
                      onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                      className="w-full px-4 py-2 pl-12 border-2 border-foreground focus:border-primary-blue focus:outline-none"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowModal(false)}
                  >
                    {text.cancel}
                  </Button>
                  <Button type="submit" variant="primary" className="flex-1" disabled={saving}>
                    {saving ? text.saving : text.save}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && payingAccount && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <h2 className="text-xl font-bold">{text.recordPayment}</h2>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">{text.customerName}</p>
                <p className="font-bold">{payingAccount.customer_name}</p>
                <p className="text-sm text-gray-600 mt-2">{text.currentBalance}</p>
                <p className="text-xl font-bold text-primary-red">
                  {text.nrs} {parseFloat(payingAccount.current_balance).toFixed(2)}
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
                      max={parseFloat(payingAccount.current_balance)}
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
                    {saving ? text.recordingPayment : text.recordPayment}
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
