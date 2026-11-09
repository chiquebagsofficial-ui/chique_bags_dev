import CouponsManager from "@/components/admin/CouponsManager";
import { PageHead } from "@/components/admin/ui";
import { prisma } from "@/lib/db";

export const metadata = { title: "Coupons" };
export const dynamic = "force-dynamic";

export default async function AdminCoupons() {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <>
      <PageHead title="Coupons" subtitle="Discount codes customers can apply at checkout" />
      <CouponsManager coupons={coupons.map((c) => ({ ...c, expiresAt: c.expiresAt?.toISOString() ?? null, createdAt: undefined }))} />
    </>
  );
}
