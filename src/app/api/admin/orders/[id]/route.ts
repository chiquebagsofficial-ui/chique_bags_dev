import { z } from "zod";
import { prisma } from "@/lib/db";
import { adminGuard, fail, ok, parseBody } from "@/lib/api";
import { cancelOrder } from "@/lib/checkout";
import { sendOrderDelivered, sendOrderShipped } from "@/lib/emails";

export const dynamic = "force-dynamic";

const schema = z.object({
  status: z.enum(["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]).optional(),
  courier: z.string().trim().max(60).nullish(),
  trackingUrl: z.string().trim().url("Enter a valid tracking link").max(300).nullish().or(z.literal("")),
  resolved: z.boolean().optional(), // clear the "needs attention" flag
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await adminGuard();
  if (denied) return denied;
  const { id } = await params;
  const parsed = await parseBody(req, schema);
  if ("error" in parsed) return parsed.error;
  const { status, courier, trackingUrl, resolved } = parsed.data;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return fail("Order not found.", 404);

  if (status === "CANCELLED") {
    const res = await cancelOrder(id, { by: "admin", reason: "Cancelled by store" });
    return res.ok ? ok() : fail(res.error, 400);
  }
  if (order.status === "CANCELLED") return fail("A cancelled order can't be changed.", 400);
  if (order.status === "PENDING" && status && order.paymentMethod === "ONLINE") {
    return fail("This order is still waiting for payment.", 400);
  }

  const data: Record<string, unknown> = {};
  if (courier !== undefined) data.courier = courier || null;
  if (trackingUrl !== undefined) data.trackingUrl = trackingUrl || null;
  if (resolved) data.needsAttention = false;
  if (status) {
    data.status = status;
    if (status === "SHIPPED" && !order.shippedAt) data.shippedAt = new Date();
    if (status === "DELIVERED") {
      data.deliveredAt = new Date();
      if (order.paymentMethod === "COD") data.paymentStatus = "PAID"; // cash collected on delivery
      if (order.paymentMethod === "COD" && !order.paidAt) data.paidAt = new Date();
    }
  }
  const updated = await prisma.order.update({ where: { id }, data, include: { items: true } });

  // Emails go out only when the status actually changes.
  if (status && status !== order.status) {
    if (status === "SHIPPED") void sendOrderShipped(updated);
    if (status === "DELIVERED") void sendOrderDelivered(updated);
  } else if (status === "SHIPPED" && (courier !== undefined || trackingUrl !== undefined) && order.status === "SHIPPED") {
    // tracking details were added after shipping: tell the customer
    if (trackingUrl) void sendOrderShipped(updated);
  }
  return ok();
}
