import { ReactNode } from "react";
import { ClinicSidebar } from "@/components/layout/clinic-sidebar";

interface ClinicDashboardLayoutProps {
  children: ReactNode;
}

export default function ClinicDashboardLayout({ children }: ClinicDashboardLayoutProps) {
  return (
    <div className="flex min-h-[calc(100vh-5rem)]">
      <ClinicSidebar />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
