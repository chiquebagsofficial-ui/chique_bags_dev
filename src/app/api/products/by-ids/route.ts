import { prisma } from "@/lib/db";
import { ok } from "@/lib/api";
import { cardInclude, toCard } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ids = (new URL(req.url).searchParams.get("ids") ?? "").split(",").filter(Boolean).slice(0, 60);
  if (ids.length === 0) return ok({ products: [] });
  const rows = await prisma.product.findMany({ where: { id: { in: ids }, isActive: true }, include: cardInclude });
  return ok({ products: rows.map(toCard) });
}
