import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { prisma } from "@swasthya/database";
import { BlogEditor } from "@/components/doctor/blog/BlogEditor";

interface NewBlogPostPageProps {
  params: Promise<{
    lang: string;
  }>;
}

export default async function NewBlogPostPage({ params }: NewBlogPostPageProps) {
  const { lang } = await params;
  const session = await getServerSession();

  if (!session?.user) {
    redirect(`/${lang}/login?callbackUrl=/${lang}/doctor/dashboard/blog/new`);
  }

  const doctor = await prisma.professional.findFirst({
    where: {
      claimed_by_id: session.user.id,
      verified: true,
    },
    select: {
      id: true,
      subdomain: true,
      subdomain_enabled: true,
    },
  });

  if (!doctor) {
    redirect(`/${lang}/doctor/dashboard`);
  }

  return (
    <BlogEditor
      mode="create"
      lang={lang}
      subdomain={
        doctor.subdomain_enabled && doctor.subdomain
          ? doctor.subdomain
          : undefined
      }
    />
  );
}
