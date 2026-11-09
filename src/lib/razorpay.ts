import Razorpay from "razorpay";
import { createHmac, timingSafeEqual } from "crypto";

let client: Razorpay | null = null;

export function isGatewayConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

/**
 * In development, with no Razorpay keys, checkout falls back to a built-in
 * "test payment" so the full order flow can be tried. Never allowed in production.
 */
export function isSimulatedPaymentAllowed(): boolean {
  return !isGatewayConfigured() && process.env.NODE_ENV !== "production";
}

export function getRazorpay(): Razorpay | null {
  if (!isGatewayConfigured()) return null;
  if (!client) {
    client = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }
  return client;
}

function safeEqualHex(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function verifyPaymentSignature(razorpayOrderId: string, paymentId: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const expected = createHmac("sha256", secret).update(`${razorpayOrderId}|${paymentId}`).digest("hex");
  return safeEqualHex(expected, signature);
}

export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}
