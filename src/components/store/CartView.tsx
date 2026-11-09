"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/components/providers";
import CouponBox from "@/components/store/CouponBox";
import PriceSummary from "@/components/store/PriceSummary";
import { usePricing } from "@/components/store/usePricing";
import { formatINR } from "@/lib/utils";

export default function CartView() {
  const cart = useCart();
  const [coupon, setCoupon] = useState<string | null>(null);
  const { data, error } = usePricing(cart.items, coupon);

  if (!cart.ready) return <div className="wrap min-h-[50vh] py-20" />;

  if (cart.items.length === 0) {
    return (
      <div className="wrap py-28 text-center">
        <ShoppingBag size={44} className="mx-auto text-rose-soft" />
        <h1 className="h-display mt-5 text-4xl">Your bag is empty</h1>
        <p className="mt-2 text-muted">Looks like you haven't picked your favourite yet.</p>
        <Link href="/shop" className="btn btn-dark mt-8">Start shopping</Link>
      </div>
    );
  }

  return (
    <div className="wrap py-10 lg:py-14">
      <h1 className="h-display mb-8 text-4xl">Your bag</h1>
      <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
        <ul className="divide-y divide-line border-y border-line">
          {cart.items.map((i) => {
            const line = data?.lines.find((l) => l.variantId === i.variantId);
            const price = line?.price ?? i.price;
            const mrp = line?.mrp ?? i.mrp;
            const problem = error?.variantId === i.variantId;
            return (
              <li key={i.variantId} className="flex gap-5 py-6">
                <Link href={`/products/${i.slug}`} className="relative h-32 w-24 shrink-0 overflow-hidden rounded-xl bg-cream">
                  {i.image && <Image src={i.image} alt={i.name} fill sizes="96px" className="object-cover" />}
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex justify-between gap-3">
                    <div>
                      <Link href={`/products/${i.slug}`} className="font-medium hover:text-rose">{i.name}</Link>
                      <p className="mt-0.5 text-sm text-muted">{i.variantName}</p>
                    </div>
                    <button aria-label={`Remove ${i.name}`} onClick={() => cart.remove(i.variantId)} className="self-start text-muted hover:text-berry"><Trash2 size={18} /></button>
                  </div>
                  {problem && <p className="mt-2 text-sm font-medium text-berry">{error?.message}</p>}
                  <div className="mt-auto flex items-end justify-between pt-3">
                    <div className="flex items-center rounded-full border-[1.5px] border-[#e7e0dc]">
                      <button className="grid h-9 w-9 place-items-center" aria-label="Decrease quantity" onClick={() => (i.quantity > 1 ? cart.setQty(i.variantId, i.quantity - 1) : cart.remove(i.variantId))}><Minus size={14} /></button>
                      <span className="w-7 text-center text-sm font-semibold">{i.quantity}</span>
                      <button className="grid h-9 w-9 place-items-center" aria-label="Increase quantity" onClick={() => cart.setQty(i.variantId, i.quantity + 1)}><Plus size={14} /></button>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatINR(price * i.quantity)}</p>
                      {mrp > price && <p className="text-xs text-muted line-through">{formatINR(mrp * i.quantity)}</p>}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <aside className="card h-fit space-y-6 p-6 lg:sticky lg:top-28">
          <h2 className="font-serif text-xl font-semibold">Order summary</h2>
          <CouponBox applied={data?.couponCode ?? null} error={data?.couponError ?? null} onApply={setCoupon} onRemove={() => setCoupon(null)} />
          {data ? <PriceSummary p={data} /> : error && !error.variantId ? <p className="text-sm text-berry">{error.message}</p> : <p className="text-sm text-muted">Calculating…</p>}
          {error?.variantId && <p className="rounded-xl bg-blush p-3 text-sm font-medium text-berry">{error.message}</p>}
          {data && data.shipping > 0 && <p className="text-xs text-muted">Add {formatINR(data.freeShippingThreshold - data.subtotal)} more for free shipping.</p>}
          <Link href="/checkout" aria-disabled={Boolean(error)} className={`btn btn-dark btn-block ${error ? "pointer-events-none opacity-50" : ""}`}>Proceed to checkout</Link>
          <Link href="/shop" className="block text-center text-sm font-medium underline underline-offset-4">Continue shopping</Link>
        </aside>
      </div>
    </div>
  );
}
