import { notFound } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import { PageHead } from "@/components/admin/ui";
import { prisma } from "@/lib/db";

export const metadata = { title: "Edit product" };
export const dynamic = "force-dynamic";

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [p, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id }, include: { variants: { orderBy: { sortOrder: "asc" } } } }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!p) notFound();
  return (
    <>
      <PageHead title="Edit product" subtitle={p.name} />
      <ProductForm
        categories={categories}
        initial={{
          id: p.id,
          name: p.name,
          categoryId: p.categoryId,
          price: p.price,
          originalPrice: p.originalPrice ?? "",
          shortDescription: p.shortDescription ?? "",
          description: p.description ?? "",
          images: p.images,
          features: p.features.join("\n"),
          tags: p.tags.join(", "),
          material: p.material ?? "",
          dimensions: p.dimensions ?? "",
          careInstructions: p.careInstructions ?? "",
          isNew: p.isNew,
          isBestSeller: p.isBestSeller,
          isFeatured: p.isFeatured,
          isActive: p.isActive,
          variants: p.variants.map((v) => ({ id: v.id, name: v.name, hex: v.hex, stock: v.stock })),
        }}
      />
    </>
  );
}
