"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useAuth, useWishlist } from "@/components/providers";
import ProductCard from "@/components/store/ProductCard";
import type { ProductCardData } from "@/lib/catalog";

export default function WishlistView() {
  const wish = useWishlist();
  const { user } = useAuth();
  const [products, setProducts] = useState<ProductCardData[] | null>(null);
  const key = wish.ids.join(",");

  useEffect(() => {
    if (!key) {
      setProducts([]);
      return;
    }
    fetch(`/api/products/by-ids?ids=${key}`)
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []))
      .catch(() => setProducts([]));
  }, [key]);

  // Items removed here disappear straight away.
  const visible = products?.filter((p) => wish.ids.includes(p.id));

  return (
    <div className="wrap py-10 lg:py-14">
      <h1 className="h-display text-4xl sm:text-5xl">Your favourites</h1>
      <p className="mt-2 text-muted">{user ? "Saved to your account, so you'll see them on any device." : <><Link href="/login?next=/wishlist" className="underline">Log in</Link> to keep your favourites across devices.</>}</p>

      {visible === undefined ? (
        <div className="mt-10 grid grid-cols-2 gap-6 lg:grid-cols-4">{[0, 1, 2, 3].map((n) => <div key={n} className="aspect-[4/5] animate-pulse rounded-2xl bg-cream" />)}</div>
      ) : visible.length === 0 ? (
        <div className="py-24 text-center">
          <Heart size={44} className="mx-auto text-rose-soft" />
          <p className="mt-4 font-serif text-2xl">Nothing saved yet</p>
          <p className="mt-1 text-muted">Tap the heart on any bag to save it here.</p>
          <Link href="/shop" className="btn btn-dark mt-6">Browse bags</Link>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
          {visible.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
