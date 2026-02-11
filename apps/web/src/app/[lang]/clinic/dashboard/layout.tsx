import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { ClinicSidebar } from "@/components/layout/clinic-sidebar";
import { getClinicAccess } from "@/lib/require-clinic-access";

interface ClinicDashboardLayoutProps {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}

export default async function ClinicDashboardLayout({
  children,
  params
}: ClinicDashboardLayoutProps) {
  const { lang } = await params;

  // Check clinic access at layout level - protects all dashboard pages
  const access = await getClinicAccess();

  if (!access.hasAccess) {
    if (access.reason === "unauthenticated") {
      redirect(`/${lang}/login?callbackUrl=/${lang}/clinic/dashboard`);
    }
    if (access.reason === "no_clinic") {
      redirect(`/${lang}/clinic/register`);
    }
    // no_access or permission_denied
    redirect(`/${lang}?error=clinic_access_denied`);
  }

  return (
    <div className="flex min-h-[calc(100vh-5rem)]">
      <ClinicSidebar userRole={access.role} isVerified={access.clinic.verified} />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
