import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { fail, limit, ok, parseBody } from "@/lib/api";
import { consumeCode } from "@/lib/codes";
import { loginCustomer } from "@/lib/auth";
import { emailSchema, passwordSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

const schema = z.object({ email: emailSchema, code: z.string().trim().length(6, "Enter the 6-digit code"), password: passwordSchema });

export async function POST(req: Request) {
  const limited = await limit(req, "reset", 10, 10 * 60_000);
  if (limited) return limited;
  const parsed = await parseBody(req, schema);
  if ("error" in parsed) return parsed.error;
  const { email, code, password } = parsed.data;

  const result = await consumeCode(email, "RESET", code);
  if (!result.ok) return fail(result.error, 400);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.role !== "CUSTOMER") return fail("Account not found.", 404);
  await prisma.user.update({ where: { id: user.id }, data: { password: await bcrypt.hash(password, 11), emailVerified: true } });
  await loginCustomer(user.id);
  return ok({ ok: true });
}
