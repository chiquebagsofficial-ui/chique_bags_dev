import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export const cardInclude = { variants: { orderBy: { sortOrder: "asc" } } } satisfies Prisma.ProductInclude;
type CardRow = Prisma.ProductGetPayload<{ include: typeof cardInclude }>;

export interface ProductCardData {
  id: string;
  slug: string;
  name: string;
  price: number;
  mrp: number | null;
  image: string | null;
  hoverImage: string | null;
  isNew: boolean;
  isBestSeller: boolean;
  inStock: boolean;
  rating: number;
  reviewCount: number;
  variants: { id: string; name: string; hex: string; stock: number }[];
}

export function toCard(p: CardRow): ProductCardData {
  const stock = p.variants.reduce((n, v) => n + v.stock, 0);
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: p.price,
    mrp: p.originalPrice && p.originalPrice > p.price ? p.originalPrice : null,
    image: p.images[0] ?? null,
    hoverImage: p.images[1] ?? null,
    isNew: p.isNew,
    isBestSeller: p.isBestSeller,
    inStock: stock > 0,
    rating: p.rating,
    reviewCount: p.reviewCount,
    variants: p.variants.map((v) => ({ id: v.id, name: v.name, hex: v.hex, stock: v.stock })),
  };
}

export async function getCards(where: Prisma.ProductWhereInput, take = 8, orderBy: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[] = { createdAt: "desc" }) {
  const rows = await prisma.product.findMany({ where: { isActive: true, ...where }, include: cardInclude, orderBy, take });
  return rows.map(toCard);
}

export const getNavCategories = () =>
  prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true, slug: true, image: true, description: true } });

export const SORTS = {
  newest: { label: "Newest", orderBy: { createdAt: "desc" } },
  popular: { label: "Best sellers", orderBy: [{ isBestSeller: "desc" }, { createdAt: "desc" }] },
  "price-asc": { label: "Price: low to high", orderBy: { price: "asc" } },
  "price-desc": { label: "Price: high to low", orderBy: { price: "desc" } },
} as const satisfies Record<string, { label: string; orderBy: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[] }>;
export type SortKey = keyof typeof SORTS;
