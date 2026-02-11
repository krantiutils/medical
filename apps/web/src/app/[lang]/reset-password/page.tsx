"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { lang } = useParams<{ lang: string }>();
  const searchParams = useSearchParams();
  const isNe = lang === "ne";

  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const t = {
    title: isNe ? "नयाँ पासवर्ड सेट गर्नुहोस्" : "Set New Password",
    newPassword: isNe ? "नयाँ पासवर्ड" : "New Password",
    confirmPassword: isNe ? "पासवर्ड पुष्टि गर्नुहोस्" : "Confirm Password",
    email: isNe ? "इमेल" : "Email",
    emailHelp: isNe
      ? "तपाईंले रिसेट लिंक प्राप्त गर्नुभएको इमेल"
      : "The email address where you received the reset link",
    resetPassword: isNe ? "पासवर्ड रिसेट गर्नुहोस्" : "Reset Password",
    resetting: isNe ? "रिसेट हुँदैछ..." : "Resetting...",
    success: isNe ? "पासवर्ड रिसेट भयो!" : "Password Reset!",
    successMsg: isNe
      ? "तपाईंको पासवर्ड सफलतापूर्वक रिसेट गरियो।"
      : "Your password has been successfully reset.",
    loginNow: isNe ? "अहिले लगइन गर्नुहोस्" : "Login Now",
    invalidLink: isNe
      ? "अमान्य वा म्याद सकिएको रिसेट लिंक।"
      : "Invalid or expired reset link.",
    requestNew: isNe
      ? "नयाँ रिसेट लिंक अनुरोध गर्नुहोस्"
      : "Request a new reset link",
    minLength: isNe ? "कम्तिमा ८ अक्षर" : "Minimum 8 characters",
    mismatch: isNe ? "पासवर्डहरू मेल खाँदैनन्" : "Passwords do not match",
  };

  // No token = invalid link
  if (!token) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-primary-red rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-3xl font-black uppercase mb-2">{t.invalidLink}</h1>
          <Link
            href={`/${lang}/forgot-password`}
            className="inline-block mt-4 text-primary-blue font-bold hover:underline"
          >
            {t.requestNew}
          </Link>
        </div>
      </main>
    );
  }

  const handleReset = async () => {
    setError(null);

    if (!email.trim()) {
      setError(isNe ? "इमेल आवश्यक छ" : "Email is required");
      return;
    }

    if (password.length < 8) {
      setError(t.minLength);
      return;
    }

    if (password !== confirmPassword) {
      setError(t.mismatch);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to reset password");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-black uppercase mb-2">{t.success}</h1>
          <p className="text-foreground/70 mb-6">{t.successMsg}</p>
          <Button
            type="button"
            variant="primary"
            size="lg"
            className="w-full py-4"
            onClick={() => router.push(`/${lang}/login`)}
          >
            {t.loginNow}
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <span className="inline-block px-4 py-2 mb-4 text-xs font-bold uppercase tracking-widest bg-primary-yellow border-2 border-foreground">
            {t.newPassword}
          </span>
          <h1 className="text-3xl font-black uppercase mb-2">{t.title}</h1>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-primary-red/10 border-2 border-primary-red text-primary-red">
            <p className="font-medium">{error}</p>
          </div>
        )}

        <div className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2">
              {t.email}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 bg-white border-4 border-foreground focus:outline-none focus:border-primary-blue placeholder:text-foreground/40 transition-colors"
              autoFocus
            />
            <p className="text-xs text-foreground/40 mt-1">{t.emailHelp}</p>
          </div>

          {/* New password */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2">
              {t.newPassword}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isNe ? "कम्तिमा ८ अक्षर" : "At least 8 characters"}
              className="w-full px-4 py-3 bg-white border-4 border-foreground focus:outline-none focus:border-primary-blue placeholder:text-foreground/40 transition-colors"
            />
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2">
              {t.confirmPassword}
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={isNe ? "पासवर्ड पुष्टि गर्नुहोस्" : "Confirm your password"}
              className={`w-full px-4 py-3 bg-white border-4 focus:outline-none placeholder:text-foreground/40 transition-colors ${
                confirmPassword && confirmPassword !== password
                  ? "border-primary-red focus:border-primary-red"
                  : "border-foreground focus:border-primary-blue"
              }`}
            />
            {confirmPassword && confirmPassword !== password && (
              <p className="text-xs text-primary-red mt-1">{t.mismatch}</p>
            )}
          </div>

          <Button
            type="button"
            variant="primary"
            size="lg"
            className="w-full py-4"
            onClick={handleReset}
            disabled={isLoading || password.length < 8 || password !== confirmPassword || !email.trim()}
          >
            {isLoading ? t.resetting : t.resetPassword}
          </Button>
        </div>
      </div>
    </main>
  );
}
