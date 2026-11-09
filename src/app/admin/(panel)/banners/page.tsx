import BannersManager from "@/components/admin/BannersManager";
import { PageHead } from "@/components/admin/ui";
import { prisma } from "@/lib/db";

export const metadata = { title: "Banners" };
export const dynamic = "force-dynamic";

export default async function AdminBanners() {
  const banners = await prisma.banner.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  return (
    <>
      <PageHead title="Homepage banners" subtitle="The large slides at the top of the homepage. Two or three work best." />
      <BannersManager banners={banners.map((b) => ({ ...b, createdAt: undefined }))} />
    </>
  );
}
