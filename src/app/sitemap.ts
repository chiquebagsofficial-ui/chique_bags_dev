import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { appUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    prisma.category.findMany({ where: { isActive: true }, select: { slug: true } }),
  ]);
  const fixed = ["", "/shop", "/about", "/contact", "/shipping", "/returns", "/terms", "/privacy"].map((p) => ({ url: appUrl(p) }));
  return [
    ...fixed,
    ...categories.map((c) => ({ url: appUrl(`/shop?category=${c.slug}`) })),
    ...products.map((p) => ({ url: appUrl(`/products/${p.slug}`), lastModified: p.updatedAt })),
  ];
}
