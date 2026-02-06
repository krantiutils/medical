import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
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

  // Store clinic info in cookie for client components to access
  const cookieStore = await cookies();
  cookieStore.set("clinic_id", access.clinicId, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 1 day
  });
  cookieStore.set("clinic_role", access.role, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
  });

  return (
    <div className="flex min-h-[calc(100vh-5rem)]">
      <ClinicSidebar userRole={access.role} />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
