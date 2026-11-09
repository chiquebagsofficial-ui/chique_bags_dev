"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { useCart, useToast, useWishlist } from "@/components/providers";
import type { ProductCardData } from "@/lib/catalog";
import { cn, discountPercent, formatINR } from "@/lib/utils";

export default function ProductCard({ product, priority = false }: { product: ProductCardData; priority?: boolean }) {
  const cart = useCart();
  const wish = useWishlist();
  const toast = useToast();
  const saved = wish.has(product.id);
  const off = discountPercent(product.price, product.mrp);
  const firstInStock = product.variants.find((v) => v.stock > 0);

  function quickAdd() {
    if (!firstInStock) return;
    cart.add({
      variantId: firstInStock.id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      variantName: firstInStock.name,
      image: product.image,
      price: product.price,
      mrp: product.mrp ?? product.price,
    });
    toast(`Added ${firstInStock.name} to your bag`);
  }

  return (
    <article className="group">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-cream">
        <Link href={`/products/${product.slug}`} aria-label={product.name} className="absolute inset-0">
          {product.image && (
            <Image
              src={product.image}
              alt={product.name}
              fill
              priority={priority}
              sizes="(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw"
              className={cn("object-cover transition-all duration-700", product.hoverImage && "group-hover:opacity-0", !product.inStock && "opacity-60")}
            />
          )}
          {product.hoverImage && (
            <Image
              src={product.hoverImage}
              alt=""
              fill
              sizes="(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw"
              className="object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100"
            />
          )}
        </Link>

        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {!product.inStock && <span className="badge badge-dark">Sold out</span>}
          {product.inStock && product.isBestSeller && <span className="badge badge-rose">Bestseller</span>}
          {product.inStock && product.isNew && <span className="badge">New</span>}
        </div>

        <button
          type="button"
          onClick={() => wish.toggle(product.id)}
          aria-label={saved ? "Remove from favourites" : "Save to favourites"}
          aria-pressed={saved}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/95 shadow-sm transition hover:scale-110"
        >
          <Heart size={17} className={cn(saved ? "fill-rose text-rose" : "text-ink")} />
        </button>

        {product.inStock && (
          <button
            type="button"
            onClick={quickAdd}
            className="absolute inset-x-3 bottom-3 flex translate-y-2 items-center justify-center gap-2 rounded-full bg-white/95 py-2.5 text-xs font-semibold uppercase tracking-wider opacity-0 shadow transition-all hover:bg-ink hover:text-white group-hover:translate-y-0 group-hover:opacity-100 max-lg:translate-y-0 max-lg:opacity-100"
          >
            <ShoppingBag size={14} /> Add to bag
          </button>
        )}
      </div>

      <div className="px-1 pt-3">
        <div className="mb-2 flex items-center gap-1.5">
          {product.variants.slice(0, 5).map((v) => (
            <span key={v.id} title={v.name} className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ background: v.hex }} />
          ))}
        </div>
        <Link href={`/products/${product.slug}`} className="block text-[0.95rem] font-medium leading-snug hover:text-rose">
          {product.name}
        </Link>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
          <span className="font-semibold">{formatINR(product.price)}</span>
          {product.mrp && <span className="text-sm text-muted line-through">{formatINR(product.mrp)}</span>}
          {off > 0 && <span className="text-xs font-semibold text-berry">{off}% off</span>}
        </div>
      </div>
    </article>
  );
}
