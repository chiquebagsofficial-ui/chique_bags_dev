import Image from "next/image";
import Link from "next/link";
import { Hand, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import GiftSection from "@/components/store/GiftSection";
import HeroBanners from "@/components/store/HeroBanners";
import ProductCard from "@/components/store/ProductCard";
import { getCards, getNavCategories } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatINR } from "@/lib/utils";

export const dynamic = "force-dynamic";

function SectionHead({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-12 text-center">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="h-display mt-4 text-4xl sm:text-5xl">{title}</h2>
      <span className="rule" />
    </div>
  );
}

export default async function HomePage() {
  const [settings, categories, banners, bestsellers, arrivals] = await Promise.all([
    getSettings(),
    getNavCategories(),
    prisma.banner.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    getCards({ isBestSeller: true }, 4, { createdAt: "desc" }),
    getCards({}, 4, { createdAt: "desc" }),
  ]);

  return (
    <>
      {banners.length > 0 ? (
        <HeroBanners banners={banners} />
      ) : (
        <section className="bg-blush">
          <div className="wrap py-28 text-center">
            <p className="eyebrow">New season collection</p>
            <h1 className="h-display mt-5 text-5xl sm:text-7xl">Carry elegance in <em>every stride</em></h1>
            <Link href="/shop" className="btn btn-dark mt-10">Shop the collection</Link>
          </div>
        </section>
      )}

      {/* Promises */}
      <section className="border-b border-line">
        <div className="wrap grid grid-cols-2 lg:grid-cols-4">
          {[
            [Hand, "Handcrafted", "Made in small batches in India"],
            [Truck, "Free shipping", "On every order, 3 to 5 days"],
            [RotateCcw, "Easy returns", "Refund or exchange within 7 days"],
            [ShieldCheck, "Secure payment", "UPI, cards and net banking"],
          ].map(([Icon, t, s], i) => {
            const I = Icon as typeof Hand;
            return (
              <div key={t as string} className={`flex flex-col items-center px-3 py-7 text-center lg:py-9 ${i % 2 === 1 ? "border-l border-line" : ""} ${i > 1 ? "border-t border-line lg:border-t-0" : ""} ${i > 0 ? "lg:border-l lg:border-line" : ""}`}>
                <I size={22} strokeWidth={1.2} className="text-gold" />
                <p className="mt-3 text-[0.72rem] font-medium uppercase tracking-[0.2em]">{t as string}</p>
                <p className="mt-1 text-[0.82rem] text-muted">{s as string}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Collections */}
      {categories.length > 0 && (
        <section className="wrap pt-24">
          <SectionHead eyebrow="The collection" title="Shop by style" />
          <div className="grid gap-x-6 gap-y-12 sm:grid-cols-3">
            {categories.map((c) => (
              <Link key={c.id} href={`/shop?category=${c.slug}`} className="group block">
                <div className="relative aspect-[4/5] overflow-hidden bg-cream">
                  {c.image && <Image src={c.image} alt="" fill sizes="(min-width:640px) 33vw, 100vw" className="object-cover transition duration-[1200ms] ease-out group-hover:scale-[1.05]" />}
                </div>
                <div className="pt-5 text-center">
                  <h3 className="font-serif text-[1.8rem] leading-tight">{c.name}</h3>
                  {c.description && <p className="mx-auto mt-1.5 max-w-[26ch] text-[0.88rem] text-muted">{c.description}</p>}
                  <span className="link-u mt-3 inline-block text-[0.68rem] font-medium uppercase tracking-[0.24em]">Explore</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Bestsellers */}
      {bestsellers.length > 0 && (
        <section className="wrap pt-28">
          <SectionHead eyebrow="Most loved" title="Bestsellers" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-12 lg:grid-cols-4 lg:gap-x-7">
            {bestsellers.map((p, i) => <ProductCard key={p.id} product={p} priority={i < 2} />)}
          </div>
          <div className="mt-14 text-center"><Link href="/shop?sort=popular" className="btn btn-line">View all bestsellers</Link></div>
        </section>
      )}

      {/* Story */}
      <section className="mt-28 bg-cream">
        <div className="wrap grid items-center gap-12 py-20 lg:grid-cols-2 lg:gap-24 lg:py-28">
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="relative aspect-[4/5] overflow-hidden bg-line">
              {settings.storyImage && <Image src={settings.storyImage} alt="Women carrying Chique Bags leather bags" fill sizes="(min-width:1024px) 45vw, 90vw" className="object-cover" />}
            </div>
            <div className="pointer-events-none absolute -bottom-5 -right-5 hidden h-full w-full border border-gold/60 sm:block" aria-hidden />
          </div>
          <div>
            <p className="eyebrow">Our story</p>
            <h2 className="h-display mt-4 text-4xl sm:text-5xl lg:text-[3.6rem]">Made by hand, <em>in small batches</em></h2>
            <p className="mt-7 max-w-lg text-[1.02rem] leading-[1.85] text-muted">
              Chique Bags began on Instagram with a simple belief: an everyday bag should feel special. Each piece is designed, stitched and finished by hand in India, using cruelty-free materials and hardware that catches the light.
            </p>
            <p className="mt-4 max-w-lg text-[1.02rem] leading-[1.85] text-muted">
              No mass production, no shortcuts. Just bags made to be carried, loved and noticed.
            </p>
            <Link href="/about" className="btn btn-line mt-9">Read our story</Link>
          </div>
        </div>
      </section>

      {/* Gifting */}
      {settings.giftBoxEnabled && <GiftSection image={settings.giftBoxImage} fee={settings.giftBoxFee} />}

      {/* New arrivals */}
      {arrivals.length > 0 && (
        <section className="wrap pt-28">
          <SectionHead eyebrow="Just in" title="New arrivals" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-12 lg:grid-cols-4 lg:gap-x-7">
            {arrivals.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
          <div className="mt-14 text-center"><Link href="/shop?sort=newest" className="btn btn-line">Shop new arrivals</Link></div>
        </section>
      )}
    </>
  );
}
