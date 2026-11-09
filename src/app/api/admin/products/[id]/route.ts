import { prisma } from "@/lib/db";
import { adminGuard, fail, ok, parseBody } from "@/lib/api";
import { productSchema } from "@/lib/validations";
import { uniqueProductSlug } from "@/lib/slug";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await adminGuard();
  if (denied) return denied;
  const { id } = await params;
  const existing = await prisma.product.findUnique({ where: { id }, include: { variants: true } });
  if (!existing) return fail("Product not found.", 404);

  const parsed = await parseBody(req, productSchema);
  if ("error" in parsed) return parsed.error;
  const { variants, originalPrice, ...rest } = parsed.data;

  const keepIds = variants.map((v) => v.id).filter(Boolean) as string[];
  await prisma.$transaction(async (tx) => {
    await tx.productVariant.deleteMany({ where: { productId: id, id: { notIn: keepIds } } });
    for (const [i, v] of variants.entries()) {
      if (v.id && existing.variants.some((e) => e.id === v.id)) {
        await tx.productVariant.update({ where: { id: v.id }, data: { name: v.name, hex: v.hex, stock: v.stock, sortOrder: i } });
      } else {
        await tx.productVariant.create({ data: { productId: id, name: v.name, hex: v.hex, stock: v.stock, sortOrder: i } });
      }
    }
    await tx.product.update({
      where: { id },
      data: {
        ...rest,
        originalPrice: originalPrice && originalPrice > rest.price ? originalPrice : null,
        slug: rest.name === existing.name ? existing.slug : await uniqueProductSlug(rest.name, id),
      },
    });
  });
  return ok();
}

// "Hide" / "show" toggle used from the product list.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await adminGuard();
  if (denied) return denied;
  const { id } = await params;
  const parsed = await parseBody(req, z.object({ isActive: z.boolean() }));
  if ("error" in parsed) return parsed.error;
  await prisma.product.update({ where: { id }, data: { isActive: parsed.data.isActive } });
  return ok();
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await adminGuard();
  if (denied) return denied;
  const { id } = await params;
  // Past orders keep their own copy of name, price and photo, so deleting is safe.
  await prisma.product.delete({ where: { id } }).catch(() => null);
  return ok();
}
