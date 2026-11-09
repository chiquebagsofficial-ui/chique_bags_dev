import Image from "next/image";
import Link from "next/link";
import { formatINR } from "@/lib/utils";

const STEPS = [
  ["01", "Choose any bag", "Every bag in the shop can be gifted."],
  ["02", "Add a gift box", "Tick one box at checkout for our signature box and ribbon."],
  ["03", "Write your note", "Your message goes on a card tucked inside the box."],
];

export default function GiftSection({ image, fee, full = false }: { image: string; fee: number; full?: boolean }) {
  return (
    <section className={full ? "" : "bg-blush"}>
      <div className={`grid ${full ? "" : "wrap !px-0 lg:!px-0"} lg:grid-cols-2`}>
        <div className="relative min-h-[340px] sm:min-h-[460px] lg:min-h-[620px]">
          {image && <Image src={image} alt="A gift box tied with a pink ribbon" fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" priority={full} />}
        </div>
        <div className="flex flex-col justify-center bg-blush px-6 py-14 sm:px-14 lg:px-20 lg:py-20">
          <p className="eyebrow">Gifting</p>
          <h2 className="h-display mt-4 text-4xl sm:text-5xl lg:text-[3.4rem]">Make it a gift, <em>in one tap</em></h2>
          <p className="mt-6 max-w-md leading-relaxed text-muted">
            Add our signature gift box and a handwritten note to <span className="text-ink">any purchase</span> for {fee > 0 ? formatINR(fee) : "free"}. We pack it beautifully, you just tell us what to write.
          </p>
          <ol className="mt-9 divide-y divide-rose-soft/50 border-y border-rose-soft/50">
            {STEPS.map(([n, t, d]) => (
              <li key={n} className="flex gap-5 py-4">
                <span className="font-serif text-2xl text-gold">{n}</span>
                <span>
                  <span className="block text-[0.95rem] font-medium">{t}</span>
                  <span className="text-[0.88rem] text-muted">{d}</span>
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/shop" className="btn btn-dark">Choose a gift</Link>
            {!full && <Link href="/gifting" className="btn btn-line">How it works</Link>}
          </div>
        </div>
      </div>
    </section>
  );
}
