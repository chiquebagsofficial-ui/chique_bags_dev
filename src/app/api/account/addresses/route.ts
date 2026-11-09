import { prisma } from "@/lib/db";
import { fail, ok, parseBody } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { addressSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return fail("Please log in.", 401);
  const addresses = await prisma.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { id: "desc" }] });
  return ok({ addresses });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return fail("Please log in.", 401);
  const parsed = await parseBody(req, addressSchema);
  if ("error" in parsed) return parsed.error;
  const { id: _id, isDefault, line2, ...rest } = parsed.data;
  void _id;

  const count = await prisma.address.count({ where: { userId: user.id } });
  if (count >= 10) return fail("You can save up to 10 addresses.", 400);
  const makeDefault = Boolean(isDefault) || count === 0;
  if (makeDefault) await prisma.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
  const address = await prisma.address.create({ data: { ...rest, line2: line2 || null, userId: user.id, isDefault: makeDefault } });
  return ok({ address }, 201);
}
