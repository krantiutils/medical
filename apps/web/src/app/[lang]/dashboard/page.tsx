"use client";

import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const quickLinks = [
  {
    label: "Profile",
    labelNe: "प्रोफाइल",
    href: "/profile",
    desc: "Manage your professional profile",
    descNe: "तपाईंको पेशेवर प्रोफाइल व्यवस्थापन गर्नुहोस्",
    color: "bg-primary-blue",
  },
  {
    label: "Consultations",
    labelNe: "परामर्शहरू",
    href: "/consultations",
    desc: "View your consultations",
    descNe: "तपाईंका परामर्शहरू हेर्नुहोस्",
    color: "bg-primary-red",
  },
  {
    label: "Lab Results",
    labelNe: "ल्याब नतिजाहरू",
    href: "/lab-results",
    desc: "Check your lab test results",
    descNe: "तपाईंका ल्याब परीक्षा नतिजाहरू जाँच गर्नुहोस्",
    color: "bg-primary-yellow",
  },
  {
    label: "Reviews",
    labelNe: "समीक्षाहरू",
    href: "/reviews",
    desc: "See and respond to reviews",
    descNe: "समीक्षाहरू हेर्नुहोस् र प्रतिक्रिया दिनुहोस्",
    color: "bg-verified",
  },
  {
    label: "Claims",
    labelNe: "दावीहरू",
    href: "/claims",
    desc: "Track your profile verification",
    descNe: "तपाईंको प्रोफाइल प्रमाणीकरण ट्र्याक गर्नुहोस्",
    color: "bg-primary-blue",
  },
  {
    label: "Instant Requests",
    labelNe: "तत्काल अनुरोधहरू",
    href: "/instant-requests",
    desc: "Manage instant consultation requests",
    descNe: "तत्काल परामर्श अनुरोधहरू व्यवस्थापन गर्नुहोस्",
    color: "bg-primary-red",
  },
];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const { lang } = useParams<{ lang: string }>();
  const isNe = lang === "ne";

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-foreground/10 rounded w-64 mb-4" />
            <div className="h-4 bg-foreground/10 rounded w-48 mb-8" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-foreground/5 rounded border-2 border-foreground/10" />
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <h1 className="text-2xl font-bold mb-4">
                {isNe ? "कृपया लगइन गर्नुहोस्" : "Please log in"}
              </h1>
              <p className="text-foreground/60 mb-6">
                {isNe
                  ? "ड्यासबोर्ड पहुँच गर्न लगइन आवश्यक छ।"
                  : "You need to be logged in to access your dashboard."}
              </p>
              <Link href={`/${lang}/login?callbackUrl=/${lang}/dashboard`}>
                <Button variant="primary">
                  {isNe ? "लगइन गर्नुहोस्" : "Login"}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Welcome */}
        <div className="mb-8">
          <span className="inline-block px-4 py-2 mb-4 text-xs font-bold uppercase tracking-widest bg-primary-yellow border-2 border-foreground">
            {isNe ? "ड्यासबोर्ड" : "Dashboard"}
          </span>
          <h1 className="text-3xl lg:text-4xl font-black uppercase tracking-tight mb-2">
            {isNe ? "स्वागत छ" : "Welcome"},{" "}
            {session.user?.name || session.user?.email}
          </h1>
          <p className="text-foreground/60">
            {isNe
              ? "तपाईंको स्वास्थ्य ड्यासबोर्ड"
              : "Your Swasthya dashboard"}
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((link) => (
            <Link key={link.href} href={`/${lang}/dashboard${link.href}`}>
              <Card className="hover:-translate-y-1 transition-transform cursor-pointer group h-full">
                <CardContent className="py-6">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 ${link.color} rounded-lg flex items-center justify-center border-2 border-foreground shadow-[4px_4px_0_0_#121212] group-hover:shadow-[2px_2px_0_0_#121212] group-hover:translate-x-[2px] group-hover:translate-y-[2px] transition-all flex-shrink-0`}
                    >
                      <span className="text-white font-black text-lg">
                        {(isNe ? link.labelNe : link.label).charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">
                        {isNe ? link.labelNe : link.label}
                      </h3>
                      <p className="text-sm text-foreground/60">
                        {isNe ? link.descNe : link.desc}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
