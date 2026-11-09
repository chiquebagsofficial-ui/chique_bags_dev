"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  if (images.length === 0) return <div className="aspect-[4/5] rounded-3xl bg-cream" />;
  return (
    <div className="flex flex-col-reverse gap-4 lg:flex-row">
      {images.length > 1 && (
        <div className="no-scrollbar flex gap-3 overflow-x-auto lg:max-h-[640px] lg:w-20 lg:shrink-0 lg:flex-col lg:overflow-y-auto">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === active}
              className={cn("relative aspect-[4/5] w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-cream transition lg:w-full", i === active ? "border-ink" : "border-transparent opacity-70 hover:opacity-100")}
            >
              <Image src={src} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
      <div className="relative aspect-[4/5] flex-1 overflow-hidden rounded-3xl bg-cream">
        <Image key={images[active]} src={images[active]} alt={`${name}, photo ${active + 1}`} fill priority sizes="(min-width:1024px) 50vw, 100vw" className="fade-up object-cover" />
      </div>
    </div>
  );
}
