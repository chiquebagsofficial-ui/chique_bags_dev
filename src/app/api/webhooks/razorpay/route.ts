import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { confirmOnlinePayment, markPaymentFailed } from "@/lib/checkout";
import { verifyWebhookSignature } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

// Confirms an order even if the customer closed the tab right after paying.
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(raw) as {
    event: string;
    payload?: { payment?: { entity?: { id: string; order_id: string; amount: number } } };
  };
  const payment = event.payload?.payment?.entity;
  if (!payment?.order_id) return NextResponse.json({ ok: true });

  const order = await prisma.order.findUnique({ where: { razorpayOrderId: payment.order_id } });
  if (!order) return NextResponse.json({ ok: true });

  if (event.event === "payment.captured" || event.event === "order.paid") {
    // The paid amount must match what we asked for.
    if (payment.amount !== order.total * 100) {
      await prisma.order.update({ where: { id: order.id }, data: { needsAttention: true, notes: "Webhook amount did not match the order total." } });
      return NextResponse.json({ ok: true });
    }
    await confirmOnlinePayment(order.id, payment.id);
  } else if (event.event === "payment.failed") {
    await markPaymentFailed(order.id);
  }
  return NextResponse.json({ ok: true });
}
