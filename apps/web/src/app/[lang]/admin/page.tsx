import { redirect } from "next/navigation";

interface AdminPageProps {
  params: Promise<{ lang: string }>;
}

export default async function AdminPage({ params }: AdminPageProps) {
  const { lang } = await params;
  redirect(`/${lang}/admin/claims`);
}
