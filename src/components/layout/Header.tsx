"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useAuth, useCart, useWishlist } from "@/components/providers";
import { formatINR } from "@/lib/utils";

type Cat = { id: string; name: string; slug: string };

export default function Header({ categories, announcement }: { categories: Cat[]; announcement: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const cart = useCart();
  const wish = useWishlist();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen || searchOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen, searchOpen]);

  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      {announcement && (
        <div className="announce bg-ink px-4 py-2.5 text-center text-[0.74rem] font-medium tracking-wide text-white/90">{announcement}</div>
      )}
      <header className="sticky top-0 z-[100] border-b border-line bg-white/95 backdrop-blur">
        <div className="wrap flex h-[68px] items-center justify-between gap-6 lg:h-[76px]">
          <button className="-ml-2 p-2 lg:hidden" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
            <Menu size={22} />
          </button>

          <Link href="/" className="font-serif text-[1.55rem] font-semibold tracking-wide max-lg:absolute max-lg:left-1/2 max-lg:-translate-x-1/2">
            Chique Bags
          </Link>

          <nav className="hidden items-center gap-9 lg:flex" aria-label="Main">
            <Link href="/" className="nav-link" data-active={active("/")}>Home</Link>
            <div className="relative" onMouseEnter={() => setShopOpen(true)} onMouseLeave={() => setShopOpen(false)}>
              <Link href="/shop" className="nav-link inline-flex items-center gap-1" data-active={active("/shop") || active("/products")}>
                Shop <ChevronDown size={12} />
              </Link>
              {shopOpen && (
                <div className="absolute left-1/2 top-full w-60 -translate-x-1/2 pt-3">
                  <div className="fade-up rounded-2xl border border-line bg-white p-2 shadow-xl">
                    <Link href="/shop" className="block rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-blush hover:text-rose">All bags</Link>
                    <Link href="/shop?sort=popular" className="block rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-blush hover:text-rose">Bestsellers</Link>
                    {categories.map((c) => (
                      <Link key={c.id} href={`/shop?category=${c.slug}`} className="block rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-blush hover:text-rose">
                        {c.name}
                      </Link>
                    ))}
                    <Link href="/shop?max=999" className="block rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-blush hover:text-rose">Under {formatINR(999)}</Link>
                  </div>
                </div>
              )}
            </div>
            <Link href="/gifting" className="nav-link" data-active={active("/gifting")}>Gifting</Link>
            <Link href="/about" className="nav-link" data-active={active("/about")}>About</Link>
            <Link href="/contact" className="nav-link" data-active={active("/contact")}>Contact</Link>
          </nav>

          <div className="flex items-center gap-1">
            <button className="grid h-10 w-10 place-items-center rounded-full hover:bg-blush" aria-label="Search" onClick={() => setSearchOpen(true)}>
              <Search size={20} />
            </button>
            <Link href="/wishlist" className="relative hidden h-10 w-10 place-items-center rounded-full hover:bg-blush sm:grid" aria-label="Favourites">
              <Heart size={20} />
              {wish.ids.length > 0 && <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose px-1 text-[0.62rem] font-bold text-white">{wish.ids.length}</span>}
            </Link>
            <Link href={user ? "/account" : "/login"} className="hidden h-10 w-10 place-items-center rounded-full hover:bg-blush sm:grid" aria-label={user ? "Your account" : "Log in"}>
              <User size={20} />
            </Link>
            <button className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-blush" aria-label={`Open bag, ${cart.count} items`} onClick={() => cart.setDrawerOpen(true)}>
              <ShoppingBag size={20} />
              {cart.count > 0 && <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-ink px-1 text-[0.62rem] font-bold text-white">{cart.count}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <div className={`fixed inset-0 z-[200] lg:hidden ${menuOpen ? "" : "pointer-events-none"}`} aria-hidden={!menuOpen}>
        <div className={`absolute inset-0 bg-black/40 transition-opacity ${menuOpen ? "opacity-100" : "opacity-0"}`} onClick={() => setMenuOpen(false)} />
        <aside className={`absolute inset-y-0 left-0 flex w-[84%] max-w-sm flex-col bg-white transition-transform duration-300 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex h-[68px] items-center justify-between border-b border-line px-5">
            <span className="font-serif text-xl font-semibold">Chique Bags</span>
            <button aria-label="Close menu" onClick={() => setMenuOpen(false)}><X size={22} /></button>
          </div>
          <nav className="flex-1 overflow-y-auto p-5 text-lg">
            {[
              ["/", "Home"],
              ["/shop", "Shop all"],
              ...categories.map((c) => [`/shop?category=${c.slug}`, c.name]),
              ["/shop?sort=popular", "Bestsellers"],
              ["/gifting", "Gifting"],
              ["/wishlist", "Favourites"],
              ["/about", "About us"],
              ["/contact", "Contact"],
              ["/track", "Track an order"],
            ].map(([href, label], i) => (
              <Link key={href + label} href={href} className={`block border-b border-line py-3.5 ${i >= 2 && i < 2 + categories.length ? "pl-4 text-base text-muted" : "font-medium"}`}>
                {label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-line p-5">
            <Link href={user ? "/account" : "/login"} className="btn btn-dark btn-block">{user ? `Hi, ${user.name.split(" ")[0]}` : "Log in / Sign up"}</Link>
          </div>
        </aside>
      </div>

      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} onSubmit={(q) => router.push(`/shop?q=${encodeURIComponent(q)}`)} />}
    </>
  );
}

function SearchOverlay({ onClose, onSubmit }: { onClose: () => void; onSubmit: (q: string) => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ slug: string; name: string; price: number; image: string | null }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q.trim())}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((d) => setResults(d.results ?? []))
        .catch(() => {});
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  return (
    <div className="fixed inset-0 z-[250] bg-black/40" onClick={onClose}>
      <div className="fade-up mx-auto mt-0 max-w-2xl rounded-b-3xl bg-white p-5 shadow-2xl sm:mt-16 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim()) onSubmit(q.trim());
          }}
          className="flex items-center gap-3 border-b border-line pb-4"
        >
          <Search size={20} className="text-muted" />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search crescent, quilted, chain, black…" className="flex-1 text-base outline-none" aria-label="Search products" />
          <button type="button" onClick={onClose} aria-label="Close search"><X size={20} /></button>
        </form>
        {results.length > 0 ? (
          <ul className="mt-3 max-h-[50vh] overflow-y-auto">
            {results.map((r) => (
              <li key={r.slug}>
                <Link href={`/products/${r.slug}`} className="flex items-center gap-4 rounded-xl p-2 hover:bg-blush">
                  <span className="relative h-14 w-12 overflow-hidden rounded-lg bg-cream">{r.image && <Image src={r.image} alt="" fill sizes="48px" className="object-cover" />}</span>
                  <span className="flex-1 text-sm font-medium">{r.name}</span>
                  <span className="text-sm font-semibold">{formatINR(r.price)}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted">Popular:</span>
            {["Crescent", "Quilted", "Chain", "Black", "Under 999"].map((t) => (
              <button key={t} type="button" className="chip" onClick={() => onSubmit(t === "Under 999" ? "under999" : t)}>{t}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
