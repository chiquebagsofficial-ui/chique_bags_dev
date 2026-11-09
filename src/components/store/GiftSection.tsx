import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Gift, PenLine, ShoppingBag } from "lucide-react";
import { formatINR } from "@/lib/utils";

const STEPS = [
  { icon: ShoppingBag, title: "Choose any bag", text: "Every bag in the shop can be gifted." },
  { icon: Gift, title: "Tick “Add a gift box”", text: "At checkout, one tap adds our signature box, tissue and ribbon." },
  { icon: PenLine, title: "Write your note", text: "Your message is written on a card and tucked inside the box." },
];

export default function GiftSection({ image, fee, full = false }: { image: string; fee: number; full?: boolean }) {
  return (
    <section className={full ? "" : "wrap py-20"}>
      <div className={`grid overflow-hidden bg-[#fbeef2] ${full ? "" : "rounded-[2rem]"} lg:grid-cols-2`}>
        <div className="relative min-h-[300px] sm:min-h-[420px] lg:min-h-[560px]">
          {image ? (
            <Image src={image} alt="Chique Bags signature gift box with ribbon and note card" fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" priority={full} />
          ) : (
            <div className="absolute inset-0 grid place-items-center bg-rose-soft/40"><Gift size={64} className="text-rose" /></div>
          )}
        </div>
        <div className="flex flex-col justify-center p-7 sm:p-12 lg:p-16">
          <p className="eyebrow">Gifting</p>
          <h2 className="h-display mt-3 text-3xl sm:text-5xl">Make it a gift, in one tap</h2>
          <p className="mt-5 max-w-md leading-relaxed text-muted">
            Add our signature gift box and a handwritten note to <strong className="text-ink">any purchase</strong> for {fee > 0 ? formatINR(fee) : "free"}. We pack it, you just tell us what to write.
          </p>
          <ol className="mt-8 space-y-5">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-rose shadow-sm"><s.icon size={18} /></span>
                <span>
                  <span className="block text-sm font-semibold">{i + 1}. {s.title}</span>
                  <span className="text-sm text-muted">{s.text}</span>
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/shop" className="btn btn-dark">Choose a gift</Link>
            {!full && <Link href="/gifting" className="btn btn-line">How gifting works <ArrowRight size={15} /></Link>}
          </div>
        </div>
      </div>
    </section>
  );
}
