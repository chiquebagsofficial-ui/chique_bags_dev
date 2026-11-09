import ProductForm, { EMPTY_PRODUCT } from "@/components/admin/ProductForm";
import { PageHead } from "@/components/admin/ui";
import { prisma } from "@/lib/db";

export const metadata = { title: "New product" };
export const dynamic = "force-dynamic";

export default async function NewProduct() {
  const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } });
  return (
    <>
      <PageHead title="Add product" />
      <ProductForm initial={EMPTY_PRODUCT} categories={categories} />
    </>
  );
}
