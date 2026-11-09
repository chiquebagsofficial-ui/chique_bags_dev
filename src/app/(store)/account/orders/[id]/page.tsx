import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CancelOrderButton } from "@/components/store/AccountForms";
import StatusBadge, { OrderProgress } from "@/components/store/StatusBadge";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate, formatINR } from "@/lib/utils";

export const metadata: Metadata = { title: "Order details", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = (await getSessionUser())!;
  const order = await prisma.order.findFirst({ where: { id, userId: user.id }, include: { items: { include: { product: { select: { slug: true } } } } } });
  if (!order) notFound();
  const a = order.shippingAddress as Record<string, string>;
  const canCancel = ["PENDING", "CONFIRMED", "PROCESSING"].includes(order.status);
  const paid = order.paymentStatus === "PAID";

  return (
    <div className="max-w-4xl">
      <Link href="/account/orders" className="text-sm font-medium text-muted hover:text-rose">← All orders</Link>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-semibold">{order.orderNumber}</h2>
          <p className="text-sm text-muted">Placed on {formatDate(order.createdAt, true)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {order.status !== "CANCELLED" && order.status !== "PENDING" && <div className="card mt-6 p-6"><OrderProgress status={order.status} /></div>}
      {order.status === "SHIPPED" && (order.trackingUrl || order.courier) && (
        <div className="card mt-4 flex flex-wrap items-center justify-between gap-3 p-5 text-sm">
          <span>{order.courier ? <>Shipped with <strong>{order.courier}</strong></> : "Your order is on its way"}</span>
          {order.trackingUrl && <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="btn btn-dark btn-sm">Track shipment</a>}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section className="card p-6">
          <ul className="divide-y divide-line">
            {order.items.map((i) => (
              <li key={i.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                <span className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-cream">{i.image && <Image src={i.image} alt="" fill sizes="80px" className="object-cover" />}</span>
                <div className="flex-1 text-sm">
                  {i.product ? <Link href={`/products/${i.product.slug}`} className="font-medium hover:text-rose">{i.name}</Link> : <span className="font-medium">{i.name}</span>}
                  <p className="text-muted">{i.variantName} × {i.quantity}</p>
                </div>
                <div className="text-right text-sm font-semibold">{formatINR(i.price * i.quantity)}{i.mrp > i.price && <p className="text-xs font-normal text-muted line-through">{formatINR(i.mrp * i.quantity)}</p>}</div>
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-6">
          <section className="card space-y-2.5 p-6 text-sm">
            <h3 className="mb-1 font-serif text-lg font-semibold">Payment</h3>
            <div className="flex justify-between"><span className="text-muted">Subtotal</span><span>{formatINR(order.subtotal)}</span></div>
            {order.discount > 0 && <div className="flex justify-between"><span className="text-muted">Coupon {order.couponCode}</span><span className="text-berry">−{formatINR(order.discount)}</span></div>}
            <div className="flex justify-between"><span className="text-muted">Shipping</span><span>{order.shipping ? formatINR(order.shipping) : "Free"}</span></div>
            <div className="flex justify-between border-t border-line pt-3 text-base font-semibold"><span>Total</span><span>{formatINR(order.total)}</span></div>
            <p className="pt-1 text-xs text-muted">{order.paymentMethod === "COD" ? (paid ? "Cash on delivery · paid" : "Cash on delivery · pay on arrival") : paid ? "Paid online" : order.paymentStatus === "REFUNDED" ? "Refunded" : "Awaiting payment"}</p>
          </section>
          <section className="card p-6 text-sm">
            <h3 className="mb-2 font-serif text-lg font-semibold">Delivering to</h3>
            <p className="leading-relaxed text-muted">{a.name}<br />{a.line1}{a.line2 && `, ${a.line2}`}<br />{a.city}, {a.state} {a.pincode}<br />{a.phone}</p>
          </section>
          <div className="flex flex-wrap items-start gap-3">
            {paid || order.paymentMethod === "COD" ? <Link href={`/account/orders/${order.id}/invoice`} target="_blank" className="btn btn-line btn-sm">Invoice</Link> : null}
            {canCancel && <CancelOrderButton orderId={order.id} />}
          </div>
        </div>
      </div>
    </div>
  );
}
