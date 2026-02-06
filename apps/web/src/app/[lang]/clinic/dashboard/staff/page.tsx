import { redirect } from "next/navigation";
import { prisma } from "@swasthya/database";
import { requireClinicPermission } from "@/lib/require-clinic-access";
import { ROLE_LABELS } from "@/lib/clinic-permissions";
import { StaffManagement } from "@/components/clinic/StaffManagement";

interface PageProps {
  params: Promise<{ lang: string }>;
}

export default async function StaffPage({ params }: PageProps) {
  const { lang } = await params;

  // Check permission
  const access = await requireClinicPermission("staff");

  if (!access.hasAccess) {
    if (access.reason === "unauthenticated") {
      redirect(`/${lang}/login?callbackUrl=/${lang}/clinic/dashboard/staff`);
    }
    if (access.reason === "no_clinic") {
      redirect(`/${lang}/clinic/register`);
    }
    // Permission denied - redirect to dashboard
    redirect(`/${lang}/clinic/dashboard`);
  }

  // Fetch staff members
  const staffRecords = await prisma.clinicStaff.findMany({
    where: {
      clinic_id: access.clinicId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: [
      { role: "asc" },
      { created_at: "asc" },
    ],
  });

  // Transform to client-friendly structure
  const staff = staffRecords.map((s) => ({
    id: s.id,
    userId: s.user_id,
    name: s.user.name,
    email: s.user.email,
    image: s.user.image,
    role: s.role,
    roleLabel: ROLE_LABELS[s.role],
    joinedAt: s.created_at.toISOString(),
    invitedBy: s.invited_by,
  }));

  return (
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <StaffManagement
          initialStaff={staff}
          currentUserId={access.userId}
          currentUserRole={access.role}
          lang={lang}
        />
      </div>
    </main>
  );
}
