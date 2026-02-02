"use client";

import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ClaimProfileButtonProps {
  professionalId: string;
  registrationNumber: string;
  isClaimed: boolean;
}

export function ClaimProfileButton({
  professionalId,
  registrationNumber,
  isClaimed,
}: ClaimProfileButtonProps) {
  const { data: session, status } = useSession();
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en";

  // Don't show button if profile is already claimed
  if (isClaimed) {
    return null;
  }

  // Don't show button if not logged in
  if (status === "loading") {
    return null;
  }

  if (!session) {
    return (
      <div className="border-t-2 border-black/20 pt-6">
        <p className="text-sm text-foreground/70 mb-3">
          {lang === "ne"
            ? "यो प्रोफाइल दाबी गर्न लगइन गर्नुहोस्"
            : "Login to claim this profile"}
        </p>
        <Link
          href={`/${lang}/login?callbackUrl=/${lang}/claim?registration=${encodeURIComponent(registrationNumber)}`}
          className="inline-flex items-center justify-center font-bold uppercase tracking-wider px-5 py-2.5 text-base bg-white text-foreground border-2 border-foreground shadow-[4px_4px_0_0_#121212] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-100"
        >
          {lang === "ne" ? "लगइन गर्नुहोस्" : "Login to Claim"}
        </Link>
      </div>
    );
  }

  return (
    <div className="border-t-2 border-black/20 pt-6">
      <p className="text-sm text-foreground/70 mb-3">
        {lang === "ne"
          ? "के यो तपाईंको प्रोफाइल हो?"
          : "Is this your profile?"}
      </p>
      <Link href={`/${lang}/claim?registration=${encodeURIComponent(registrationNumber)}`}>
        <Button variant="primary">
          {lang === "ne" ? "यो प्रोफाइल दाबी गर्नुहोस्" : "Claim This Profile"}
        </Button>
      </Link>
    </div>
  );
}
