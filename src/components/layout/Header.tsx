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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setShopOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen || searchOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen, searchOpen]);

  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const iconBtn = "relative grid h-10 w-10 place-items-center transition hover:text-berry";

  return (
    <>
      {announcement && (
        <div className="announce bg-ink px-4 py-2.5 text-center text-[0.66rem] font-medium uppercase tracking-[0.28em] text-white/85">{announcement}</div>
      )}
      <header className={`sticky top-0 z-[100] bg-white/95 backdrop-blur transition-shadow ${scrolled ? "shadow-[0_1px_0_0_var(--color-line)]" : "border-b border-line"}`}>
        <div className="wrap grid h-[64px] grid-cols-[1fr_auto_1fr] items-center lg:h-[84px]">
          {/* left */}
          <div className="flex items-center">
            <button className="-ml-2 p-2 lg:hidden" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
              <Menu size={22} strokeWidth={1.5} />
            </button>
            <nav className="hidden items-center gap-9 lg:flex" aria-label="Main">
              <div className="relative" onMouseEnter={() => setShopOpen(true)} onMouseLeave={() => setShopOpen(false)}>
                <Link href="/shop" className="nav-link inline-flex items-center gap-1.5" data-active={active("/shop") || active("/products")}>
                  Shop <ChevronDown size={11} />
                </Link>
                {shopOpen && (
                  <div className="absolute left-0 top-full w-64 pt-4">
                    <div className="fade-up border border-line bg-white py-3 shadow-[0_24px_50px_-30px_rgba(0,0,0,0.35)]">
                      {[
                        ["/shop", "All bags"],
                        ["/shop?sort=popular", "Bestsellers"],
                        ["/shop?sort=newest", "New arrivals"],
                        ...categories.map((c) => [`/shop?category=${c.slug}`, c.name]),
                        ["/shop?max=999", `Under ${formatINR(999)}`],
                      ].map(([href, label]) => (
                        <Link key={href} href={href} className="block px-6 py-2.5 text-[0.8rem] tracking-wide transition hover:bg-blush hover:text-berry">{label}</Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <Link href="/gifting" className="nav-link" data-active={active("/gifting")}>Gifting</Link>
              <Link href="/about" className="nav-link" data-active={active("/about")}>Our story</Link>
            </nav>
          </div>

          {/* centre: wordmark */}
          <Link href="/" className="text-center" aria-label="Chique Bags home">
            <span className="font-serif text-[1.7rem] font-medium uppercase leading-none tracking-[0.32em] sm:text-[1.95rem]">Chique</span>
            <span className="mt-1 block text-[0.52rem] font-medium uppercase tracking-[0.62em] text-gold">Bags</span>
          </Link>

          {/* right */}
          <div className="flex items-center justify-end gap-0.5">
            <Link href="/contact" className="nav-link mr-5 hidden lg:inline-block" data-active={active("/contact")}>Contact</Link>
            <button className={iconBtn} aria-label="Search" onClick={() => setSearchOpen(true)}>
              <Search size={20} strokeWidth={1.5} />
            </button>
            <Link href="/wishlist" className={`${iconBtn} hidden sm:grid`} aria-label="Favourites">
              <Heart size={20} strokeWidth={1.5} />
              {wish.ids.length > 0 && <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-berry px-1 text-[0.58rem] font-medium text-white">{wish.ids.length}</span>}
            </Link>
            <Link href={user ? "/account" : "/login"} className={`${iconBtn} hidden sm:grid`} aria-label={user ? "Your account" : "Log in"}>
              <User size={20} strokeWidth={1.5} />
            </Link>
            <button className={iconBtn} aria-label={`Open bag, ${cart.count} items`} onClick={() => cart.setDrawerOpen(true)}>
              <ShoppingBag size={20} strokeWidth={1.5} />
              {cart.count > 0 && <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-ink px-1 text-[0.58rem] font-medium text-white">{cart.count}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <div className={`fixed inset-0 z-[200] lg:hidden ${menuOpen ? "" : "pointer-events-none"}`} aria-hidden={!menuOpen}>
        <div className={`absolute inset-0 bg-black/40 transition-opacity ${menuOpen ? "opacity-100" : "opacity-0"}`} onClick={() => setMenuOpen(false)} />
        <aside className={`absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-white transition-transform duration-300 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex h-[64px] items-center justify-between border-b border-line px-6">
            <span className="font-serif text-xl uppercase tracking-[0.3em]">Chique</span>
            <button aria-label="Close menu" onClick={() => setMenuOpen(false)}><X size={22} strokeWidth={1.5} /></button>
          </div>
          <nav className="flex-1 overflow-y-auto px-6 py-4">
            {[
              ["/", "Home", false],
              ["/shop", "Shop all", false],
              ...categories.map((c) => [`/shop?category=${c.slug}`, c.name, true] as const),
              ["/shop?sort=popular", "Bestsellers", false],
              ["/gifting", "Gifting", false],
              ["/about", "Our story", false],
              ["/wishlist", "Favourites", false],
              ["/contact", "Contact", false],
              ["/track", "Track an order", false],
            ].map(([href, label, sub]) => (
              <Link key={String(href) + label} href={String(href)} onClick={() => setMenuOpen(false)} className={`block border-b border-line py-4 ${sub ? "pl-5 text-[0.95rem] text-muted" : "font-serif text-[1.35rem]"}`}>
                {label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-line p-6">
            <Link href={user ? "/account" : "/login"} onClick={() => setMenuOpen(false)} className="btn btn-dark btn-block">{user ? `Hi, ${user.name.split(" ")[0]}` : "Log in / Sign up"}</Link>
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
      <div className="fade-up bg-white" onClick={(e) => e.stopPropagation()}>
        <div className="wrap max-w-3xl py-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (q.trim()) onSubmit(q.trim());
            }}
            className="flex items-center gap-4 border-b border-ink pb-4"
          >
            <Search size={20} strokeWidth={1.5} className="text-muted" />
            <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search bags, colours, styles" className="flex-1 font-serif text-2xl outline-none placeholder:text-muted/60" aria-label="Search products" />
            <button type="button" onClick={onClose} aria-label="Close search"><X size={22} strokeWidth={1.5} /></button>
          </form>
          {results.length > 0 ? (
            <ul className="mt-4 max-h-[50vh] overflow-y-auto">
              {results.map((r) => (
                <li key={r.slug}>
                  <Link href={`/products/${r.slug}`} className="flex items-center gap-4 p-2 hover:bg-blush">
                    <span className="relative h-16 w-12 bg-cream">{r.image && <Image src={r.image} alt="" fill sizes="48px" className="object-cover" />}</span>
                    <span className="flex-1 font-serif text-lg">{r.name}</span>
                    <span className="text-sm">{formatINR(r.price)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-5 flex flex-wrap items-center gap-2 pb-2">
              <span className="mr-1 text-xs uppercase tracking-[0.2em] text-muted">Popular</span>
              {["Crescent", "Quilted", "Chain", "Black", "Under 999"].map((t) => (
                <button key={t} type="button" className="chip" onClick={() => onSubmit(t === "Under 999" ? "under999" : t)}>{t}</button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
