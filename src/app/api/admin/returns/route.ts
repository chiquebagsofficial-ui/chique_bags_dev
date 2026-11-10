import { prisma } from "@/lib/db";
import { adminGuard, fail, ok, parseBody } from "@/lib/api";
import { getAdminUser } from "@/lib/auth";
import { createReturn } from "@/lib/returns";
import { returnBody } from "@/lib/return-schema";

export const dynamic = "force-dynamic";

// The store records a return or refund on a customer's behalf (for example after a WhatsApp message).
export async function POST(req: Request) {
  const denied = await adminGuard();
  if (denied) return denied;
  const admin = await getAdminUser();
  const parsed = await parseBody(req, returnBody);
  if ("error" in parsed) return parsed.error;
  const d = parsed.data;

  const order = await prisma.order.findUnique({ where: { id: d.orderId }, include: { items: true } });
  if (!order) return fail("Order not found.", 404);
  if (order.paymentStatus === "UNPAID" || order.paymentStatus === "FAILED") return fail("This order was never paid.", 400);

  const res = await createReturn({ order, userId: order.userId, reason: d.reason, details: d.details, photos: d.photos, items: d.items, byAdmin: { name: admin?.name ?? "Store" } });
  if (!res.ok) return fail(res.error, res.status);
  return ok({ id: res.data.id, number: res.data.number }, 201);
}
