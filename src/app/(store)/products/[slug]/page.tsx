import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronDown, Gift, RotateCcw, ShieldCheck, Star, Truck } from "lucide-react";
import ProductBuyBox from "@/components/store/ProductBuyBox";
import ProductCard from "@/components/store/ProductCard";
import ProductGallery from "@/components/store/ProductGallery";
import ReviewForm from "@/components/store/ReviewForm";
import { getSessionUser } from "@/lib/auth";
import { cardInclude, toCard } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { appUrl, discountPercent, formatDate, formatINR } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getProduct(slug: string) {
  return prisma.product.findFirst({
    where: { slug, isActive: true },
    include: { category: true, variants: { orderBy: { sortOrder: "asc" } }, reviews: { include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 20 } },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return { title: "Product not found" };
  const description = p.shortDescription ?? `Handcrafted ${p.name} by Chique Bags.`;
  return {
    title: p.name,
    description,
    alternates: { canonical: `/products/${p.slug}` },
    openGraph: { title: p.name, description, type: "website", images: p.images[0] ? [{ url: p.images[0] }] : undefined },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const [settings, user, related] = await Promise.all([
    getSettings(),
    getSessionUser(),
    prisma.product.findMany({ where: { isActive: true, categoryId: product.categoryId, id: { not: product.id } }, include: cardInclude, take: 4, orderBy: { isBestSeller: "desc" } }),
  ]);
  const canReview = user
    ? (await prisma.orderItem.count({ where: { productId: product.id, order: { userId: user.id, status: "DELIVERED" } } })) > 0
    : false;

  const mrp = product.originalPrice && product.originalPrice > product.price ? product.originalPrice : null;
  const off = discountPercent(product.price, mrp);
  const stock = product.variants.reduce((n, v) => n + v.stock, 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images,
    description: product.shortDescription ?? product.description ?? undefined,
    category: product.category.name,
    brand: { "@type": "Brand", name: "Chique Bags" },
    ...(product.reviewCount > 0 && { aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.reviewCount } }),
    offers: {
      "@type": "Offer",
      url: appUrl(`/products/${product.slug}`),
      priceCurrency: "INR",
      price: product.price,
      availability: stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  const details = [
    { title: "Description", body: product.description },
    { title: "Details", list: [...product.features, product.material && `Material: ${product.material}`, product.dimensions && `Size: ${product.dimensions}`].filter(Boolean) as string[] },
    { title: "Care", body: product.careInstructions },
    { title: "Shipping & exchange", body: `Free shipping on orders above ${formatINR(settings.freeShippingThreshold)}; otherwise ${formatINR(settings.shippingFee)}. Delivered in 3–5 working days across India. Easy 7-day exchange for wrong or defective items.` },
  ].filter((d) => d.body || d.list?.length);

  return (
    <div className="wrap py-8 lg:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav aria-label="Breadcrumb" className="mb-6 text-xs text-muted">
        <Link href="/" className="hover:text-rose">Home</Link> / <Link href="/shop" className="hover:text-rose">Shop</Link> /{" "}
        <Link href={`/shop?category=${product.category.slug}`} className="hover:text-rose">{product.category.name}</Link>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div className="min-w-0"><ProductGallery images={product.images} name={product.name} /></div>

        <div className="min-w-0 lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow">{product.category.name}</p>
          <h1 className="h-display mt-2 text-3xl sm:text-4xl">{product.name}</h1>
          {product.reviewCount > 0 && (
            <a href="#reviews" className="mt-3 inline-flex items-center gap-1.5 text-sm">
              <Star size={16} className="fill-gold text-gold" /> <strong>{product.rating.toFixed(1)}</strong>
              <span className="text-muted">({product.reviewCount} {product.reviewCount === 1 ? "review" : "reviews"})</span>
            </a>
          )}
          <div className="mt-5 flex flex-wrap items-baseline gap-x-3">
            <span className="text-3xl font-semibold">{formatINR(product.price)}</span>
            {mrp && <span className="text-lg text-muted line-through">{formatINR(mrp)}</span>}
            {off > 0 && <span className="rounded-full bg-blush px-3 py-1 text-xs font-bold text-berry">Save {formatINR((mrp ?? 0) - product.price)} · {off}% off</span>}
          </div>
          <p className="mt-1 text-xs text-muted">Inclusive of all taxes</p>
          {product.shortDescription && <p className="mt-5 leading-relaxed text-muted">{product.shortDescription}</p>}

          <div className="mt-7">
            <ProductBuyBox
              product={{ id: product.id, slug: product.slug, name: product.name, price: product.price, mrp, image: product.images[0] ?? null }}
              variants={product.variants.map((v) => ({ id: v.id, name: v.name, hex: v.hex, stock: v.stock }))}
            />
          </div>

          <ul className="mt-8 grid gap-3 rounded-2xl bg-cream p-5 text-sm">
            <li className="flex items-center gap-3"><Truck size={18} className="text-rose" /> Delivered in 3–5 days · Free above {formatINR(settings.freeShippingThreshold)}</li>
            <li className="flex items-center gap-3"><RotateCcw size={18} className="text-rose" /> 7-day exchange for wrong or defective items</li>
            {settings.giftBoxEnabled && <li className="flex items-center gap-3"><Gift size={18} className="text-rose" /> <span>Make it a gift: add a gift box &amp; note at checkout{settings.giftBoxFee > 0 ? ` (${formatINR(settings.giftBoxFee)})` : ""} · <Link href="/gifting" className="underline">Learn more</Link></span></li>}
            <li className="flex items-center gap-3"><ShieldCheck size={18} className="text-rose" /> Secure payment · UPI, cards, net banking{settings.codEnabled && ", COD"}</li>
          </ul>

          <div className="mt-6 divide-y divide-line border-y border-line">
            {details.map((d, i) => (
              <details key={d.title} open={i === 0} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
                  {d.title} <ChevronDown size={18} className="transition group-open:rotate-180" />
                </summary>
                {d.body && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted">{d.body}</p>}
                {d.list && <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted">{d.list.map((x) => <li key={x}>{x}</li>)}</ul>}
              </details>
            ))}
          </div>
        </div>
      </div>

      <section id="reviews" className="mt-20 max-w-3xl scroll-mt-28">
        <h2 className="h-display text-3xl">Reviews</h2>
        {product.reviews.length === 0 ? (
          <p className="mt-4 text-muted">No reviews yet. Reviews open once your order is delivered.</p>
        ) : (
          <ul className="mt-6 divide-y divide-line">
            {product.reviews.map((r) => (
              <li key={r.id} className="py-5">
                <div className="flex items-center gap-2">
                  <span className="flex" aria-label={`${r.rating} out of 5 stars`}>
                    {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={15} className={n <= r.rating ? "fill-gold text-gold" : "text-[#d6cfca]"} />)}
                  </span>
                  <span className="text-sm font-semibold">{r.user.name.split(" ")[0]}</span>
                  <span className="text-xs text-muted">{formatDate(r.createdAt)}</span>
                </div>
                {r.title && <p className="mt-2 font-medium">{r.title}</p>}
                {r.comment && <p className="mt-1 text-sm leading-relaxed text-muted">{r.comment}</p>}
              </li>
            ))}
          </ul>
        )}
        {canReview && <ReviewForm productId={product.id} />}
      </section>

      {related.length > 0 && (
        <section className="mt-24">
          <h2 className="h-display mb-8 text-3xl">You may also like</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
            {related.map((p) => <ProductCard key={p.id} product={toCard(p)} />)}
          </div>
        </section>
      )}
    </div>
  );
}
