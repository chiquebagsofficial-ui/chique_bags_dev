import { z } from "zod";
import { fail, ok, parseBody } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { priceCart } from "@/lib/checkout";
import { cartSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

const schema = z.object({
  items: cartSchema,
  couponCode: z.string().trim().max(40).nullish(),
  giftBox: z.boolean().optional(),
});

// Live price breakdown for the cart and checkout, always computed from the database.
export async function POST(req: Request) {
  const parsed = await parseBody(req, schema);
  if ("error" in parsed) return parsed.error;
  const user = await getSessionUser();
  const result = await priceCart(parsed.data.items, { couponCode: parsed.data.couponCode, userId: user?.id, giftBox: parsed.data.giftBox });
  if (!result.ok) return fail(result.error, 409, { code: result.code, variantId: result.variantId });
  return ok(result);
}
