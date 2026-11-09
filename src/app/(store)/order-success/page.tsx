import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/utils";

export const metadata: Metadata = { title: "Order placed", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function OrderSuccessPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!id) notFound();
  const order = await prisma.order.findFirst({ where: { id, userId: user.id }, include: { items: true } });
  if (!order) notFound();
  if (order.paymentMethod === "ONLINE" && order.paymentStatus !== "PAID") redirect(`/order-failed?id=${order.id}`);
  const cod = order.paymentMethod === "COD";

  return (
    <div className="wrap max-w-2xl py-16 text-center">
      <CheckCircle2 size={56} className="mx-auto text-emerald-600" />
      <h1 className="h-display mt-5 text-4xl sm:text-5xl">Thank you, {order.customerName.split(" ")[0]}</h1>
      <p className="mt-3 text-muted">
        {order.needsAttention
          ? "We've received your payment but one item sold out at the same moment. We'll contact you shortly to sort it out."
          : `Your order ${order.orderNumber} is confirmed. A confirmation has been emailed to ${order.customerEmail}.`}
      </p>

      <div className="card mt-10 p-6 text-left">
        <div className="flex justify-between border-b border-line pb-4 text-sm">
          <span className="text-muted">Order number</span><strong>{order.orderNumber}</strong>
        </div>
        <ul className="divide-y divide-line">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between gap-4 py-3 text-sm">
              <span>{i.name} <span className="text-muted">· {i.variantName} × {i.quantity}</span></span>
              <span className="font-medium">{formatINR(i.price * i.quantity)}</span>
            </li>
          ))}
        </ul>
        {order.giftBox && <p className="border-t border-line py-3 text-sm text-muted">Gift box included{order.giftNote ? <> · note: <em>“{order.giftNote}”</em></> : null}</p>}
        <div className="flex justify-between border-t border-line pt-4 text-lg font-semibold">
          <span>{cod ? "To pay on delivery" : "Paid"}</span><span>{formatINR(order.total)}</span>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href={`/account/orders/${order.id}`} className="btn btn-dark">View order</Link>
        <Link href="/shop" className="btn btn-line">Continue shopping</Link>
      </div>
    </div>
  );
}
