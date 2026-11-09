import { z } from "zod";
import { fail, limit, ok, parseBody } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { createOrder } from "@/lib/checkout";
import { addressSchema, cartSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

const schema = z.object({
  items: cartSchema,
  address: addressSchema,
  method: z.enum(["COD", "ONLINE"]),
  couponCode: z.string().trim().max(40).nullish(),
  expectedTotal: z.number().int().nonnegative().optional(),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return fail("Please verify your email or log in to place an order.", 401);
  const limited = await limit(req, "checkout", 12, 10 * 60_000, user.id);
  if (limited) return limited;

  const parsed = await parseBody(req, schema);
  if ("error" in parsed) return parsed.error;
  const { items, address, method, couponCode, expectedTotal } = parsed.data;

  const result = await createOrder({
    userId: user.id,
    name: user.name,
    email: user.email,
    phone: address.phone,
    address,
    items,
    couponCode,
    method,
    expectedTotal,
  });
  if (!result.ok) return fail(result.error, result.status, { code: result.code, total: result.total });

  return ok(
    {
      orderId: result.orderId,
      orderNumber: result.orderNumber,
      method: result.method,
      razorpayOrderId: result.razorpayOrderId,
      amount: result.amountPaise,
      currency: "INR",
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || null,
      simulated: result.simulated ?? false,
    },
    201
  );
}
