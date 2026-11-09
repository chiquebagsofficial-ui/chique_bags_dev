import { PageHead, Pager, Table, Td } from "@/components/admin/ui";
import { prisma } from "@/lib/db";
import { formatDate, formatINR } from "@/lib/utils";

export const metadata = { title: "Customers" };
export const dynamic = "force-dynamic";
const PAGE = 25;
const SOLD = ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] as const;

export default async function AdminCustomers({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const { q = "", page: p } = await searchParams;
  const page = Math.max(1, Number(p) || 1);
  const where = {
    role: "CUSTOMER" as const,
    ...(q && { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { email: { contains: q, mode: "insensitive" as const } }, { phone: { contains: q } }] }),
  };
  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE, include: { orders: { where: { status: { in: [...SOLD] } }, select: { total: true } } } }),
  ]);

  return (
    <>
      <PageHead title="Customers" subtitle={`${total} customer${total === 1 ? "" : "s"}`} />
      <form className="mb-5 max-w-sm"><input name="q" defaultValue={q} placeholder="Search name, email or phone" className="input" aria-label="Search customers" /></form>
      <Table head={["Customer", "Phone", "Orders", "Total spent", "Joined"]} empty={users.length === 0 ? "No customers found." : undefined}>
        {users.map((u) => (
          <tr key={u.id} className="hover:bg-cream">
            <Td><p className="font-medium">{u.name}</p><p className="text-xs text-muted">{u.email}{!u.password && " · guest"}</p></Td>
            <Td className="text-muted">{u.phone ?? "—"}</Td>
            <Td>{u.orders.length}</Td>
            <Td className="font-semibold">{formatINR(u.orders.reduce((s, o) => s + o.total, 0))}</Td>
            <Td className="text-muted">{formatDate(u.createdAt)}</Td>
          </tr>
        ))}
      </Table>
      <Pager page={page} pages={Math.ceil(total / PAGE)} base={`/admin/customers${q ? `?q=${encodeURIComponent(q)}` : ""}`} />
    </>
  );
}
