import Link from "next/link";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import ProductCard from "@/components/store/ProductCard";
import { cardInclude, getNavCategories, SORTS, toCard, type SortKey } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/utils";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 12;

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export async function generateMetadata({ searchParams }: { searchParams: Promise<SP> }): Promise<Metadata> {
  const sp = await searchParams;
  const cat = one(sp.category);
  const category = cat ? await prisma.category.findUnique({ where: { slug: cat } }) : null;
  return {
    title: category ? category.name : one(sp.q) ? `Search: ${one(sp.q)}` : "Shop all bags",
    description: category?.description ?? "Browse handcrafted sling and crossbody bags in vegan leather.",
    alternates: { canonical: category ? `/shop?category=${category.slug}` : "/shop" },
  };
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const categorySlug = one(sp.category);
  const q = one(sp.q)?.trim().slice(0, 60) || "";
  const sort = (one(sp.sort) && one(sp.sort)! in SORTS ? one(sp.sort) : "newest") as SortKey;
  const min = Number(one(sp.min)) || 0;
  const max = Number(one(sp.max)) || 0;
  const inStock = one(sp.stock) === "1";
  const page = Math.max(1, Number(one(sp.page)) || 1);

  const categories = await getNavCategories();
  const activeCategory = categories.find((c) => c.slug === categorySlug);

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(activeCategory && { categoryId: activeCategory.id }),
    ...((min || max) && { price: { ...(min && { gte: min }), ...(max && { lte: max }) } }),
    ...(inStock && { variants: { some: { stock: { gt: 0 } } } }),
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { tags: { has: q.toLowerCase() } },
        { shortDescription: { contains: q, mode: "insensitive" } },
        { category: { name: { contains: q, mode: "insensitive" } } },
      ],
    }),
  };

  const [total, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({ where, include: cardInclude, orderBy: SORTS[sort].orderBy, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
  ]);
  const products = rows.map(toCard);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const href = (patch: Record<string, string | number | null>) => {
    const params = new URLSearchParams();
    const base: Record<string, string | number | null> = { category: categorySlug ?? null, q: q || null, sort: sort === "newest" ? null : sort, min: min || null, max: max || null, stock: inStock ? 1 : null, page: null };
    for (const [k, v] of Object.entries({ ...base, ...patch })) if (v !== null && v !== "" && v !== undefined) params.set(k, String(v));
    const s = params.toString();
    return s ? `/shop?${s}` : "/shop";
  };

  const priceChips: { label: string; min: number | null; max: number | null }[] = [
    { label: `Under ${formatINR(999)}`, min: null, max: 999 },
    { label: `${formatINR(1000)} – ${formatINR(1499)}`, min: 1000, max: 1499 },
    { label: `${formatINR(1500)} & above`, min: 1500, max: null },
  ];

  return (
    <div className="wrap py-10 lg:py-14">
      <nav aria-label="Breadcrumb" className="mb-6 text-xs text-muted">
        <Link href="/" className="hover:text-rose">Home</Link> / <span className="text-ink">{activeCategory?.name ?? "Shop"}</span>
      </nav>
      <header className="mb-8">
        <h1 className="h-display text-4xl sm:text-5xl">{q ? `Results for “${q}”` : (activeCategory?.name ?? "All bags")}</h1>
        {activeCategory?.description && <p className="mt-3 max-w-xl text-muted">{activeCategory.description}</p>}
      </header>

      <div className="mb-8 space-y-4 border-y border-line py-5">
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          <Link href={href({ category: null })} className="chip" data-active={!activeCategory}>All</Link>
          {categories.map((c) => (
            <Link key={c.id} href={href({ category: c.slug })} className="chip" data-active={activeCategory?.id === c.id}>{c.name}</Link>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {priceChips.map((c) => {
              const on = (c.min ?? 0) === min && (c.max ?? 0) === max;
              return <Link key={c.label} href={href(on ? { min: null, max: null } : { min: c.min, max: c.max })} className="chip" data-active={on}>{c.label}</Link>;
            })}
            <Link href={href({ stock: inStock ? null : 1 })} className="chip" data-active={inStock}>In stock only</Link>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted">{total} {total === 1 ? "bag" : "bags"}</span>
            <details className="relative">
              <summary className="chip cursor-pointer list-none">Sort: {SORTS[sort].label}</summary>
              <div className="absolute right-0 z-20 mt-2 w-52 rounded-2xl border border-line bg-white p-2 shadow-xl">
                {(Object.keys(SORTS) as SortKey[]).map((k) => (
                  <Link key={k} href={href({ sort: k === "newest" ? null : k })} className={`block rounded-xl px-4 py-2.5 text-sm hover:bg-blush ${k === sort ? "font-semibold text-rose" : ""}`}>{SORTS[k].label}</Link>
                ))}
              </div>
            </details>
          </div>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="py-24 text-center">
          <p className="font-serif text-2xl">No bags match these filters</p>
          <p className="mt-2 text-muted">Try removing a filter or searching for something else.</p>
          <Link href="/shop" className="btn btn-dark mt-6">Clear filters</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
          {products.map((p, i) => <ProductCard key={p.id} product={p} priority={i < 4} />)}
        </div>
      )}

      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-14 flex justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <Link key={n} href={href({ page: n })} className="chip" data-active={n === page} aria-current={n === page ? "page" : undefined}>{n}</Link>
          ))}
        </nav>
      )}
    </div>
  );
}
