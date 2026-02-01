interface LangLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    lang: string;
  }>;
}

export default async function LangLayout({ children, params }: LangLayoutProps) {
  const { lang } = await params;

  // Validate language (will be expanded with next-intl in US-021)
  const validLangs = ["en", "ne"];
  const currentLang = validLangs.includes(lang) ? lang : "en";

  return (
    <div data-lang={currentLang}>
      {children}
    </div>
  );
}
