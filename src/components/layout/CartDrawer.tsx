"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCart } from "@/components/providers";
import { formatINR } from "@/lib/utils";

export default function CartDrawer({ freeShippingThreshold }: { freeShippingThreshold: number }) {
  const cart = useCart();
  const open = cart.drawerOpen;
  const remaining = Math.max(0, freeShippingThreshold - cart.subtotal);
  const progress = freeShippingThreshold > 0 ? Math.min(100, (cart.subtotal / freeShippingThreshold) * 100) : 100;

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && cart.setDrawerOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, cart]);

  return (
    <div className={`fixed inset-0 z-[220] ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`} onClick={() => cart.setDrawerOpen(false)} />
      <aside
        role="dialog"
        aria-label="Your bag"
        className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <h2 className="font-serif text-xl font-semibold">Your bag ({cart.count})</h2>
          <button onClick={() => cart.setDrawerOpen(false)} aria-label="Close bag"><X size={22} /></button>
        </div>

        {cart.items.length > 0 && (
          <div className="border-b border-line bg-blush px-6 py-3.5 text-sm">
            {remaining > 0 ? (
              <p>Add <strong>{formatINR(remaining)}</strong> more for <strong>free shipping</strong></p>
            ) : (
              <p className="font-medium text-berry">You've unlocked free shipping</p>
            )}
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-rose transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6">
          {cart.items.length === 0 ? (
            <div className="grid h-full place-items-center text-center">
              <div>
                <ShoppingBag size={40} className="mx-auto text-rose-soft" />
                <p className="mt-4 font-serif text-xl">Your bag is empty</p>
                <p className="mt-1 text-sm text-muted">Find something you'll carry everywhere.</p>
                <Link href="/shop" onClick={() => cart.setDrawerOpen(false)} className="btn btn-dark mt-6">Shop bags</Link>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {cart.items.map((i) => (
                <li key={i.variantId} className="flex gap-4 py-5">
                  <Link href={`/products/${i.slug}`} onClick={() => cart.setDrawerOpen(false)} className="relative h-24 w-20 shrink-0 overflow-hidden rounded-sm bg-cream">
                    {i.image && <Image src={i.image} alt={i.name} fill sizes="80px" className="object-cover" />}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link href={`/products/${i.slug}`} onClick={() => cart.setDrawerOpen(false)} className="line-clamp-2 text-sm font-medium leading-snug">{i.name}</Link>
                    <p className="mt-0.5 text-xs text-muted">{i.variantName}</p>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center rounded-none border border-[#e7e0dc]">
                        <button className="grid h-8 w-8 place-items-center" aria-label="Decrease quantity" onClick={() => (i.quantity > 1 ? cart.setQty(i.variantId, i.quantity - 1) : cart.remove(i.variantId))}><Minus size={14} /></button>
                        <span className="w-6 text-center text-sm font-semibold">{i.quantity}</span>
                        <button className="grid h-8 w-8 place-items-center" aria-label="Increase quantity" onClick={() => cart.setQty(i.variantId, i.quantity + 1)}><Plus size={14} /></button>
                      </div>
                      <span className="text-sm font-semibold">{formatINR(i.price * i.quantity)}</span>
                    </div>
                  </div>
                  <button aria-label={`Remove ${i.name}`} onClick={() => cart.remove(i.variantId)} className="self-start text-muted hover:text-berry"><Trash2 size={16} /></button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {cart.items.length > 0 && (
          <div className="border-t border-line p-6">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted">Subtotal</span>
              <span className="text-lg font-semibold">{formatINR(cart.subtotal)}</span>
            </div>
            <p className="mb-4 mt-1 text-xs text-muted">Shipping and coupons are applied at checkout.</p>
            <Link href="/checkout" onClick={() => cart.setDrawerOpen(false)} className="btn btn-dark btn-block">Checkout</Link>
            <Link href="/cart" onClick={() => cart.setDrawerOpen(false)} className="mt-3 block text-center text-sm font-medium underline underline-offset-4">View full bag</Link>
          </div>
        )}
      </aside>
    </div>
  );
}
