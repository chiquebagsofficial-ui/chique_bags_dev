import { prisma } from "@/lib/db";
import { fail, ok, parseBody } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { lookupPincode } from "@/lib/pincode";
import { addressSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return fail("Please log in.", 401);
  const { id } = await params;
  const existing = await prisma.address.findFirst({ where: { id, userId: user.id } });
  if (!existing) return fail("Address not found.", 404);

  const parsed = await parseBody(req, addressSchema);
  if ("error" in parsed) return parsed.error;
  const { id: _id, isDefault, line2, ...rest } = parsed.data;
  const pin = await lookupPincode(parsed.data.pincode);
  if (pin.status === "invalid") return fail("We couldn't find this pincode. Please check it.", 400);

  void _id;
  if (isDefault) await prisma.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
  const address = await prisma.address.update({ where: { id }, data: { ...rest, line2: line2 || null, ...(isDefault ? { isDefault: true } : {}) } });
  return ok({ address });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return fail("Please log in.", 401);
  const { id } = await params;
  const res = await prisma.address.deleteMany({ where: { id, userId: user.id } });
  if (res.count === 0) return fail("Address not found.", 404);
  return ok();
}
