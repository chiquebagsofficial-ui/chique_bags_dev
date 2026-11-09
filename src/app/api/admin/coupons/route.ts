import { prisma } from "@/lib/db";
import { adminGuard, fail, ok, parseBody } from "@/lib/api";
import { couponSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const denied = await adminGuard();
  if (denied) return denied;
  const parsed = await parseBody(req, couponSchema);
  if ("error" in parsed) return parsed.error;
  const { expiresAt, ...rest } = parsed.data;
  if (rest.type === "PERCENTAGE" && rest.value > 100) return fail("A percentage coupon can't be more than 100.", 400);
  if (await prisma.coupon.findUnique({ where: { code: rest.code } })) return fail("A coupon with this code already exists.", 409);
  const coupon = await prisma.coupon.create({ data: { ...rest, expiresAt: expiresAt ? new Date(expiresAt) : null } });
  return ok({ id: coupon.id }, 201);
}
