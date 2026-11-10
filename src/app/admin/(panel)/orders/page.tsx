import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { PageHead, Pager, Table, Td } from "@/components/admin/ui";
import StatusBadge from "@/components/store/StatusBadge";
import { prisma } from "@/lib/db";
import { formatDate, formatINR, ORDER_STATUS_LABEL } from "@/lib/utils";

export const metadata = { title: "Orders" };
export const dynamic = "force-dynamic";
const PAGE = 20;

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
  const { q = "", status = "", page: p } = await searchParams;
  const page = Math.max(1, Number(p) || 1);
  const where: Prisma.OrderWhereInput = {
    // Online orders that were never paid are abandoned checkouts: keep them out unless asked for.
    ...(status ? { status: status as never } : { NOT: { status: "PENDING", paymentMethod: "ONLINE" } }),
    ...(q && { OR: [{ orderNumber: { contains: q, mode: "insensitive" } }, { customerName: { contains: q, mode: "insensitive" } }, { customerEmail: { contains: q, mode: "insensitive" } }, { customerPhone: { contains: q } }] }),
  };
  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({ where, orderBy: { createdAt: "desc" }, include: { items: { select: { quantity: true } } }, skip: (page - 1) * PAGE, take: PAGE }),
  ]);
  const base = `/admin/orders?${new URLSearchParams({ ...(q && { q }), ...(status && { status }) }).toString()}`;

  return (
    <>
      <PageHead title="Orders" subtitle={`${total} order${total === 1 ? "" : "s"}`} />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <form className="min-w-[240px] max-w-sm flex-1"><input name="q" defaultValue={q} placeholder="Search number, name, email, phone" className="input" aria-label="Search orders" />{status && <input type="hidden" name="status" value={status} />}</form>
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          <Link href={q ? `/admin/orders?q=${encodeURIComponent(q)}` : "/admin/orders"} className="chip" data-active={!status}>All</Link>
          {Object.entries(ORDER_STATUS_LABEL).map(([k, label]) => (
            <Link key={k} href={`/admin/orders?status=${k}${q ? `&q=${encodeURIComponent(q)}` : ""}`} className="chip" data-active={status === k}>{label}</Link>
          ))}
        </div>
      </div>
      <Table head={["Order", "Customer", "Date", "Items", "Payment", "Status", "Total"]} empty={orders.length === 0 ? "No orders found." : undefined}>
        {orders.map((o) => (
          <tr key={o.id} className="hover:bg-cream">
            <Td><Link href={`/admin/orders/${o.id}`} className="font-semibold hover:text-rose">{o.orderNumber}</Link>{o.needsAttention && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[0.65rem] font-bold text-amber-800">ATTENTION</span>}</Td>
            <Td>{o.customerName}<br /><span className="text-xs text-muted">{o.customerEmail}</span></Td>
            <Td className="text-muted">{formatDate(o.createdAt)}</Td>
            <Td>{o.items.reduce((n, i) => n + i.quantity, 0)}</Td>
            <Td className="text-xs">{o.paymentStatus.toLowerCase().replace("_", " ")}</Td>
            <Td><StatusBadge status={o.status} /></Td>
            <Td className="font-semibold">{formatINR(o.total)}</Td>
          </tr>
        ))}
      </Table>
      <Pager page={page} pages={Math.ceil(total / PAGE)} base={base.endsWith("?") ? "/admin/orders" : base} />
    </>
  );
}
