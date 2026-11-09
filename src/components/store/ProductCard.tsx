"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
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
      <div className="relative aspect-[3/4] overflow-hidden bg-cream">
        <Link href={`/products/${product.slug}`} aria-label={product.name} className="absolute inset-0">
          {product.image && (
            <Image
              src={product.image}
              alt={product.name}
              fill
              priority={priority}
              sizes="(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw"
              className={cn("object-cover transition-all duration-[900ms] ease-out", product.hoverImage ? "group-hover:opacity-0" : "group-hover:scale-[1.04]", !product.inStock && "opacity-60")}
            />
          )}
          {product.hoverImage && (
            <Image
              src={product.hoverImage}
              alt=""
              fill
              sizes="(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw"
              className="object-cover opacity-0 transition-opacity duration-[900ms] group-hover:opacity-100"
            />
          )}
        </Link>

        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {!product.inStock && <span className="badge badge-dark">Sold out</span>}
          {product.inStock && product.isBestSeller && <span className="badge">Bestseller</span>}
          {product.inStock && product.isNew && <span className="badge badge-rose">New</span>}
        </div>

        <button
          type="button"
          onClick={() => wish.toggle(product.id)}
          aria-label={saved ? "Remove from favourites" : "Save to favourites"}
          aria-pressed={saved}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center bg-white/90 transition hover:bg-white"
        >
          <Heart size={17} strokeWidth={1.5} className={cn(saved ? "fill-berry text-berry" : "text-ink")} />
        </button>

        {product.inStock && (
          <button
            type="button"
            onClick={quickAdd}
            className="absolute inset-x-0 bottom-0 translate-y-full bg-ink py-3.5 text-[0.68rem] font-medium uppercase tracking-[0.22em] text-white transition-transform duration-300 hover:bg-berry group-hover:translate-y-0 max-lg:translate-y-0 max-lg:bg-white/92 max-lg:py-2.5 max-lg:text-ink max-lg:hover:bg-white"
          >
            Add to bag
          </button>
        )}
      </div>

      <div className="pt-4 text-center">
        <Link href={`/products/${product.slug}`} className="block font-serif text-[1.2rem] leading-snug hover:text-berry sm:text-[1.3rem]">
          {product.name}
        </Link>
        <div className="mt-1.5 flex flex-wrap items-baseline justify-center gap-x-2.5 text-[0.88rem]">
          <span className="font-medium">{formatINR(product.price)}</span>
          {product.mrp && <span className="text-muted line-through">{formatINR(product.mrp)}</span>}
          {off > 0 && <span className="text-[0.75rem] tracking-wide text-berry">{off}% off</span>}
        </div>
        <div className="mt-2.5 flex items-center justify-center gap-1.5">
          {product.variants.slice(0, 5).map((v) => (
            <span key={v.id} title={v.name} className="h-3 w-3 rounded-full border border-black/15" style={{ background: v.hex }} />
          ))}
        </div>
      </div>
    </article>
  );
}
