import { z } from "zod";
import { prisma } from "@/lib/db";
import { limit, ok, parseBody } from "@/lib/api";
import { emailSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const limited = await limit(req, "newsletter", 6, 10 * 60_000);
  if (limited) return limited;
  const parsed = await parseBody(req, z.object({ email: emailSchema }));
  if ("error" in parsed) return parsed.error;
  await prisma.subscriber.upsert({ where: { email: parsed.data.email }, create: { email: parsed.data.email }, update: {} });
  return ok();
}
