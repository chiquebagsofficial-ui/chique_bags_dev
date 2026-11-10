import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Invoice from "@/components/store/Invoice";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureInvoiceNumber } from "@/lib/gst";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Invoice", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function CustomerInvoice({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = (await getSessionUser())!;
  const owned = await prisma.order.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!owned) notFound();
  const inv = await ensureInvoiceNumber(id);
  if (!inv) notFound();
  const [order, settings] = await Promise.all([prisma.order.findUnique({ where: { id }, include: { items: true } }), getSettings()]);
  if (!order) notFound();
  return <Invoice order={order} settings={settings} invoiceNumber={inv.invoiceNumber} invoiceDate={inv.invoiceDate} />;
}
