"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Check } from "lucide-react";

// ─── Toast ──────────────────────────────────────────────────────────────

const ToastCtx = createContext<(msg: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

// ─── Auth (value comes from the server layout) ─────────────────────────

export type ClientUser = { id: string; name: string; email: string; phone: string | null } | null;
const AuthCtx = createContext<{ user: ClientUser }>({ user: null });
export const useAuth = () => useContext(AuthCtx);

// ─── Cart (kept on the customer's device; the server re-prices everything) ──

export interface CartItem {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  variantName: string;
  image: string | null;
  price: number;
  mrp: number;
  quantity: number;
}

interface CartApi {
  items: CartItem[];
  count: number;
  subtotal: number;
  ready: boolean;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  add: (item: Omit<CartItem, "quantity">, qty?: number, openDrawer?: boolean) => void;
  setQty: (variantId: string, qty: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
}

const CartCtx = createContext<CartApi | null>(null);
export function useCart(): CartApi {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error("useCart must be used inside <Providers>");
  return ctx;
}

const CART_KEY = "chique_cart_v1";
const WISH_KEY = "chique_wishlist_v1";
const MAX_QTY = 10;

// ─── Wishlist ───────────────────────────────────────────────────────────

interface WishApi {
  ids: string[];
  has: (id: string) => boolean;
  toggle: (id: string) => void;
}
const WishCtx = createContext<WishApi>({ ids: [], has: () => false, toggle: () => {} });
export const useWishlist = () => useContext(WishCtx);

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeLocal(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable (private mode): the bag still works for this visit */
  }
}

export default function Providers({ user, children }: { user: ClientUser; children: React.ReactNode }) {
  // Toast
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const show = useCallback((msg: string) => {
    setToast(msg);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 2800);
  }, []);

  // Cart
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setItems(readLocal<CartItem[]>(CART_KEY, []));
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) writeLocal(CART_KEY, items);
  }, [items, ready]);
  // Keep tabs in sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === CART_KEY) setItems(readLocal<CartItem[]>(CART_KEY, []));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const cart = useMemo<CartApi>(
    () => ({
      items,
      count: items.reduce((n, i) => n + i.quantity, 0),
      subtotal: items.reduce((n, i) => n + i.price * i.quantity, 0),
      ready,
      drawerOpen,
      setDrawerOpen,
      add: (item, qty = 1, openDrawer = true) => {
        setItems((prev) => {
          const found = prev.find((p) => p.variantId === item.variantId);
          if (found) return prev.map((p) => (p.variantId === item.variantId ? { ...p, ...item, quantity: Math.min(MAX_QTY, p.quantity + qty) } : p));
          return [...prev, { ...item, quantity: Math.min(MAX_QTY, qty) }];
        });
        if (openDrawer) setDrawerOpen(true);
      },
      setQty: (variantId, qty) =>
        setItems((prev) => prev.map((p) => (p.variantId === variantId ? { ...p, quantity: Math.max(1, Math.min(MAX_QTY, qty)) } : p))),
      remove: (variantId) => setItems((prev) => prev.filter((p) => p.variantId !== variantId)),
      clear: () => setItems([]),
    }),
    [items, ready, drawerOpen]
  );

  // Wishlist: saved on the account when logged in, on the device otherwise.
  const [wish, setWish] = useState<string[]>([]);
  useEffect(() => {
    const local = readLocal<string[]>(WISH_KEY, []);
    if (!user) {
      setWish(local);
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ merge: local }),
        });
        const data = await res.json();
        setWish(data.ids ?? []);
        if (local.length) writeLocal(WISH_KEY, []);
      } catch {
        setWish(local);
      }
    })();
  }, [user]);

  const wishApi = useMemo<WishApi>(
    () => ({
      ids: wish,
      has: (id) => wish.includes(id),
      toggle: (id) => {
        const on = !wish.includes(id);
        const next = on ? [...wish, id] : wish.filter((x) => x !== id);
        setWish(next);
        show(on ? "Saved to your favourites" : "Removed from favourites");
        if (user) {
          fetch("/api/wishlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId: id, on }),
          }).catch(() => {});
        } else {
          writeLocal(WISH_KEY, next);
        }
      },
    }),
    [wish, user, show]
  );

  return (
    <AuthCtx.Provider value={{ user }}>
      <ToastCtx.Provider value={show}>
        <CartCtx.Provider value={cart}>
          <WishCtx.Provider value={wishApi}>
            {children}
            <div
              role="status"
              aria-live="polite"
              className={`pointer-events-none fixed bottom-24 left-1/2 z-[300] -translate-x-1/2 transition-all duration-300 lg:bottom-8 ${
                toast ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
              }`}
            >
              <div className="flex items-center gap-2 rounded-none bg-ink px-5 py-3 text-sm font-medium text-white shadow-xl">
                <Check size={16} className="text-rose-soft" />
                {toast}
              </div>
            </div>
          </WishCtx.Provider>
        </CartCtx.Provider>
      </ToastCtx.Provider>
    </AuthCtx.Provider>
  );
}
