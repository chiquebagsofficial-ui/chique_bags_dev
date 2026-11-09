import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import OrderControls from "@/components/admin/OrderControls";
import StatusBadge from "@/components/store/StatusBadge";
import { prisma } from "@/lib/db";
import { formatDate, formatINR } from "@/lib/utils";

export const metadata = { title: "Order" };
export const dynamic = "force-dynamic";

export default async function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true, user: { select: { id: true } } } });
  if (!order) notFound();
  const a = order.shippingAddress as Record<string, string>;

  return (
    <>
      <Link href="/admin/orders" className="text-sm font-medium text-muted hover:text-rose">← Orders</Link>
      <div className="mb-8 mt-3 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold">{order.orderNumber}</h1>
          <p className="text-sm text-muted">{formatDate(order.createdAt, true)}</p>
        </div>
        <div className="flex items-center gap-3"><StatusBadge status={order.status} /><Link href={`/admin/orders/${order.id}/invoice`} target="_blank" className="btn btn-line btn-sm">Invoice</Link></div>
      </div>

      {order.needsAttention && order.notes && <p className="mb-6 flex items-start gap-2 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"><AlertTriangle size={18} className="mt-0.5 shrink-0" /> {order.notes}</p>}

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="mb-4 font-serif text-lg font-semibold">Items</h2>
            <ul className="divide-y divide-line">
              {order.items.map((i) => (
                <li key={i.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                  <span className="relative h-16 w-13 shrink-0 overflow-hidden rounded-lg bg-cream" style={{ width: 52 }}>{i.image && <Image src={i.image} alt="" fill sizes="52px" className="object-cover" />}</span>
                  <div className="flex-1 text-sm"><p className="font-medium">{i.name}</p><p className="text-muted">{i.variantName} × {i.quantity} · {formatINR(i.price)} each</p></div>
                  <span className="font-semibold">{formatINR(i.price * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatINR(order.subtotal)}</dd></div>
              {order.discount > 0 && <div className="flex justify-between"><dt className="text-muted">Coupon {order.couponCode}</dt><dd>−{formatINR(order.discount)}</dd></div>}
              <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd>{order.shipping ? formatINR(order.shipping) : "Free"}</dd></div>
              <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd>{formatINR(order.total)}</dd></div>
            </dl>
          </section>
          <OrderControls id={order.id} status={order.status} courier={order.courier} trackingUrl={order.trackingUrl} needsAttention={order.needsAttention} awaitingPayment={order.status === "PENDING" && order.paymentMethod === "ONLINE"} />
        </div>

        <div className="space-y-6">
          <section className="card space-y-1 p-6 text-sm">
            <h2 className="mb-2 font-serif text-lg font-semibold">Customer</h2>
            <p className="font-medium">{order.customerName}</p>
            <p className="text-muted">{order.customerEmail}</p>
            <p className="text-muted">{order.customerPhone}</p>
          </section>
          <section className="card p-6 text-sm">
            <h2 className="mb-2 font-serif text-lg font-semibold">Ship to</h2>
            <p className="leading-relaxed text-muted">{a.name}<br />{a.line1}{a.line2 && `, ${a.line2}`}<br />{a.city}, {a.state} {a.pincode}<br />{a.phone}</p>
          </section>
          <section className="card space-y-1 p-6 text-sm">
            <h2 className="mb-2 font-serif text-lg font-semibold">Payment</h2>
            <p>{order.paymentMethod === "COD" ? "Cash on delivery" : "Online (Razorpay)"}</p>
            <p className="text-muted">Status: {order.paymentStatus.toLowerCase()}{order.paidAt && ` · ${formatDate(order.paidAt, true)}`}</p>
            {order.razorpayPaymentId && <p className="break-all text-xs text-muted">Payment ID: {order.razorpayPaymentId}</p>}
          </section>
        </div>
      </div>
    </>
  );
}
