"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Heart, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart, useToast, useWishlist } from "@/components/providers";
import { cn } from "@/lib/utils";

interface Props {
  product: { id: string; slug: string; name: string; price: number; mrp: number | null; image: string | null };
  variants: { id: string; name: string; hex: string; stock: number }[];
}

export default function ProductBuyBox({ product, variants }: Props) {
  const cart = useCart();
  const wish = useWishlist();
  const toast = useToast();
  const router = useRouter();
  const firstAvailable = variants.find((v) => v.stock > 0) ?? variants[0];
  const [variantId, setVariantId] = useState(firstAvailable?.id);
  const [qty, setQty] = useState(1);
  const variant = variants.find((v) => v.id === variantId);
  const soldOut = !variant || variant.stock === 0;
  const maxQty = Math.min(10, variant?.stock ?? 1);
  const saved = wish.has(product.id);

  function item() {
    return {
      variantId: variant!.id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      variantName: variant!.name,
      image: product.image,
      price: product.price,
      mrp: product.mrp ?? product.price,
    };
  }

  return (
    <div>
      <div>
        <p className="mb-3 text-sm">
          <span className="font-semibold">Colour:</span> <span className="text-muted">{variant?.name}</span>
        </p>
        <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Colour">
          {variants.map((v) => (
            <button
              key={v.id}
              type="button"
              role="radio"
              aria-checked={v.id === variantId}
              aria-label={`${v.name}${v.stock === 0 ? " (sold out)" : ""}`}
              onClick={() => {
                setVariantId(v.id);
                setQty(1);
              }}
              className={cn("relative grid h-11 w-11 place-items-center rounded-full border-2 transition", v.id === variantId ? "border-ink" : "border-transparent hover:border-rose-soft")}
            >
              <span className={cn("h-8 w-8 rounded-full border border-black/10", v.stock === 0 && "opacity-40")} style={{ background: v.hex }} />
              {v.stock === 0 && <span className="absolute h-px w-9 rotate-45 bg-ink/60" />}
            </button>
          ))}
        </div>
        {variant && variant.stock > 0 && variant.stock <= 5 && <p className="mt-3 text-sm font-medium text-berry">Only {variant.stock} left in this colour</p>}
        {soldOut && <p className="mt-3 text-sm font-medium text-berry">This colour is sold out. Try another one.</p>}
      </div>

      <div className="mt-7 flex items-center gap-3">
        <div className="flex items-center rounded-full border-[1.5px] border-[#e7e0dc]">
          <button type="button" className="grid h-12 w-11 place-items-center disabled:opacity-40" aria-label="Decrease quantity" disabled={qty <= 1} onClick={() => setQty(qty - 1)}><Minus size={16} /></button>
          <span className="w-8 text-center font-semibold" aria-live="polite">{qty}</span>
          <button type="button" className="grid h-12 w-11 place-items-center disabled:opacity-40" aria-label="Increase quantity" disabled={qty >= maxQty} onClick={() => setQty(qty + 1)}><Plus size={16} /></button>
        </div>
        <button
          type="button"
          disabled={soldOut}
          onClick={() => {
            cart.add(item(), qty);
            toast("Added to your bag");
          }}
          className="btn btn-dark flex-1 !py-3.5"
        >
          <ShoppingBag size={17} /> {soldOut ? "Sold out" : "Add to bag"}
        </button>
        <button
          type="button"
          onClick={() => wish.toggle(product.id)}
          aria-pressed={saved}
          aria-label={saved ? "Remove from favourites" : "Save to favourites"}
          className="grid h-[50px] w-[50px] shrink-0 place-items-center rounded-full border-[1.5px] border-[#e7e0dc] transition hover:border-rose"
        >
          <Heart size={19} className={cn(saved ? "fill-rose text-rose" : "")} />
        </button>
      </div>
      <button
        type="button"
        disabled={soldOut}
        onClick={() => {
          cart.add(item(), qty, false);
          router.push("/checkout");
        }}
        className="btn btn-line btn-block mt-3"
      >
        Buy it now
      </button>
    </div>
  );
}
