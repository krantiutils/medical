"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");

  const states = {
    success: {
      icon: "\u2713",
      iconBg: "bg-green-600",
      title: "Email Verified",
      message: "Your email has been verified successfully. You now have full access to all features.",
      action: { text: "Go to Dashboard", href: "/en/dashboard" },
    },
    expired: {
      icon: "\u23F1",
      iconBg: "bg-yellow-500",
      title: "Link Expired",
      message: "This verification link has expired. Please request a new one from your dashboard.",
      action: { text: "Go to Dashboard", href: "/en/dashboard" },
    },
    invalid: {
      icon: "\u2715",
      iconBg: "bg-red-600",
      title: "Invalid Link",
      message: "This verification link is invalid or has already been used.",
      action: { text: "Go Home", href: "/en" },
    },
    error: {
      icon: "!",
      iconBg: "bg-red-600",
      title: "Something Went Wrong",
      message: "An error occurred while verifying your email. Please try again later.",
      action: { text: "Go Home", href: "/en" },
    },
  };

  const state = states[status as keyof typeof states] || states.invalid;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-white border-4 border-foreground shadow-[8px_8px_0_0_#121212] p-8 max-w-md w-full text-center">
        <div
          className={`w-16 h-16 ${state.iconBg} text-white text-3xl font-black flex items-center justify-center mx-auto mb-6 border-2 border-foreground`}
        >
          {state.icon}
        </div>
        <h1 className="text-2xl font-black uppercase tracking-wide mb-4">
          {state.title}
        </h1>
        <p className="text-foreground/70 mb-8 leading-relaxed">
          {state.message}
        </p>
        <Link
          href={state.action.href}
          className="inline-block bg-primary-red text-white font-bold uppercase tracking-wider text-sm px-8 py-3 border-2 border-foreground shadow-[4px_4px_0_0_#121212] hover:shadow-[2px_2px_0_0_#121212] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          {state.action.text}
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p>Loading...</p>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
