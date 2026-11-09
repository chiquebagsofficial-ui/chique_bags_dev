import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { fail, limit, ok, parseBody } from "@/lib/api";
import { issueCode } from "@/lib/codes";
import { sendVerificationCode } from "@/lib/emails";
import { registerSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

// Step 1 of sign-up: validate the details, then email a 6-digit code.
export async function POST(req: Request) {
  const limited = await limit(req, "register", 8, 10 * 60_000);
  if (limited) return limited;

  const parsed = await parseBody(req, registerSchema);
  if ("error" in parsed) return parsed.error;
  const { name, email, phone, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing?.password) return fail("An account with this email already exists. Please log in.", 409);

  const passwordHash = await bcrypt.hash(password, 11);
  const code = await issueCode(email, "SIGNUP", { name, phone: phone || null, passwordHash });
  await sendVerificationCode(email, code, "SIGNUP");
  return ok({ ok: true });
}
