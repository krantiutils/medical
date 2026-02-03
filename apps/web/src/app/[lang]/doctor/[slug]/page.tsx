import { notFound, redirect } from "next/navigation";
import { prisma, ProfessionalType } from "@swasthya/database";

interface DoctorPageProps {
  params: Promise<{
    lang: string;
    slug: string;
  }>;
}

function getPathForType(type: ProfessionalType): string {
  switch (type) {
    case ProfessionalType.DOCTOR:
      return "doctors";
    case ProfessionalType.DENTIST:
      return "dentists";
    case ProfessionalType.PHARMACIST:
      return "pharmacists";
    default:
      return "doctors";
  }
}

/**
 * Legacy route that redirects to the correct type-specific URL.
 * Kept for backwards compatibility with old links.
 */
export default async function DoctorPage({ params }: DoctorPageProps) {
  const { lang, slug } = await params;

  // Find the professional to determine their type
  const professional = await prisma.professional.findFirst({
    where: { slug },
    select: { type: true, slug: true },
  });

  if (!professional) {
    notFound();
  }

  // 301 permanent redirect to the correct type-specific URL
  const path = getPathForType(professional.type);
  redirect(`/${lang}/${path}/${professional.slug}`);
}
