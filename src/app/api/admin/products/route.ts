import { prisma } from "@/lib/db";
import { adminGuard, ok, parseBody } from "@/lib/api";
import { productSchema } from "@/lib/validations";
import { uniqueProductSlug } from "@/lib/slug";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const denied = await adminGuard();
  if (denied) return denied;
  const parsed = await parseBody(req, productSchema);
  if ("error" in parsed) return parsed.error;
  const { variants, originalPrice, ...rest } = parsed.data;

  const product = await prisma.product.create({
    data: {
      ...rest,
      originalPrice: originalPrice && originalPrice > rest.price ? originalPrice : null,
      slug: await uniqueProductSlug(rest.name),
      variants: { create: variants.map((v, i) => ({ name: v.name, hex: v.hex, stock: v.stock, sortOrder: i })) },
    },
  });
  return ok({ id: product.id }, 201);
}
