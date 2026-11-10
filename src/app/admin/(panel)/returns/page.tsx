import Link from "next/link";
import type { Prisma, ReturnStatus } from "@prisma/client";
import { PageHead, Pager, Table, Td } from "@/components/admin/ui";
import { ReturnStatusBadge } from "@/components/store/ReturnTimeline";
import { prisma } from "@/lib/db";
import { REASON_LABEL, STATUS_LABEL } from "@/lib/returns";
import { formatDate, formatINR } from "@/lib/utils";

export const metadata = { title: "Returns & refunds" };
export const dynamic = "force-dynamic";
const PAGE = 20;

export default async function AdminReturns({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
  const { q = "", status = "", page: p } = await searchParams;
  const page = Math.max(1, Number(p) || 1);
  const where: Prisma.ReturnRequestWhereInput = {
    ...(status && { status: status as ReturnStatus }),
    ...(q && { OR: [{ number: { contains: q, mode: "insensitive" } }, { order: { orderNumber: { contains: q, mode: "insensitive" } } }, { order: { customerName: { contains: q, mode: "insensitive" } } }] }),
  };
  const [total, rows, refundedAgg] = await Promise.all([
    prisma.returnRequest.count({ where }),
    prisma.returnRequest.findMany({ where, include: { order: { select: { orderNumber: true, customerName: true, id: true } } }, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE }),
    prisma.order.aggregate({ _sum: { refundedAmount: true } }),
  ]);
  const base = `/admin/returns?${new URLSearchParams({ ...(q && { q }), ...(status && { status }) }).toString()}`;

  return (
    <>
      <PageHead title="Returns & refunds" subtitle={`${total} request${total === 1 ? "" : "s"} · ${formatINR(refundedAgg._sum.refundedAmount ?? 0)} refunded in total`} />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <form className="min-w-[240px] max-w-sm flex-1"><input name="q" defaultValue={q} placeholder="Search request, order or customer" className="input" aria-label="Search returns" />{status && <input type="hidden" name="status" value={status} />}</form>
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          <Link href="/admin/returns" className="chip" data-active={!status}>All</Link>
          {(Object.keys(STATUS_LABEL) as ReturnStatus[]).map((k) => (
            <Link key={k} href={`/admin/returns?status=${k}${q ? `&q=${encodeURIComponent(q)}` : ""}`} className="chip" data-active={status === k}>{STATUS_LABEL[k]}</Link>
          ))}
        </div>
      </div>
      <Table head={["Request", "Order", "Customer", "Reason", "Date", "Status", "Refunded"]} empty={rows.length === 0 ? "No return requests." : undefined}>
        {rows.map((r) => (
          <tr key={r.id} className="hover:bg-cream">
            <Td><Link href={`/admin/returns/${r.id}`} className="font-semibold hover:text-berry">{r.number}</Link></Td>
            <Td><Link href={`/admin/orders/${r.order.id}`} className="hover:text-berry">{r.order.orderNumber}</Link></Td>
            <Td>{r.order.customerName}</Td>
            <Td className="text-muted">{REASON_LABEL[r.reason]}</Td>
            <Td className="text-muted">{formatDate(r.createdAt)}</Td>
            <Td><ReturnStatusBadge status={r.status} /></Td>
            <Td className="font-semibold">{r.refundAmount ? formatINR(r.refundAmount) : "–"}</Td>
          </tr>
        ))}
      </Table>
      <Pager page={page} pages={Math.ceil(total / PAGE)} base={base.endsWith("?") ? "/admin/returns" : base} />
    </>
  );
}
