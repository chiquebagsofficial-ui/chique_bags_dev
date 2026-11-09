import { z } from "zod";
import { prisma } from "@/lib/db";
import { limit, ok, parseBody } from "@/lib/api";
import { issueCode } from "@/lib/codes";
import { sendVerificationCode } from "@/lib/emails";
import { emailSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const limited = await limit(req, "forgot", 5, 10 * 60_000);
  if (limited) return limited;
  const parsed = await parseBody(req, z.object({ email: emailSchema }));
  if ("error" in parsed) return parsed.error;
  const { email } = parsed.data;

  // Same response whether or not the account exists, so emails can't be probed.
  const user = await prisma.user.findUnique({ where: { email } });
  if (user && user.role === "CUSTOMER") {
    const code = await issueCode(email, "RESET");
    await sendVerificationCode(email, code, "RESET");
  }
  return ok({ ok: true });
}
