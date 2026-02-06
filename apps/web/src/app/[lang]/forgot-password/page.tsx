"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type Step = "phone" | "otp" | "password" | "success";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { lang } = useParams<{ lang: string }>();
  const isNe = lang === "ne";

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationToken, setVerificationToken] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const t = {
    title: isNe ? "पासवर्ड रिसेट" : "Reset Password",
    subtitle: isNe ? "आफ्नो फोन नम्बर प्रविष्ट गर्नुहोस्" : "Enter your phone number to reset your password",
    phone: isNe ? "फोन नम्बर" : "Phone Number",
    sendOtp: isNe ? "OTP पठाउनुहोस्" : "Send OTP",
    sending: isNe ? "पठाउँदै..." : "Sending...",
    enterOtp: isNe ? "OTP प्रविष्ट गर्नुहोस्" : "Enter OTP",
    otpSent: isNe ? "OTP पठाइएको:" : "OTP sent to:",
    verify: isNe ? "प्रमाणित गर्नुहोस्" : "Verify",
    resend: isNe ? "पुनः पठाउनुहोस्" : "Resend OTP",
    resendIn: isNe ? "पुनः पठाउन सकिन्छ:" : "Resend in:",
    newPassword: isNe ? "नयाँ पासवर्ड" : "New Password",
    confirmPassword: isNe ? "पासवर्ड पुष्टि" : "Confirm Password",
    resetPassword: isNe ? "पासवर्ड रिसेट गर्नुहोस्" : "Reset Password",
    resetting: isNe ? "रिसेट हुँदैछ..." : "Resetting...",
    success: isNe ? "पासवर्ड रिसेट भयो!" : "Password Reset!",
    successMsg: isNe ? "तपाईंको पासवर्ड सफलतापूर्वक रिसेट गरियो।" : "Your password has been successfully reset.",
    loginNow: isNe ? "अहिले लगइन गर्नुहोस्" : "Login Now",
    backToLogin: isNe ? "लगइनमा फर्कनुहोस्" : "Back to Login",
    back: isNe ? "पछाडि" : "Back",
  };

  const handleSendOtp = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, purpose: "FORGOT_PASSWORD" }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to send OTP");
        return;
      }

      setResendTimer(60);
      setStep("otp");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: otp, purpose: "FORGOT_PASSWORD" }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid OTP");
        return;
      }

      setVerificationToken(data.verificationToken);
      setStep("password");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password, verificationToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to reset password");
        return;
      }

      setStep("success");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    setError(null);
    if (step === "otp") setStep("phone");
    else if (step === "password") setStep("otp");
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          {step !== "phone" && step !== "success" && (
            <button
              onClick={goBack}
              className="mb-4 text-sm font-bold text-foreground/60 hover:text-foreground flex items-center gap-1 mx-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t.back}
            </button>
          )}

          {step === "success" ? (
            <>
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl font-black uppercase mb-2">{t.success}</h1>
              <p className="text-foreground/70">{t.successMsg}</p>
            </>
          ) : (
            <>
              <span className="inline-block px-4 py-2 mb-4 text-xs font-bold uppercase tracking-widest bg-primary-yellow border-2 border-foreground">
                {step === "otp" ? t.enterOtp : step === "password" ? t.newPassword : t.title}
              </span>
              <h1 className="text-3xl font-black uppercase mb-2">{t.title}</h1>
              {step === "phone" && <p className="text-foreground/70">{t.subtitle}</p>}
            </>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-primary-red/10 border-2 border-primary-red text-primary-red">
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Phone Input */}
        {step === "phone" && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2">
                {t.phone}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="98XXXXXXXX"
                className="w-full px-4 py-3 bg-white border-4 border-foreground focus:outline-none focus:border-primary-blue placeholder:text-foreground/40 transition-colors text-lg tracking-wider"
                autoFocus
              />
            </div>
            <Button
              type="button"
              variant="primary"
              size="lg"
              className="w-full py-4"
              onClick={handleSendOtp}
              disabled={isLoading || phone.length < 10}
            >
              {isLoading ? t.sending : t.sendOtp}
            </Button>
            <Link
              href={`/${lang}/login`}
              className="block text-center text-sm font-bold text-primary-blue hover:underline"
            >
              {t.backToLogin}
            </Link>
          </div>
        )}

        {/* OTP */}
        {step === "otp" && (
          <div className="space-y-6">
            <p className="text-foreground/70 text-center">
              {t.otpSent} <strong>{phone.slice(0, 3)}****{phone.slice(-3)}</strong>
            </p>
            <div>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="------"
                maxLength={6}
                className="w-full px-4 py-4 bg-white border-4 border-foreground focus:outline-none focus:border-primary-blue placeholder:text-foreground/40 transition-colors text-3xl tracking-[0.5em] text-center font-mono"
                autoFocus
              />
            </div>
            <Button
              type="button"
              variant="primary"
              size="lg"
              className="w-full py-4"
              onClick={handleVerifyOtp}
              disabled={isLoading || otp.length !== 6}
            >
              {isLoading ? t.sending : t.verify}
            </Button>
            <div className="text-center">
              {resendTimer > 0 ? (
                <span className="text-foreground/60">{t.resendIn} {resendTimer}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="text-primary-blue font-bold hover:underline"
                  disabled={isLoading}
                >
                  {t.resend}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Password */}
        {step === "password" && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2">
                {t.newPassword}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full px-4 py-3 bg-white border-4 border-foreground focus:outline-none focus:border-primary-blue placeholder:text-foreground/40 transition-colors"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2">
                {t.confirmPassword}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full px-4 py-3 bg-white border-4 border-foreground focus:outline-none focus:border-primary-blue placeholder:text-foreground/40 transition-colors"
              />
            </div>
            <Button
              type="button"
              variant="primary"
              size="lg"
              className="w-full py-4"
              onClick={handleResetPassword}
              disabled={isLoading || password.length < 8 || password !== confirmPassword}
            >
              {isLoading ? t.resetting : t.resetPassword}
            </Button>
          </div>
        )}

        {/* Success */}
        {step === "success" && (
          <div className="space-y-4">
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
        )}
      </div>
    </main>
  );
}
