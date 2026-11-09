import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Kpi, PageHead, Table, Td } from "@/components/admin/ui";
import SalesChart from "@/components/admin/SalesChart";
import StatusBadge from "@/components/store/StatusBadge";
import { prisma } from "@/lib/db";
import { formatDate, formatINR } from "@/lib/utils";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

const SOLD = ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] as const;

export default async function DashboardPage() {
  const now = new Date();
  const dayKey = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const since = new Date(now.getTime() - 7 * 86400_000);

  const [revenue, orderCount, customers, products, recentWeek, recent, attention, toShip, lowStock] = await Promise.all([
    prisma.order.aggregate({ where: { status: { in: [...SOLD] } }, _sum: { total: true } }),
    prisma.order.count({ where: { status: { in: [...SOLD] } } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.order.findMany({ where: { status: { in: [...SOLD] }, createdAt: { gte: since } }, select: { total: true, createdAt: true } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { items: true }, where: { NOT: { status: "PENDING" } } }),
    prisma.order.findMany({ where: { needsAttention: true }, select: { id: true, orderNumber: true, notes: true } }),
    prisma.order.count({ where: { status: { in: ["CONFIRMED", "PROCESSING"] } } }),
    prisma.productVariant.findMany({ where: { stock: { lte: 3 }, product: { isActive: true } }, include: { product: { select: { id: true, name: true } } }, orderBy: { stock: "asc" }, take: 6 }),
  ]);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getTime() - (6 - i) * 86400_000);
    return { key: dayKey(d), day: d.toLocaleDateString("en-IN", { weekday: "short", timeZone: "Asia/Kolkata" }), sales: 0, orders: 0 };
  });
  for (const o of recentWeek) {
    const slot = days.find((d) => d.key === dayKey(o.createdAt));
    if (slot) {
      slot.sales += o.total;
      slot.orders += 1;
    }
  }
  const today = days[6];

  return (
    <>
      <PageHead title="Dashboard" subtitle="How the store is doing" />

      {attention.length > 0 && (
        <div className="mb-6 rounded-sm border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">
          <p className="flex items-center gap-2 font-semibold"><AlertTriangle size={18} /> {attention.length} order{attention.length > 1 ? "s need" : " needs"} your attention</p>
          <ul className="mt-2 space-y-1">
            {attention.map((o) => <li key={o.id}><Link href={`/admin/orders/${o.id}`} className="font-medium underline">{o.orderNumber}</Link>: {o.notes}</li>)}
          </ul>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Total revenue" value={formatINR(revenue._sum.total ?? 0)} hint="Confirmed orders, all time" />
        <Kpi label="Orders" value={String(orderCount)} hint={`${toShip} waiting to be shipped`} />
        <Kpi label="Customers" value={String(customers)} />
        <Kpi label="Live products" value={String(products)} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section className="card p-6">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="font-serif text-xl font-semibold">Last 7 days</h2>
            <p className="text-sm text-muted">Today: <strong className="text-ink">{formatINR(today.sales)}</strong> · {today.orders} orders</p>
          </div>
          <SalesChart data={days.map(({ day, sales, orders }) => ({ day, sales, orders }))} />
        </section>

        <section className="card p-6">
          <h2 className="font-serif text-xl font-semibold">Running low</h2>
          {lowStock.length === 0 ? (
            <p className="mt-4 text-sm text-muted">All colours are well stocked.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line text-sm">
              {lowStock.map((v) => (
                <li key={v.id} className="flex items-center justify-between py-3">
                  <Link href={`/admin/products/${v.product.id}`} className="hover:text-rose">{v.product.name} <span className="text-muted">· {v.name}</span></Link>
                  <span className={`font-semibold ${v.stock === 0 ? "text-berry" : "text-amber-700"}`}>{v.stock === 0 ? "Sold out" : `${v.stock} left`}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-6">
        <div className="mb-3 flex items-end justify-between"><h2 className="font-serif text-xl font-semibold">Latest orders</h2><Link href="/admin/orders" className="text-sm font-semibold underline underline-offset-4">View all</Link></div>
        <Table head={["Order", "Customer", "Date", "Status", "Total"]} empty={recent.length === 0 ? "No orders yet." : undefined}>
          {recent.map((o) => (
            <tr key={o.id} className="hover:bg-cream">
              <Td><Link href={`/admin/orders/${o.id}`} className="font-semibold hover:text-rose">{o.orderNumber}</Link></Td>
              <Td>{o.customerName}</Td>
              <Td className="text-muted">{formatDate(o.createdAt)}</Td>
              <Td><StatusBadge status={o.status} /></Td>
              <Td className="font-semibold">{formatINR(o.total)}</Td>
            </tr>
          ))}
        </Table>
      </section>
    </>
  );
}
