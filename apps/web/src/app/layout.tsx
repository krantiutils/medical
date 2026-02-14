import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-outfit",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://doctorsewa.org";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon", type: "image/png", sizes: "32x32" },
    ],
    apple: "/apple-icon",
  },
  title: {
    default: "DoctorSewa - Healthcare Directory",
    template: "%s | DoctorSewa",
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
    "DoctorSewa",
  ],
  authors: [{ name: "DoctorSewa" }],
  creator: "DoctorSewa",
  publisher: "DoctorSewa",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "DoctorSewa",
    title: "DoctorSewa - Healthcare Directory",
    description:
      "Find verified doctors, dentists, and pharmacists in Nepal. Search 40,000+ registered healthcare professionals.",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "DoctorSewa - Healthcare Directory",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DoctorSewa - Healthcare Directory",
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { headers } = await import("next/headers");
  const headersList = await headers();
  const lang = headersList.get("x-locale") ?? "en";

  return (
    <html lang={lang} className={outfit.variable}>
      <body className={`${outfit.className} antialiased`}>{children}</body>
    </html>
  );
}
