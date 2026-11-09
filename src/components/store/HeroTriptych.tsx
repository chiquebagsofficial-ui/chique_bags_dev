import Image from "next/image";
import Link from "next/link";
import type { ProductCardData } from "@/lib/catalog";
import { formatINR } from "@/lib/utils";

/** Three tall product photos side by side. The centre one sits higher. */
export default function HeroTriptych({ products }: { products: ProductCardData[] }) {
  const items = products.filter((p) => p.image).slice(0, 3);
  if (items.length === 0) return null;
  return (
    <div className="grid grid-cols-3 gap-2.5 pb-6 sm:gap-4 sm:pb-10" aria-label="Featured bags">
      {items.map((p, i) => (
        <Link
          key={p.id}
          href={`/products/${p.slug}`}
          className={`group relative block aspect-[3/5] overflow-hidden rounded-[1.1rem] bg-white shadow-[0_24px_50px_-28px_rgba(184,67,110,0.5)] sm:rounded-[1.6rem] ${
            i === 1 ? "-translate-y-3 sm:-translate-y-8" : "translate-y-3 sm:translate-y-8"
          }`}
        >
          <Image
            src={p.image!}
            alt={p.name}
            fill
            priority
            sizes="(min-width:1024px) 190px, 30vw"
            className="object-cover transition duration-700 group-hover:scale-105"
          />
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2.5 pt-10 text-white sm:p-4 sm:pt-14">
            <span className="line-clamp-2 block text-[0.68rem] font-semibold leading-tight sm:text-sm">{p.name}</span>
            <span className="mt-0.5 block text-[0.68rem] opacity-90 sm:text-xs">{formatINR(p.price)}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}
