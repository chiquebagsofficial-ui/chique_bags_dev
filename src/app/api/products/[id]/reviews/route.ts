import { z } from "zod";
import { prisma } from "@/lib/db";
import { fail, ok, parseBody } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const schema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(80).optional(),
  comment: z.string().trim().max(1000).optional(),
});

// Only customers who received this product can review it, once.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return fail("Please log in to write a review.", 401);
  const { id } = await params;
  const parsed = await parseBody(req, schema);
  if ("error" in parsed) return parsed.error;

  const bought = await prisma.orderItem.findFirst({
    where: { productId: id, order: { userId: user.id, status: "DELIVERED" } },
    select: { id: true },
  });
  if (!bought) return fail("You can review a product once your order has been delivered.", 403);

  await prisma.review.upsert({
    where: { userId_productId: { userId: user.id, productId: id } },
    create: { userId: user.id, productId: id, ...parsed.data },
    update: parsed.data,
  });
  const agg = await prisma.review.aggregate({ where: { productId: id }, _avg: { rating: true }, _count: true });
  await prisma.product.update({
    where: { id },
    data: { rating: Math.round((agg._avg.rating ?? 0) * 10) / 10, reviewCount: agg._count },
  });
  return ok();
}
