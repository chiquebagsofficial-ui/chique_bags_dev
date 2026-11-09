"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, ShoppingBag, Store, User } from "lucide-react";
import { useAuth, useCart, useWishlist } from "@/components/providers";

export default function MobileTabBar() {
  const pathname = usePathname();
  const cart = useCart();
  const wish = useWishlist();
  const { user } = useAuth();
  if (pathname.startsWith("/checkout")) return null;

  const tab = "relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[0.65rem] font-semibold uppercase tracking-wider";
  const on = (p: string) => (p === "/" ? pathname === "/" : pathname.startsWith(p));
  return (
    <nav aria-label="Quick navigation" className="fixed inset-x-0 bottom-0 z-[90] flex border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <Link href="/" className={`${tab} ${on("/") ? "text-rose" : "text-muted"}`}><Home size={20} />Home</Link>
      <Link href="/shop" className={`${tab} ${on("/shop") ? "text-rose" : "text-muted"}`}><Store size={20} />Shop</Link>
      <Link href="/wishlist" className={`${tab} ${on("/wishlist") ? "text-rose" : "text-muted"}`}>
        <span className="relative"><Heart size={20} />{wish.ids.length > 0 && <i className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose px-1 text-[0.6rem] not-italic text-white">{wish.ids.length}</i>}</span>
        Saved
      </Link>
      <Link href={user ? "/account" : "/login"} className={`${tab} ${on("/account") || on("/login") ? "text-rose" : "text-muted"}`}><User size={20} />{user ? "Account" : "Log in"}</Link>
      <button onClick={() => cart.setDrawerOpen(true)} className={`${tab} text-muted`}>
        <span className="relative"><ShoppingBag size={20} />{cart.count > 0 && <i className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-ink px-1 text-[0.6rem] not-italic text-white">{cart.count}</i>}</span>
        Bag
      </button>
    </nav>
  );
}
