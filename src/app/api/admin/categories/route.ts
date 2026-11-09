import { prisma } from "@/lib/db";
import { adminGuard, ok, parseBody } from "@/lib/api";
import { categorySchema } from "@/lib/validations";
import { uniqueCategorySlug } from "@/lib/slug";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const denied = await adminGuard();
  if (denied) return denied;
  const parsed = await parseBody(req, categorySchema);
  if ("error" in parsed) return parsed.error;
  const category = await prisma.category.create({
    data: { ...parsed.data, image: parsed.data.image || null, slug: await uniqueCategorySlug(parsed.data.name) },
  });
  return ok({ id: category.id }, 201);
}
