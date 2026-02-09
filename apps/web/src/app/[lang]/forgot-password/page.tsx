"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type Step = "input" | "otp" | "password" | "success" | "email_sent";
type Method = "phone" | "email";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { lang } = useParams<{ lang: string }>();
  const isNe = lang === "ne";

  const [method, setMethod] = useState<Method>("email");
  const [step, setStep] = useState<Step>("input");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
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
    subtitlePhone: isNe ? "आफ्नो फोन नम्बर प्रविष्ट गर्नुहोस्" : "Enter your phone number to reset your password",
    subtitleEmail: isNe ? "आफ्नो इमेल प्रविष्ट गर्नुहोस्" : "Enter your email to receive a reset link",
    phone: isNe ? "फोन नम्बर" : "Phone Number",
    email: isNe ? "इमेल" : "Email",
    tabPhone: isNe ? "फोन" : "Phone",
    tabEmail: isNe ? "इमेल" : "Email",
    sendOtp: isNe ? "OTP पठाउनुहोस्" : "Send OTP",
    sendLink: isNe ? "रिसेट लिंक पठाउनुहोस्" : "Send Reset Link",
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
    emailSentTitle: isNe ? "इमेल पठाइयो!" : "Email Sent!",
    emailSentMsg: isNe
      ? "यदि यस इमेलसँग खाता अवस्थित छ भने, पासवर्ड रिसेट लिंक पठाइएको छ।"
      : "If an account exists with this email, a password reset link has been sent.",
    checkInbox: isNe ? "कृपया आफ्नो इनबक्स (र स्प्याम फोल्डर) जाँच गर्नुहोस्।" : "Please check your inbox (and spam folder).",
    resendEmail: isNe ? "इमेल पुनः पठाउनुहोस्" : "Resend Email",
    errorNetworkError: isNe ? "नेटवर्क त्रुटि। कृपया पुन: प्रयास गर्नुहोस्।" : "Network error. Please try again.",
    errorFailedOtp: isNe ? "OTP पठाउन असफल" : "Failed to send OTP",
    errorResetEmailFailed: isNe ? "रिसेट इमेल पठाउन असफल" : "Failed to send reset email",
    errorInvalidOtp: isNe ? "अमान्य OTP" : "Invalid OTP",
    errorPasswordMismatch: isNe ? "पासवर्डहरू मेल खाँदैनन्" : "Passwords do not match",
    errorPasswordLength: isNe ? "पासवर्ड कम्तिमा ८ वर्णको हुनुपर्छ" : "Password must be at least 8 characters",
    errorResetFailed: isNe ? "पासवर्ड रिसेट गर्न असफल" : "Failed to reset password",
    placeholderMinChars: isNe ? "कम्तिमा ८ वर्ण" : "At least 8 characters",
    placeholderConfirmPassword: isNe ? "पासवर्ड पुष्टि गर्नुहोस्" : "Confirm your password",
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
        setError(data.error || t.errorFailedOtp);
        return;
      }

      setResendTimer(60);
      setStep("otp");
    } catch {
      setError(t.errorNetworkError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendResetEmail = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t.errorResetEmailFailed);
        return;
      }

      setResendTimer(60);
      setStep("email_sent");
    } catch {
      setError(t.errorNetworkError);
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
        setError(data.error || t.errorInvalidOtp);
        return;
      }

      setVerificationToken(data.verificationToken);
      setStep("password");
    } catch {
      setError(t.errorNetworkError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError(null);

    if (password !== confirmPassword) {
      setError(t.errorPasswordMismatch);
      return;
    }

    if (password.length < 8) {
      setError(t.errorPasswordLength);
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
        setError(data.error || t.errorResetFailed);
        return;
      }

      setStep("success");
    } catch {
      setError(t.errorNetworkError);
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    setError(null);
    if (step === "otp") setStep("input");
    else if (step === "password") setStep("otp");
    else if (step === "email_sent") setStep("input");
  };

  const switchMethod = (newMethod: Method) => {
    setMethod(newMethod);
    setStep("input");
    setError(null);
    setPhone("");
    setEmail("");
    setOtp("");
    setPassword("");
    setConfirmPassword("");
    setResendTimer(0);
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          {step !== "input" && step !== "success" && (
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
          ) : step === "email_sent" ? (
            <>
              <div className="w-16 h-16 bg-primary-blue rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-3xl font-black uppercase mb-2">{t.emailSentTitle}</h1>
              <p className="text-foreground/70 mb-2">{t.emailSentMsg}</p>
              <p className="text-foreground/50 text-sm">{t.checkInbox}</p>
            </>
          ) : (
            <>
              <span className="inline-block px-4 py-2 mb-4 text-xs font-bold uppercase tracking-widest bg-primary-yellow border-2 border-foreground">
                {step === "otp" ? t.enterOtp : step === "password" ? t.newPassword : t.title}
              </span>
              <h1 className="text-3xl font-black uppercase mb-2">{t.title}</h1>
              {step === "input" && (
                <p className="text-foreground/70">
                  {method === "phone" ? t.subtitlePhone : t.subtitleEmail}
                </p>
              )}
            </>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-primary-red/10 border-2 border-primary-red text-primary-red">
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Method Toggle (only on input step) */}
        {step === "input" && (
          <div className="flex mb-6 border-4 border-foreground">
            <button
              type="button"
              onClick={() => switchMethod("email")}
              className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${
                method === "email"
                  ? "bg-primary-blue text-white"
                  : "bg-white text-foreground hover:bg-foreground/5"
              }`}
            >
              {t.tabEmail}
            </button>
            <button
              type="button"
              onClick={() => switchMethod("phone")}
              className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider border-l-4 border-foreground transition-colors ${
                method === "phone"
                  ? "bg-primary-blue text-white"
                  : "bg-white text-foreground hover:bg-foreground/5"
              }`}
            >
              {t.tabPhone}
            </button>
          </div>
        )}

        {/* Input Step */}
        {step === "input" && method === "phone" && (
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

        {step === "input" && method === "email" && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2">
                {t.email}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-white border-4 border-foreground focus:outline-none focus:border-primary-blue placeholder:text-foreground/40 transition-colors text-lg"
                autoFocus
              />
            </div>
            <Button
              type="button"
              variant="primary"
              size="lg"
              className="w-full py-4"
              onClick={handleSendResetEmail}
              disabled={isLoading || !email.includes("@")}
            >
              {isLoading ? t.sending : t.sendLink}
            </Button>
            <Link
              href={`/${lang}/login`}
              className="block text-center text-sm font-bold text-primary-blue hover:underline"
            >
              {t.backToLogin}
            </Link>
          </div>
        )}

        {/* Email Sent */}
        {step === "email_sent" && (
          <div className="space-y-4">
            <div className="text-center">
              {resendTimer > 0 ? (
                <span className="text-foreground/60">{t.resendIn} {resendTimer}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendResetEmail}
                  className="text-primary-blue font-bold hover:underline"
                  disabled={isLoading}
                >
                  {t.resendEmail}
                </button>
              )}
            </div>
            <Link
              href={`/${lang}/login`}
              className="block text-center text-sm font-bold text-foreground/60 hover:text-foreground"
            >
              {t.backToLogin}
            </Link>
          </div>
        )}

        {/* OTP (phone flow only) */}
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

        {/* Password (phone flow only) */}
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
                placeholder={t.placeholderMinChars}
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
                placeholder={t.placeholderConfirmPassword}
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
