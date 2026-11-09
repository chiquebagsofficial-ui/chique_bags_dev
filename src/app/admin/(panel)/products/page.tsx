import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import ProductRowActions from "@/components/admin/ProductRowActions";
import { PageHead, Pager, Table, Td } from "@/components/admin/ui";
import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/utils";

export const metadata = { title: "Products" };
export const dynamic = "force-dynamic";
const PAGE = 20;

export default async function AdminProducts({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const { q = "", page: p } = await searchParams;
  const page = Math.max(1, Number(p) || 1);
  const where = q ? { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { category: { name: { contains: q, mode: "insensitive" as const } } }] } : {};
  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({ where, include: { category: true, variants: true }, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE }),
  ]);

  return (
    <>
      <PageHead title="Products" subtitle={`${total} product${total === 1 ? "" : "s"}`} action={<Link href="/admin/products/new" className="btn btn-dark btn-sm"><Plus size={15} /> Add product</Link>} />
      <form className="mb-5 max-w-sm"><input name="q" defaultValue={q} placeholder="Search products or categories" className="input" aria-label="Search products" /></form>
      <Table head={["Product", "Category", "Price", "Stock", "Status", ""]} empty={products.length === 0 ? "No products found." : undefined}>
        {products.map((pr) => {
          const stock = pr.variants.reduce((n, v) => n + v.stock, 0);
          return (
            <tr key={pr.id} className="hover:bg-cream">
              <Td>
                <div className="flex items-center gap-3">
                  <span className="relative h-14 w-11 shrink-0 overflow-hidden rounded-sm bg-cream">{pr.images[0] && <Image src={pr.images[0]} alt="" fill sizes="44px" className="object-cover" />}</span>
                  <Link href={`/admin/products/${pr.id}`} className="font-medium hover:text-rose">{pr.name}</Link>
                </div>
              </Td>
              <Td className="text-muted">{pr.category.name}</Td>
              <Td>{formatINR(pr.price)}{pr.originalPrice && <span className="ml-1.5 text-xs text-muted line-through">{formatINR(pr.originalPrice)}</span>}</Td>
              <Td><span className={stock === 0 ? "font-semibold text-berry" : stock <= 5 ? "font-semibold text-amber-700" : ""}>{stock}</span></Td>
              <Td><span className={`rounded-none px-3 py-1 text-xs font-semibold ${pr.isActive ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-700"}`}>{pr.isActive ? "Live" : "Hidden"}</span></Td>
              <Td><ProductRowActions id={pr.id} isActive={pr.isActive} /></Td>
            </tr>
          );
        })}
      </Table>
      <Pager page={page} pages={Math.ceil(total / PAGE)} base={`/admin/products${q ? `?q=${encodeURIComponent(q)}` : ""}`} />
    </>
  );
}
