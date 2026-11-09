import { z } from "zod";
import { prisma } from "@/lib/db";
import { fail, limit, ok, parseBody } from "@/lib/api";
import { consumeCode } from "@/lib/codes";
import { loginCustomer } from "@/lib/auth";
import { emailSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

const schema = z.object({
  email: emailSchema,
  code: z.string().trim().length(6, "Enter the 6-digit code"),
  name: z.string().trim().min(2, "Enter your name").max(80),
});

// Guest checkout step 2: a correct code proves the email is theirs and signs them in
// (creating a password-less account that they can later claim by signing up).
export async function POST(req: Request) {
  const limited = await limit(req, "guest-verify", 15, 10 * 60_000);
  if (limited) return limited;
  const parsed = await parseBody(req, schema);
  if ("error" in parsed) return parsed.error;
  const { email, code, name } = parsed.data;

  const result = await consumeCode(email, "CHECKOUT", code);
  if (!result.ok) return fail(result.error, 400);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.role !== "CUSTOMER") return fail("Please use a different email address.", 400);
  const user = existing
    ? await prisma.user.update({ where: { id: existing.id }, data: { emailVerified: true } })
    : await prisma.user.create({ data: { email, name, emailVerified: true } });
  await loginCustomer(user.id);
  return ok({ ok: true, user: { id: user.id, name: user.name, email: user.email } });
}
