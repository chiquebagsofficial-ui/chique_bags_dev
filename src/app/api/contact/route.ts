import { z } from "zod";
import { prisma } from "@/lib/db";
import { limit, ok, parseBody } from "@/lib/api";
import { sendContactMessage } from "@/lib/emails";
import { emailSchema, phoneSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  email: emailSchema,
  phone: phoneSchema.optional().or(z.literal("")),
  message: z.string().trim().min(10, "Please write a few more words").max(2000),
});

export async function POST(req: Request) {
  const limited = await limit(req, "contact", 5, 10 * 60_000);
  if (limited) return limited;
  const parsed = await parseBody(req, schema);
  if ("error" in parsed) return parsed.error;
  const data = { ...parsed.data, phone: parsed.data.phone || null };
  await prisma.contactMessage.create({ data });
  await sendContactMessage(data);
  return ok();
}
