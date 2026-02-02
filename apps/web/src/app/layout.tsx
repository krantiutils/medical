import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-outfit",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://swasthya.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Swasthya - Healthcare Directory",
    template: "%s | Swasthya",
  },
  description:
    "Find verified doctors, dentists, and pharmacists in Nepal. Search 40,000+ registered healthcare professionals with NMC, NDA, and NPC credentials.",
  keywords: [
    "doctors in Nepal",
    "dentists in Nepal",
    "pharmacists in Nepal",
    "healthcare directory Nepal",
    "NMC registered doctors",
    "find doctor Nepal",
    "medical professionals Nepal",
    "Swasthya",
  ],
  authors: [{ name: "Swasthya" }],
  creator: "Swasthya",
  publisher: "Swasthya",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Swasthya",
    title: "Swasthya - Healthcare Directory",
    description:
      "Find verified doctors, dentists, and pharmacists in Nepal. Search 40,000+ registered healthcare professionals.",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "Swasthya - Healthcare Directory",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Swasthya - Healthcare Directory",
    description:
      "Find verified doctors, dentists, and pharmacists in Nepal. Search 40,000+ registered healthcare professionals.",
    images: ["/og-default.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={outfit.variable}>
      <body className={`${outfit.className} antialiased`}>{children}</body>
    </html>
  );
}
