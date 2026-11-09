import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getCards } from "@/lib/catalog";

export const metadata: Metadata = { title: "About us", description: "The story behind Chique Bags: handcrafted, cruelty-free bags made in India." };
export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const [pick] = await getCards({ isFeatured: true }, 1);
  return (
    <>
      <section className="bg-blush">
        <div className="wrap grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <p className="eyebrow">Our story</p>
            <h1 className="h-display mt-3 text-4xl sm:text-6xl">Bags that feel as good as they look</h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">Chique Bags started as a small Instagram page with one belief: an everyday bag should feel special, without a luxury price tag.</p>
          </div>
          {pick?.image && <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-[2rem]"><Image src={pick.image} alt="A Chique Bags sling" fill sizes="448px" className="object-cover" /></div>}
        </div>
      </section>

      <section className="wrap max-w-3xl py-20">
        <div className="space-y-6 text-lg leading-relaxed text-muted">
          <p>Every Chique bag is designed and stitched by hand in small batches. We choose soft, structured shapes that sit comfortably, finish them with gold-tone hardware, and line them so they hold up to real life.</p>
          <p>We use premium vegan leather, so nothing we make involves animals. It's the same look and feel you'd expect, kinder to the world.</p>
          <p>Thank you for supporting a small, handmade brand. Behind every order is a real person packing it with care.</p>
        </div>
        <dl className="mt-14 grid gap-8 border-t border-line pt-10 sm:grid-cols-3">
          {[["Handcrafted", "Made by hand in India, in small batches"], ["Cruelty-free", "100% vegan leather, always"], ["Made to last", "Quality stitching and hardware"]].map(([t, d]) => (
            <div key={t}><dt className="font-serif text-2xl font-semibold">{t}</dt><dd className="mt-1 text-sm text-muted">{d}</dd></div>
          ))}
        </dl>
        <Link href="/shop" className="btn btn-dark mt-12">Shop the collection</Link>
      </section>
    </>
  );
}
