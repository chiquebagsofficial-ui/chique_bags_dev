import type { Metadata } from "next";
import { AddressManager, ProfileForm } from "@/components/store/AccountForms";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "My account", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = (await getSessionUser())!;
  const [row, addresses] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id }, select: { password: true } }),
    prisma.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { id: "desc" }] }),
  ]);
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <ProfileForm user={user} hasPassword={Boolean(row?.password)} />
      <AddressManager addresses={addresses} />
    </div>
  );
}
