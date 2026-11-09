import Link from "next/link";
import type { Metadata } from "next";
import StatusBadge from "@/components/store/StatusBadge";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate, formatINR } from "@/lib/utils";

export const metadata: Metadata = { title: "My orders", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const user = (await getSessionUser())!;
  const orders = await prisma.order.findMany({
    where: { userId: user.id, NOT: { status: "PENDING", paymentMethod: "ONLINE", paymentStatus: { not: "PAID" }, createdAt: { lt: new Date(Date.now() - 60 * 60_000) } } },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  if (orders.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="font-serif text-2xl">No orders yet</p>
        <p className="mt-1 text-muted">When you place an order, it'll show up here.</p>
        <Link href="/shop" className="btn btn-dark mt-6">Start shopping</Link>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {orders.map((o) => (
        <li key={o.id}>
          <Link href={`/account/orders/${o.id}`} className="card flex flex-wrap items-center justify-between gap-4 p-5 transition hover:border-rose-soft hover:shadow-md">
            <div>
              <p className="font-semibold">{o.orderNumber}</p>
              <p className="text-sm text-muted">{formatDate(o.createdAt)} · {o.items.reduce((n, i) => n + i.quantity, 0)} items</p>
            </div>
            <div className="flex items-center gap-5">
              <StatusBadge status={o.status} />
              <span className="font-semibold">{formatINR(o.total)}</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
