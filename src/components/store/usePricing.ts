"use client";

import { useEffect, useState } from "react";
import type { CartItem } from "@/components/providers";

export interface Pricing {
  subtotal: number;
  mrpTotal: number;
  discount: number;
  shipping: number;
  codFee: number;
  total: number;
  couponCode: string | null;
  couponError: string | null;
  freeShippingThreshold: number;
  lines: { variantId: string; price: number; mrp: number; quantity: number; stock: number }[];
}

/** Asks the server for the real totals (prices, coupon, shipping) whenever the bag changes. */
export function usePricing(items: CartItem[], couponCode: string | null, method?: "COD" | "ONLINE", enabled = true) {
  const [data, setData] = useState<Pricing | null>(null);
  const [error, setError] = useState<{ message: string; variantId?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const key = JSON.stringify(items.map((i) => [i.variantId, i.quantity]));

  useEffect(() => {
    if (!enabled || items.length === 0) {
      setData(null);
      setError(null);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    fetch("/api/cart/price", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })), couponCode, method }),
      signal: ctrl.signal,
    })
      .then(async (res) => {
        const body = await res.json();
        if (res.ok) {
          setData(body);
          setError(null);
        } else {
          setData(null);
          setError({ message: body.error ?? "Could not load your totals", variantId: body.variantId });
        }
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError({ message: "Could not load your totals. Check your connection." });
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, couponCode, method, enabled]);

  return { data, error, loading };
}
