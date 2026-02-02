import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
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

  return (
    <NextIntlClientProvider messages={messages}>
      <div data-lang={lang} className="min-h-screen flex flex-col">
        <Header lang={lang} />
        <main className="flex-1">{children}</main>
        <Footer lang={lang} />
      </div>
    </NextIntlClientProvider>
  );
}
