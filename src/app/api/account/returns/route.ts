import { prisma } from "@/lib/db";
import { fail, limit, ok, parseBody } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { canRequestReturn, createReturn } from "@/lib/returns";
import { returnBody } from "@/lib/return-schema";

export const dynamic = "force-dynamic";

// A customer reports a problem with a delivered order.
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return fail("Please log in.", 401);
  const limited = await limit(req, "return", 6, 60 * 60_000, user.id);
  if (limited) return limited;

  const parsed = await parseBody(req, returnBody);
  if ("error" in parsed) return parsed.error;
  const d = parsed.data;

  const order = await prisma.order.findFirst({ where: { id: d.orderId, userId: user.id }, include: { items: true } });
  if (!order) return fail("Order not found.", 404);
  if (!canRequestReturn(order)) return fail("This order is no longer eligible. Returns can be reported within 7 days of delivery.", 400);
  if ((d.reason === "DAMAGED" || d.reason === "DEFECTIVE") && d.photos.length === 0) {
    return fail("Please add at least one clear photo of the problem.", 400);
  }
  // Photos must come from our own Cloudinary account.
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (cloud && d.photos.some((p) => !p.startsWith(`https://res.cloudinary.com/${cloud}/`))) return fail("Invalid photo.", 400);

  const res = await createReturn({ order, userId: user.id, reason: d.reason, details: d.details, photos: d.photos, items: d.items });
  if (!res.ok) return fail(res.error, res.status);
  return ok({ id: res.data.id, number: res.data.number }, 201);
}
