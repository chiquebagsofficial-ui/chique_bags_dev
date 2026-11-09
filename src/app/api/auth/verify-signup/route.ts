import { z } from "zod";
import { prisma } from "@/lib/db";
import { fail, limit, ok, parseBody } from "@/lib/api";
import { consumeCode } from "@/lib/codes";
import { loginCustomer } from "@/lib/auth";
import { sendWelcome } from "@/lib/emails";
import { emailSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

const schema = z.object({ email: emailSchema, code: z.string().trim().length(6, "Enter the 6-digit code") });

// Step 2 of sign-up: check the code, create the account and sign the customer in.
export async function POST(req: Request) {
  const limited = await limit(req, "verify-signup", 15, 10 * 60_000);
  if (limited) return limited;

  const parsed = await parseBody(req, schema);
  if ("error" in parsed) return parsed.error;
  const { email, code } = parsed.data;

  const result = await consumeCode(email, "SIGNUP", code);
  if (!result.ok) return fail(result.error, 400);
  const data = result.data as { name: string; phone: string | null; passwordHash: string };

  // A guest-checkout account may already exist for this email: claim it.
  const user = await prisma.user.upsert({
    where: { email },
    create: { email, name: data.name, phone: data.phone, password: data.passwordHash, emailVerified: true },
    update: { name: data.name, phone: data.phone ?? undefined, password: data.passwordHash, emailVerified: true },
  });
  await loginCustomer(user.id);
  void sendWelcome(user.name, user.email);
  return ok({ ok: true, user: { id: user.id, name: user.name, email: user.email } });
}
