import { z } from "zod";
import { prisma } from "@/lib/db";
import { fail, limit, ok, parseBody } from "@/lib/api";
import { issueCode } from "@/lib/codes";
import { sendVerificationCode } from "@/lib/emails";
import { emailSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

// Guest checkout step 1: email a code to the address the customer typed in.
export async function POST(req: Request) {
  const limited = await limit(req, "guest-code", 6, 10 * 60_000);
  if (limited) return limited;
  const parsed = await parseBody(req, z.object({ email: emailSchema }));
  if ("error" in parsed) return parsed.error;
  const { email } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.role !== "CUSTOMER") return fail("Please use a different email address.", 400);
  const code = await issueCode(email, "CHECKOUT");
  await sendVerificationCode(email, code, "CHECKOUT");
  return ok({ ok: true });
}
