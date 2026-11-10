import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReturnActions from "@/components/admin/ReturnActions";
import ReturnTimeline, { ReturnStatusBadge } from "@/components/store/ReturnTimeline";
import { prisma } from "@/lib/db";
import { REASON_LABEL, suggestedRefund, type ReturnItemSnapshot } from "@/lib/returns";
import { formatDate, formatINR } from "@/lib/utils";

export const metadata = { title: "Return request" };
export const dynamic = "force-dynamic";

export default async function AdminReturnDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await prisma.returnRequest.findUnique({ where: { id }, include: { order: true, events: { orderBy: { createdAt: "asc" } } } });
  if (!r) notFound();
  const items = r.items as unknown as ReturnItemSnapshot[];
  const remaining = r.order.total - r.order.refundedAmount;

  return (
    <>
      <Link href="/admin/returns" className="text-sm font-medium text-muted hover:text-berry">← Returns &amp; refunds</Link>
      <div className="mb-8 mt-3 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold">{r.number}</h1>
          <p className="text-sm text-muted">Opened {formatDate(r.createdAt, true)}{r.createdByAdmin ? " · recorded by the store" : ""}</p>
        </div>
        <ReturnStatusBadge status={r.status} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <section className="card space-y-4 p-6 text-sm">
            <h2 className="font-serif text-lg font-semibold">The problem</h2>
            <p><strong>{REASON_LABEL[r.reason]}</strong></p>
            <p className="whitespace-pre-wrap leading-relaxed text-muted">{r.details}</p>
            {r.photos.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {r.photos.map((src) => (
                  <a key={src} href={src} target="_blank" rel="noopener noreferrer" className="relative block h-28 w-28 bg-cream"><Image src={src} alt="Photo from the customer" fill sizes="112px" className="object-cover" /></a>
                ))}
              </div>
            ) : <p className="text-xs text-muted">No photos attached.</p>}
          </section>

          <section className="card p-6">
            <h2 className="mb-3 font-serif text-lg font-semibold">Items</h2>
            <ul className="divide-y divide-line text-sm">
              {items.map((i) => (
                <li key={i.orderItemId} className="flex justify-between gap-4 py-2.5"><span>{i.name} <span className="text-muted">· {i.variantName} × {i.quantity}</span></span><span className="font-medium">{formatINR(i.price * i.quantity)}</span></li>
              ))}
            </ul>
            <p className="mt-3 flex justify-between border-t border-line pt-3 text-sm font-semibold"><span>Suggested refund</span><span>{formatINR(suggestedRefund(items))}</span></p>
          </section>

          <ReturnActions id={r.id} status={r.status} suggested={suggestedRefund(items)} remaining={remaining} />
        </div>

        <div className="space-y-6">
          <section className="card space-y-1 p-6 text-sm">
            <h2 className="mb-2 font-serif text-lg font-semibold">Order</h2>
            <p><Link href={`/admin/orders/${r.order.id}`} className="font-semibold underline">{r.order.orderNumber}</Link></p>
            <p>{r.order.customerName}</p>
            <p className="text-muted">{r.order.customerEmail} · {r.order.customerPhone}</p>
            <p className="pt-2">Order total <strong>{formatINR(r.order.total)}</strong></p>
            <p>Already refunded <strong>{formatINR(r.order.refundedAmount)}</strong></p>
            {r.order.razorpayPaymentId && <p className="break-all text-xs text-muted">Payment ID: {r.order.razorpayPaymentId}</p>}
            {r.refundReference && <p className="break-all text-xs text-muted">Refund reference: {r.refundReference}</p>}
          </section>
          <section className="card p-6">
            <h2 className="mb-4 font-serif text-lg font-semibold">History</h2>
            <ReturnTimeline events={r.events} showActor />
          </section>
        </div>
      </div>
    </>
  );
}
