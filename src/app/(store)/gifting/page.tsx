import Link from "next/link";
import type { Metadata } from "next";
import GiftSection from "@/components/store/GiftSection";
import ProductCard from "@/components/store/ProductCard";
import { getCards } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { formatINR } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Gifting",
  description: "Add a Chique Bags gift box and a handwritten note to any purchase.",
};
export const dynamic = "force-dynamic";

export default async function GiftingPage() {
  const [s, picks] = await Promise.all([getSettings(), getCards({ OR: [{ isBestSeller: true }, { isFeatured: true }] }, 4)]);
  const faqs = [
    ["Can I add a gift box to any bag?", "Yes. Every bag in the shop can be gift-wrapped. Tick “Add a gift box” at checkout."],
    ["How much does it cost?", s.giftBoxFee > 0 ? `The gift box and note card are ${formatINR(s.giftBoxFee)} per order, however many bags are in it.` : "The gift box and note card are free."],
    ["What goes on the note card?", "Anything up to 200 characters. We write it by hand and place it inside the box. The price is never shown."],
    ["Can you send it straight to the person I'm gifting?", "Yes. Enter their address as the delivery address at checkout. The invoice isn't placed inside the box."],
  ];

  return (
    <>
      <div className="bg-blush">
        <div className="wrap py-14 text-center lg:py-20">
          <p className="eyebrow">Gifting</p>
          <h1 className="h-display mx-auto mt-3 max-w-3xl text-4xl sm:text-6xl">The bag is the gift. We take care of the rest.</h1>
        </div>
      </div>

      {s.giftBoxEnabled ? <GiftSection image={s.giftBoxImage} fee={s.giftBoxFee} full /> : <p className="wrap py-16 text-center text-muted">Gift boxes are unavailable at the moment.</p>}

      {picks.length > 0 && (
        <section className="wrap pt-20">
          <div className="mb-8 text-center">
            <p className="eyebrow">Gift ideas</p>
            <h2 className="h-display mt-2 text-3xl sm:text-4xl">Most gifted bags</h2>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
            {picks.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
          <div className="mt-10 text-center"><Link href="/shop" className="btn btn-line">See all bags</Link></div>
        </section>
      )}

      <section className="wrap max-w-3xl py-20">
        <h2 className="h-display text-center text-3xl">Good to know</h2>
        <div className="mt-8 divide-y divide-line border-y border-line">
          {faqs.map(([q, a]) => (
            <details key={q} className="group py-4">
              <summary className="cursor-pointer list-none font-semibold marker:content-none">{q}</summary>
              <p className="mt-2 text-sm leading-relaxed text-muted">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
