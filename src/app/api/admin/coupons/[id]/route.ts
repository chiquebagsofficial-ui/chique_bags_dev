import { prisma } from "@/lib/db";
import { adminGuard, fail, ok, parseBody } from "@/lib/api";
import { couponSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await adminGuard();
  if (denied) return denied;
  const { id } = await params;
  const parsed = await parseBody(req, couponSchema);
  if ("error" in parsed) return parsed.error;
  const { expiresAt, ...rest } = parsed.data;
  if (rest.type === "PERCENTAGE" && rest.value > 100) return fail("A percentage coupon can't be more than 100.", 400);
  const clash = await prisma.coupon.findUnique({ where: { code: rest.code } });
  if (clash && clash.id !== id) return fail("A coupon with this code already exists.", 409);
  await prisma.coupon.update({ where: { id }, data: { ...rest, expiresAt: expiresAt ? new Date(expiresAt) : null } });
  return ok();
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await adminGuard();
  if (denied) return denied;
  const { id } = await params;
  await prisma.coupon.delete({ where: { id } }).catch(() => null);
  return ok();
}
