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
  customerName: z.string().trim().min(2).max(80).optional(),
  customerPhone: z.string().trim().min(8).max(20).optional(),
  address: z
    .object({
      name: z.string().trim().min(2).max(80),
      phone: z.string().trim().min(8).max(20),
      line1: z.string().trim().min(3).max(160),
      line2: z.string().trim().max(160).optional().or(z.literal("")),
      city: z.string().trim().min(2).max(60),
      state: z.string().trim().min(2).max(60),
      pincode: z.string().trim().regex(/^\d{6}$/, "Enter a 6-digit pincode"),
    })
    .optional(),
  internalNotes: z.string().trim().max(1000).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await adminGuard();
  if (denied) return denied;
  const { id } = await params;
  const parsed = await parseBody(req, schema);
  if ("error" in parsed) return parsed.error;
  const { status, courier, trackingUrl, resolved, customerName, customerPhone, address, internalNotes } = parsed.data;

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
  if (customerName) data.customerName = customerName;
  if (customerPhone) data.customerPhone = customerPhone;
  if (address) data.shippingAddress = { ...address, line2: address.line2 || "" };
  if (internalNotes !== undefined) data.internalNotes = internalNotes || null;
  if (courier !== undefined) data.courier = courier || null;
  if (trackingUrl !== undefined) data.trackingUrl = trackingUrl || null;
  if (resolved) data.needsAttention = false;
  if (status) {
    data.status = status;
    if (status === "SHIPPED" && !order.shippedAt) data.shippedAt = new Date();
    if (status === "DELIVERED") {
      data.deliveredAt = new Date();
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
