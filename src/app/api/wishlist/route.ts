import { z } from "zod";
import { prisma } from "@/lib/db";
import { ok, parseBody } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Returns the signed-in customer's favourite product ids.
export async function GET() {
  const user = await getSessionUser();
  if (!user) return ok({ ids: [], loggedIn: false });
  const rows = await prisma.wishlistItem.findMany({ where: { userId: user.id }, select: { productId: true } });
  return ok({ ids: rows.map((r) => r.productId), loggedIn: true });
}

const toggleSchema = z.object({ productId: z.string().min(1), on: z.boolean() });
const mergeSchema = z.object({ merge: z.array(z.string()).max(100) });

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return ok({ ids: [], loggedIn: false }, 401);
  const body = await req.json().catch(() => null);

  // Merge favourites saved while logged out into the account.
  const merge = mergeSchema.safeParse(body);
  if (merge.success) {
    const valid = await prisma.product.findMany({ where: { id: { in: merge.data.merge }, isActive: true }, select: { id: true } });
    await prisma.wishlistItem.createMany({ data: valid.map((p) => ({ userId: user.id, productId: p.id })), skipDuplicates: true });
  } else {
    const parsed = toggleSchema.safeParse(body);
    if (!parsed.success) return ok({ error: "Invalid request" }, 400);
    const { productId, on } = parsed.data;
    if (on) {
      const exists = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
      if (exists) await prisma.wishlistItem.createMany({ data: [{ userId: user.id, productId }], skipDuplicates: true });
    } else {
      await prisma.wishlistItem.deleteMany({ where: { userId: user.id, productId } });
    }
  }
  const rows = await prisma.wishlistItem.findMany({ where: { userId: user.id }, select: { productId: true } });
  return ok({ ids: rows.map((r) => r.productId), loggedIn: true });
}
