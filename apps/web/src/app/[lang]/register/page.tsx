"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type AccountType = "patient" | "clinic";
type AuthMethod = "phone" | "email";
type Step = "type" | "phone-input" | "otp" | "password" | "email-input";

export default function RegisterPage() {
  const router = useRouter();
  const { lang } = useParams<{ lang: string }>();
  const isNe = lang === "ne";

  // State
  const [step, setStep] = useState<Step>("type");
  const [accountType, setAccountType] = useState<AccountType>("patient");
  const [authMethod, setAuthMethod] = useState<AuthMethod>("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationToken, setVerificationToken] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const t = {
    // Type selection
    createAccount: isNe ? "खाता बनाउनुहोस्" : "Create Account",
    chooseType: isNe ? "तपाईं कसरी प्रयोग गर्नुहुन्छ?" : "How will you use DoctorSewa?",
    patient: isNe ? "बिरामी" : "Patient",
    patientDesc: isNe ? "डाक्टर खोज्न, अपोइन्टमेन्ट लिन" : "Find doctors, book appointments, view lab results",
    clinic: isNe ? "क्लिनिक / डाक्टर" : "Clinic / Doctor",
    clinicDesc: isNe ? "आफ्नो क्लिनिक दर्ता गर्न" : "Register your clinic, manage appointments & patients",
    continue: isNe ? "जारी राख्नुहोस्" : "Continue",

    // Auth method
    withPhone: isNe ? "फोनबाट" : "With Phone",
    withEmail: isNe ? "इमेलबाट" : "With Email",
    phoneLabel: isNe ? "फोन नम्बर" : "Phone Number",
    emailLabel: isNe ? "इमेल" : "Email",
    sendOtp: isNe ? "OTP पठाउनुहोस्" : "Send OTP",
    sending: isNe ? "पठाउँदै..." : "Sending...",

    // OTP
    enterOtp: isNe ? "OTP प्रविष्ट गर्नुहोस्" : "Enter OTP",
    otpSentTo: isNe ? "OTP पठाइएको:" : "OTP sent to:",
    verifyOtp: isNe ? "प्रमाणित गर्नुहोस्" : "Verify OTP",
    resendOtp: isNe ? "पुनः पठाउनुहोस्" : "Resend OTP",
    resendIn: isNe ? "पुनः पठाउन सकिन्छ:" : "Resend in:",

    // Password
    setPassword: isNe ? "पासवर्ड सेट गर्नुहोस्" : "Set Your Password",
    password: isNe ? "पासवर्ड" : "Password",
    confirmPassword: isNe ? "पासवर्ड पुष्टि" : "Confirm Password",
    createBtn: isNe ? "खाता बनाउनुहोस्" : "Create Account",
    creating: isNe ? "बनाउँदै..." : "Creating...",

    // Misc
    haveAccount: isNe ? "पहिले नै खाता छ?" : "Already have an account?",
    signIn: isNe ? "साइन इन" : "Sign In",
    back: isNe ? "पछाडि" : "Back",
    or: isNe ? "वा" : "or",
    googleSignUp: isNe ? "Google बाट" : "Continue with Google",
    terms: isNe ? "सेवाका सर्तहरू" : "Terms of Service",
    privacy: isNe ? "गोपनीयता नीति" : "Privacy Policy",
    errorNetworkError: isNe ? "नेटवर्क त्रुटि। कृपया पुन: प्रयास गर्नुहोस्।" : "Network error. Please try again.",
    errorFailedOtp: isNe ? "OTP पठाउन असफल" : "Failed to send OTP",
    errorInvalidOtp: isNe ? "अमान्य OTP" : "Invalid OTP",
    errorPasswordMismatch: isNe ? "पासवर्डहरू मेल खाँदैनन्" : "Passwords do not match",
    errorPasswordLength: isNe ? "पासवर्ड कम्तिमा ८ वर्णको हुनुपर्छ" : "Password must be at least 8 characters",
    errorRegistrationFailed: isNe ? "दर्ता असफल" : "Registration failed",
    errorUnexpected: isNe ? "अनपेक्षित त्रुटि भयो" : "An unexpected error occurred",
    placeholderMinChars: isNe ? "कम्तिमा ८ वर्ण" : "At least 8 characters",
    placeholderConfirmPassword: isNe ? "पासवर्ड पुष्टि गर्नुहोस्" : "Confirm your password",
    termsNotice: isNe ? "खाता बनाएर, तपाईं हाम्रो मान्नुहुन्छ" : "By creating an account, you agree to our",
    andText: isNe ? "र" : "and",
    decorativeClinic: isNe ? "आफ्नो क्लिनिक दर्ता गर्नुहोस् र हजारौं बिरामीसम्म पुग्नुहोस्" : "Register your clinic and reach thousands of patients",
    decorativePatient: isNe ? "नेपालका उत्कृष्ट स्वास्थ्य पेशेवरहरू खोज्नुहोस्" : "Find the best healthcare professionals in Nepal",
  };

  const handleSendOtp = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, purpose: "REGISTER" }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t.errorFailedOtp);
        return;
      }

      setOtpSent(true);
      setResendTimer(60);
      setStep("otp");
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
        body: JSON.stringify({ phone, code: otp, purpose: "REGISTER" }),
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

  const handleRegister = async () => {
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
      const body = authMethod === "phone"
        ? { phone, password, verificationToken, accountType }
        : { email, password, accountType };

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t.errorRegistrationFailed);
        return;
      }

      // Auto sign in
      const signInResult = await signIn(
        authMethod === "phone" ? "phone-credentials" : "credentials",
        {
          [authMethod === "phone" ? "phone" : "email"]: authMethod === "phone" ? phone : email,
          password,
          redirect: false,
        }
      );

      if (signInResult?.ok) {
        // Redirect based on account type
        if (accountType === "clinic") {
          router.push(`/${lang}/clinic/register`);
        } else {
          router.push(`/${lang}/dashboard`);
        }
        router.refresh();
      } else {
        router.push(`/${lang}/login`);
      }
    } catch {
      setError(t.errorUnexpected);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    signIn("google", {
      callbackUrl: accountType === "clinic" ? `/${lang}/clinic/register` : `/${lang}/dashboard`,
    });
  };

  const goBack = () => {
    setError(null);
    if (step === "otp") setStep("phone-input");
    else if (step === "password") setStep(authMethod === "phone" ? "otp" : "email-input");
    else if (step === "phone-input" || step === "email-input") setStep("type");
  };

  return (
    <main className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex lg:w-[40%] bg-primary-red relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -left-20 w-64 h-64 rounded-full border-8 border-white/20" />
          <div className="absolute bottom-1/3 right-1/4 w-12 h-12 rounded-full bg-primary-yellow" />
          <div className="absolute top-1/2 right-12 w-20 h-20 bg-primary-blue rotate-12" />
          <div
            className="absolute bottom-20 left-20 w-24 h-24 bg-white/20"
            style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
          />
          <div className="absolute bottom-1/4 left-1/3 w-32 h-32 border-8 border-white/30 rotate-45" />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12">
          <div className="text-white text-center">
            <div className="text-5xl font-black mb-4">डक्टरसेवा</div>
            <div className="text-lg font-medium uppercase tracking-widest opacity-80">
              DoctorSewa
            </div>
            <p className="mt-6 text-white/70 max-w-xs">
              {accountType === "clinic"
                ? t.decorativeClinic
                : t.decorativePatient}
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            {step !== "type" && (
              <button
                onClick={goBack}
                className="mb-4 text-sm font-bold text-foreground/60 hover:text-foreground flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {t.back}
              </button>
            )}
            <span className="inline-block px-4 py-2 mb-4 text-xs font-bold uppercase tracking-widest bg-primary-yellow border-2 border-foreground">
              {accountType === "clinic" ? (isNe ? "क्लिनिक" : "Clinic") : (isNe ? "बिरामी" : "Patient")}
            </span>
            <h1 className="text-3xl lg:text-4xl font-black uppercase leading-tight tracking-tight mb-2">
              {step === "type" ? t.createAccount : step === "otp" ? t.enterOtp : step === "password" ? t.setPassword : t.createAccount}
            </h1>
            {step === "type" && <p className="text-foreground/70">{t.chooseType}</p>}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-primary-red/10 border-2 border-primary-red text-primary-red">
              <p className="font-medium">{error}</p>
            </div>
          )}

          {/* Step: Account Type Selection */}
          {step === "type" && (
            <div className="space-y-4">
              {/* Account Type Cards */}
              <button
                type="button"
                onClick={() => setAccountType("patient")}
                className={`w-full p-5 text-left border-4 transition-all ${
                  accountType === "patient"
                    ? "border-primary-blue bg-primary-blue/5"
                    : "border-foreground/20 hover:border-foreground/40"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 flex items-center justify-center ${accountType === "patient" ? "bg-primary-blue text-white" : "bg-foreground/10"}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-lg">{t.patient}</div>
                    <div className="text-sm text-foreground/60">{t.patientDesc}</div>
                  </div>
                  {accountType === "patient" && (
                    <div className="w-6 h-6 bg-primary-blue text-white flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAccountType("clinic")}
                className={`w-full p-5 text-left border-4 transition-all ${
                  accountType === "clinic"
                    ? "border-primary-blue bg-primary-blue/5"
                    : "border-foreground/20 hover:border-foreground/40"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 flex items-center justify-center ${accountType === "clinic" ? "bg-primary-blue text-white" : "bg-foreground/10"}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-lg">{t.clinic}</div>
                    <div className="text-sm text-foreground/60">{t.clinicDesc}</div>
                  </div>
                  {accountType === "clinic" && (
                    <div className="w-6 h-6 bg-primary-blue text-white flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>

              {/* Auth Method Tabs */}
              <div className="pt-4">
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setAuthMethod("phone")}
                    className={`flex-1 py-2 px-4 text-sm font-bold uppercase tracking-wider border-2 transition-colors ${
                      authMethod === "phone"
                        ? "bg-foreground text-white border-foreground"
                        : "border-foreground/30 text-foreground/60 hover:border-foreground"
                    }`}
                  >
                    {t.withPhone}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMethod("email")}
                    className={`flex-1 py-2 px-4 text-sm font-bold uppercase tracking-wider border-2 transition-colors ${
                      authMethod === "email"
                        ? "bg-foreground text-white border-foreground"
                        : "border-foreground/30 text-foreground/60 hover:border-foreground"
                    }`}
                  >
                    {t.withEmail}
                  </button>
                </div>

                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  className="w-full py-4"
                  onClick={() => setStep(authMethod === "phone" ? "phone-input" : "email-input")}
                >
                  {t.continue}
                </Button>
              </div>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-foreground/20" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-widest">
                  <span className="bg-background px-4 text-foreground/60 font-bold">{t.or}</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full py-4 flex items-center justify-center gap-3"
                onClick={handleGoogleSignUp}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {t.googleSignUp}
              </Button>
            </div>
          )}

          {/* Step: Phone Input */}
          {step === "phone-input" && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2">
                  {t.phoneLabel}
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
            </div>
          )}

          {/* Step: OTP Verification */}
          {step === "otp" && (
            <div className="space-y-6">
              <p className="text-foreground/70">
                {t.otpSentTo} <strong>{phone.slice(0, 3)}****{phone.slice(-3)}</strong>
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
                {isLoading ? t.sending : t.verifyOtp}
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
                    {t.resendOtp}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Step: Email Input */}
          {step === "email-input" && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2">
                  {t.emailLabel}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 bg-white border-4 border-foreground focus:outline-none focus:border-primary-blue placeholder:text-foreground/40 transition-colors"
                  autoFocus
                />
              </div>
              <Button
                type="button"
                variant="primary"
                size="lg"
                className="w-full py-4"
                onClick={() => setStep("password")}
                disabled={!email.includes("@")}
              >
                {t.continue}
              </Button>
            </div>
          )}

          {/* Step: Password */}
          {step === "password" && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2">
                  {t.password}
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
                onClick={handleRegister}
                disabled={isLoading || password.length < 8 || password !== confirmPassword}
              >
                {isLoading ? t.creating : t.createBtn}
              </Button>
            </div>
          )}

          {/* Login Link */}
          <p className="mt-8 text-center text-foreground/70">
            {t.haveAccount}{" "}
            <Link href={`/${lang}/login`} className="font-bold text-primary-blue hover:underline">
              {t.signIn}
            </Link>
          </p>

          {/* Terms notice */}
          <p className="mt-6 text-center text-xs text-foreground/50">
            {t.termsNotice}{" "}
            <Link href={`/${lang}/terms`} className="underline hover:text-foreground/70">
              {t.terms}
            </Link>{" "}
            {t.andText}{" "}
            <Link href={`/${lang}/privacy`} className="underline hover:text-foreground/70">
              {t.privacy}
            </Link>
          </p>
        </div>
      </div>

      {/* Mobile geometric accent bar */}
      <div className="lg:hidden h-4 flex">
        <div className="flex-1 bg-primary-red" />
        <div className="flex-1 bg-primary-blue" />
        <div className="flex-1 bg-primary-yellow" />
      </div>
    </main>
  );
}
