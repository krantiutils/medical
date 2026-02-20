import { Suspense } from "react";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { headers } from "next/headers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { SessionProvider } from "@/components/providers/session-provider";
import { locales, type Locale } from "@/i18n/config";

interface LangLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    lang: string;
  }>;
}

export function generateStaticParams() {
  return locales.map((locale) => ({ lang: locale }));
}

export default async function LangLayout({ children, params }: LangLayoutProps) {
  const { lang } = await params;

  // Validate that the locale is supported
  if (!locales.includes(lang as Locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(lang);

  // Get messages for the current locale
  const messages = await getMessages();

  // Subdomain pages render their own navbar/footer via page builder
  const headersList = await headers();
  const isSubdomain = !!headersList.get("x-subdomain");

  return (
    <SessionProvider>
      <NextIntlClientProvider messages={messages}>
        <div data-lang={lang} className="min-h-screen flex flex-col">
          {!isSubdomain && (
            <Suspense>
              <Header lang={lang} />
            </Suspense>
          )}
          <main className="flex-1">{children}</main>
          {!isSubdomain && <Footer lang={lang} />}
        </div>
      </NextIntlClientProvider>
    </SessionProvider>
  );
}
