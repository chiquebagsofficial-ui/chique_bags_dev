import { z } from "zod";
import { prisma } from "@/lib/db";
import { fail, ok, parseBody } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { confirmOnlinePayment, markPaymentFailed } from "@/lib/checkout";
import { isSimulatedPaymentAllowed, verifyPaymentSignature } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

const schema = z.object({
  orderId: z.string().min(1),
  razorpayPaymentId: z.string().optional(),
  razorpaySignature: z.string().optional(),
  failed: z.boolean().optional(),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return fail("Please log in.", 401);
  const parsed = await parseBody(req, schema);
  if ("error" in parsed) return parsed.error;
  const { orderId, razorpayPaymentId, razorpaySignature, failed } = parsed.data;

  const order = await prisma.order.findFirst({ where: { id: orderId, userId: user.id, paymentMethod: "ONLINE" } });
  if (!order || !order.razorpayOrderId) return fail("Order not found.", 404);

  if (failed) {
    await markPaymentFailed(order.id);
    return ok({ ok: false });
  }

  if (order.razorpayOrderId.startsWith("sim_")) {
    // Built-in test payment: only ever allowed when no real gateway is configured outside production.
    if (!isSimulatedPaymentAllowed()) return fail("Invalid payment.", 400);
    const res = await confirmOnlinePayment(order.id, `sim_pay_${Date.now()}`);
    return ok({ ok: res.ok, soldOut: res.soldOut ?? false });
  }

  if (!razorpayPaymentId || !razorpaySignature || !verifyPaymentSignature(order.razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
    await markPaymentFailed(order.id);
    return fail("Payment verification failed.", 400);
  }
  const res = await confirmOnlinePayment(order.id, razorpayPaymentId);
  return ok({ ok: res.ok, soldOut: res.soldOut ?? false });
}
