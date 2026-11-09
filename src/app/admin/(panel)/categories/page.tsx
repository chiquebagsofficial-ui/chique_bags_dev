import CategoriesManager from "@/components/admin/CategoriesManager";
import { PageHead } from "@/components/admin/ui";
import { prisma } from "@/lib/db";

export const metadata = { title: "Categories" };
export const dynamic = "force-dynamic";

export default async function AdminCategories() {
  const cats = await prisma.category.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: true } } } });
  return (
    <>
      <PageHead title="Categories" subtitle="Group your bags so customers can find them" />
      <CategoriesManager categories={cats.map((c) => ({ id: c.id, name: c.name, description: c.description, image: c.image, sortOrder: c.sortOrder, isActive: c.isActive, productCount: c._count.products }))} />
    </>
  );
}
