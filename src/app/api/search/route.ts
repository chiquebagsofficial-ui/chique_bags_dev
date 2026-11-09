import { prisma } from "@/lib/db";
import { ok } from "@/lib/api";

export const dynamic = "force-dynamic";

// Quick suggestions for the search overlay.
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim().slice(0, 60) ?? "";
  if (q.length < 2) return ok({ results: [] });
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { tags: { has: q.toLowerCase() } },
        { category: { name: { contains: q, mode: "insensitive" } } },
      ],
    },
    select: { slug: true, name: true, price: true, images: true },
    take: 6,
    orderBy: { isBestSeller: "desc" },
  });
  return ok({ results: products.map((p) => ({ slug: p.slug, name: p.name, price: p.price, image: p.images[0] ?? null })) });
}
