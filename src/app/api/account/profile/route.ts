import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { fail, ok, parseBody } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { passwordSchema, phoneSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: phoneSchema.optional().or(z.literal("")),
  currentPassword: z.string().max(100).optional(),
  newPassword: passwordSchema.optional(),
});

export async function PUT(req: Request) {
  const user = await getSessionUser();
  if (!user) return fail("Please log in.", 401);
  const parsed = await parseBody(req, schema);
  if ("error" in parsed) return parsed.error;
  const { name, phone, currentPassword, newPassword } = parsed.data;

  const data: { name: string; phone: string | null; password?: string } = { name, phone: phone || null };
  if (newPassword) {
    const row = await prisma.user.findUnique({ where: { id: user.id } });
    // Accounts created through guest checkout have no password yet, so none is required to set one.
    if (row?.password) {
      const valid = currentPassword ? await bcrypt.compare(currentPassword, row.password) : false;
      if (!valid) return fail("Your current password is incorrect.", 400);
    }
    data.password = await bcrypt.hash(newPassword, 11);
  }
  await prisma.user.update({ where: { id: user.id }, data });
  return ok();
}
