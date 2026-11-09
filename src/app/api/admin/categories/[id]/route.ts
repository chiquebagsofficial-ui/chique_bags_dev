import { prisma } from "@/lib/db";
import { adminGuard, fail, ok, parseBody } from "@/lib/api";
import { categorySchema } from "@/lib/validations";
import { uniqueCategorySlug } from "@/lib/slug";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await adminGuard();
  if (denied) return denied;
  const { id } = await params;
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) return fail("Category not found.", 404);
  const parsed = await parseBody(req, categorySchema);
  if ("error" in parsed) return parsed.error;
  await prisma.category.update({
    where: { id },
    data: {
      ...parsed.data,
      image: parsed.data.image || null,
      slug: parsed.data.name === existing.name ? existing.slug : await uniqueCategorySlug(parsed.data.name, id),
    },
  });
  return ok();
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await adminGuard();
  if (denied) return denied;
  const { id } = await params;
  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) return fail(`This category still has ${count} product${count === 1 ? "" : "s"}. Move or delete them first.`, 400);
  await prisma.category.delete({ where: { id } }).catch(() => null);
  return ok();
}
