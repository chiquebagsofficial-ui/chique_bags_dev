import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";

export async function uniqueProductSlug(name: string, excludeId?: string): Promise<string> {
  const base = slugify(name) || "product";
  let slug = base;
  for (let i = 2; ; i++) {
    const clash = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
    if (!clash || clash.id === excludeId) return slug;
    slug = `${base}-${i}`;
  }
}

export async function uniqueCategorySlug(name: string, excludeId?: string): Promise<string> {
  const base = slugify(name) || "category";
  let slug = base;
  for (let i = 2; ; i++) {
    const clash = await prisma.category.findUnique({ where: { slug }, select: { id: true } });
    if (!clash || clash.id === excludeId) return slug;
    slug = `${base}-${i}`;
  }
}
