import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Invoice from "@/components/store/Invoice";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Invoice", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function CustomerInvoice({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = (await getSessionUser())!;
  const [order, settings] = await Promise.all([prisma.order.findFirst({ where: { id, userId: user.id }, include: { items: true } }), getSettings()]);
  if (!order) notFound();
  return <Invoice order={order} settings={settings} />;
}
