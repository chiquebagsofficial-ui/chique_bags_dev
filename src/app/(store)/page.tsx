import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Leaf, RotateCcw, Truck, Wallet } from "lucide-react";
import { Instagram } from "@/components/icons";
import GiftSection from "@/components/store/GiftSection";
import HeroTriptych from "@/components/store/HeroTriptych";
import ProductCard from "@/components/store/ProductCard";
import { getCards, getNavCategories } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { formatINR } from "@/lib/utils";

export const dynamic = "force-dynamic";

function SectionHead({ eyebrow, title, href, cta }: { eyebrow: string; title: string; href?: string; cta?: string }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="h-display mt-2 text-3xl sm:text-4xl">{title}</h2>
      </div>
      {href && (
        <Link href={href} className="hidden items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:text-rose hover:underline sm:inline-flex">
          {cta} <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}

export default async function HomePage() {
  const [settings, categories, featured, bestsellers, arrivals, budget] = await Promise.all([
    getSettings(),
    getNavCategories(),
    getCards({ isFeatured: true }, 3, { createdAt: "desc" }),
    getCards({ isBestSeller: true }, 4, { createdAt: "desc" }),
    getCards({}, 4, { createdAt: "desc" }),
    getCards({ price: { lte: 999 } }, 1, { price: "asc" }),
  ]);
  const heroPicks = featured.length >= 3 ? featured : [...featured, ...bestsellers, ...arrivals].filter((p, i, a) => a.findIndex((x) => x.id === p.id) === i).slice(0, 3);
  const lookbook = [...bestsellers, ...arrivals].filter((p) => p.image).slice(0, 5);
  const budgetPick = budget[0];

  return (
    <>
      {/* Hero */}
      <section className="bg-blush">
        <div className="wrap grid items-center gap-8 py-10 sm:gap-10 sm:py-12 lg:grid-cols-2 lg:gap-16 lg:py-20">
          <div className="fade-up">
            <p className="eyebrow">New season collection</p>
            <h1 className="h-display mt-5 text-[2.7rem] sm:text-6xl lg:text-[4.4rem]">
              Carry elegance in <em className="text-rose">every stride</em>
            </h1>
            <p className="mt-6 max-w-md text-[1.02rem] leading-relaxed text-muted">
              Handcrafted sling and crossbody bags with soft structured shapes, gold-finish hardware and cruelty-free vegan leather.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/shop" className="btn btn-dark">Shop the collection</Link>
              <Link href="/shop?max=999" className="btn btn-line">Under {formatINR(999)}</Link>
            </div>
            <dl className="mt-12 hidden max-w-md grid-cols-3 gap-6 border-t border-rose-soft/60 pt-6 sm:grid">
              {[
                ["100%", "Vegan leather"],
                [formatINR(settings.freeShippingThreshold), "Free shipping"],
                ["7 days", "Easy exchange"],
              ].map(([v, l]) => (
                <div key={l}>
                  <dt className="font-serif text-xl font-semibold">{v}</dt>
                  <dd className="mt-0.5 text-xs text-muted">{l}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="min-w-0"><HeroTriptych products={heroPicks} /></div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="wrap py-16">
          <SectionHead eyebrow="Browse" title="Shop by style" href="/shop" cta="View all bags" />
          <div className="grid gap-4 sm:grid-cols-3">
            {categories.map((c) => (
              <Link key={c.id} href={`/shop?category=${c.slug}`} className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-cream sm:aspect-[3/4]">
                {c.image && <Image src={c.image} alt="" fill sizes="(min-width:640px) 33vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105" />}
                <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" />
                <span className="absolute inset-x-5 bottom-5 text-white">
                  <span className="block font-serif text-2xl">{c.name}</span>
                  <span className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest opacity-90">Shop now <ArrowRight size={14} className="transition group-hover:translate-x-1" /></span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Trust strip */}
      <section className="border-y border-line bg-cream">
        <div className="wrap grid grid-cols-2 gap-6 py-8 lg:grid-cols-4">
          {[
            [Leaf, "Cruelty-free", "Premium vegan leather"],
            [Truck, `Free shipping ${formatINR(settings.freeShippingThreshold)}+`, "Delivered in 3–5 days"],
            [RotateCcw, "Easy exchange", "7-day hassle-free policy"],
            [Wallet, "Pay your way", "UPI, cards, COD"],
          ].map(([Icon, t, s]) => {
            const I = Icon as typeof Leaf;
            return (
              <div key={t as string} className="flex items-start gap-3">
                <I size={22} className="mt-0.5 shrink-0 text-rose" />
                <div>
                  <p className="text-sm font-semibold">{t as string}</p>
                  <p className="text-xs text-muted">{s as string}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bestsellers */}
      {bestsellers.length > 0 && (
        <section className="wrap pt-20">
          <SectionHead eyebrow="Most loved" title="Bestsellers" href="/shop?sort=popular" cta="See all bestsellers" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
            {bestsellers.map((p, i) => <ProductCard key={p.id} product={p} priority={i < 2} />)}
          </div>
        </section>
      )}

      {/* Gifting */}
      {settings.giftBoxEnabled && <GiftSection image={settings.giftBoxImage} fee={settings.giftBoxFee} />}

      {/* Under 999 spotlight */}
      <section className="wrap py-20">
        <div className="grid overflow-hidden rounded-[2rem] bg-ink text-white lg:grid-cols-2">
          <div className="flex flex-col justify-center p-8 sm:p-14">
            <p className="eyebrow !text-rose-soft">Special curation</p>
            <h2 className="h-display mt-3 text-4xl sm:text-5xl">Sling bags under {formatINR(999)}</h2>
            <p className="mt-5 max-w-md leading-relaxed text-white/70">Luxury styling without the luxury price tag. Everyday crossbodies, mini slings and pastel essentials, all under {formatINR(999)}.</p>
            <Link href="/shop?max=999" className="btn mt-8 w-fit bg-rose-soft text-ink hover:bg-white">Shop under {formatINR(999)}</Link>
          </div>
          <div className="relative min-h-[320px]">
            {budgetPick?.image && <Image src={budgetPick.image} alt={budgetPick.name} fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />}
          </div>
        </div>
      </section>

      {/* New arrivals */}
      {arrivals.length > 0 && (
        <section className="wrap">
          <SectionHead eyebrow="Just in" title="New arrivals" href="/shop?sort=newest" cta="See what's new" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
            {arrivals.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* Story */}
      <section className="wrap py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">Our story</p>
          <h2 className="h-display mt-3 text-3xl sm:text-5xl">Made by hand, in small batches, with love</h2>
          <p className="mx-auto mt-6 max-w-2xl leading-relaxed text-muted">
            Chique Bags began on Instagram with a simple idea: everyday bags should feel special. Every piece is designed, stitched and finished by hand in India, in cruelty-free materials, so you can carry something you'll love for years.
          </p>
          <Link href="/about" className="btn btn-line mt-8">Read our story</Link>
        </div>
      </section>

      {/* Instagram */}
      {lookbook.length > 0 && (
        <section className="wrap">
          <div className="mb-8 text-center">
            <p className="eyebrow">@chiquebagsofficial</p>
            <h2 className="h-display mt-2 text-3xl sm:text-4xl">Styled by you</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {lookbook.map((p, i) => (
              <a key={p.id + i} href={settings.instagram} target="_blank" rel="noopener noreferrer" className="group relative aspect-square overflow-hidden rounded-2xl bg-cream">
                <Image src={p.image!} alt={`${p.name} on Instagram`} fill sizes="(min-width:1024px) 20vw, 50vw" className="object-cover transition duration-700 group-hover:scale-105" />
                <span className="absolute inset-0 grid place-items-center bg-ink/0 text-white opacity-0 transition group-hover:bg-ink/35 group-hover:opacity-100"><Instagram size={26} /></span>
              </a>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
