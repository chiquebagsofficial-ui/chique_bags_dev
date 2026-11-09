import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { fail, limit, ok, parseBody } from "@/lib/api";
import { loginCustomer } from "@/lib/auth";
import { emailSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

const schema = z.object({ email: emailSchema, password: z.string().min(1).max(100) });
// Used to keep response time similar when the email does not exist.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 11);

export async function POST(req: Request) {
  const parsed = await parseBody(req, schema);
  if ("error" in parsed) return parsed.error;
  const { email, password } = parsed.data;

  const limited = await limit(req, "login", 10, 10 * 60_000, email);
  if (limited) return limited;

  const user = await prisma.user.findUnique({ where: { email } });
  const valid = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);
  // Admin accounts cannot sign in on the storefront.
  if (!user || !user.password || !valid || user.role !== "CUSTOMER") {
    return fail("Incorrect email or password.", 401);
  }
  await loginCustomer(user.id);
  return ok({ ok: true, user: { id: user.id, name: user.name, email: user.email } });
}
