import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { fail, limit, ok, parseBody } from "@/lib/api";
import { getAdminSession } from "@/lib/auth";
import { emailSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

const schema = z.object({ email: emailSchema, password: z.string().min(1).max(100) });
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 11);

export async function POST(req: Request) {
  const parsed = await parseBody(req, schema);
  if ("error" in parsed) return parsed.error;
  const { email, password } = parsed.data;
  const limited = await limit(req, "admin-login", 6, 15 * 60_000, email);
  if (limited) return limited;

  const user = await prisma.user.findUnique({ where: { email } });
  const valid = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);
  if (!user || !user.password || !valid || user.role !== "ADMIN") return fail("Incorrect email or password.", 401);

  const session = await getAdminSession();
  session.userId = user.id;
  session.isLoggedIn = true;
  await session.save();
  return ok();
}
