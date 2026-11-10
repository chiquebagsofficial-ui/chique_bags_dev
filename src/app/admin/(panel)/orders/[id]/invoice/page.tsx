import { notFound } from "next/navigation";
import Invoice from "@/components/store/Invoice";
import { prisma } from "@/lib/db";
import { ensureInvoiceNumber } from "@/lib/gst";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Invoice" };
export const dynamic = "force-dynamic";

export default async function AdminInvoice({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const inv = await ensureInvoiceNumber(id);
  if (!inv) notFound();
  const [order, settings] = await Promise.all([prisma.order.findUnique({ where: { id }, include: { items: true } }), getSettings()]);
  if (!order) notFound();
  return <Invoice order={order} settings={settings} invoiceNumber={inv.invoiceNumber} invoiceDate={inv.invoiceDate} />;
}
