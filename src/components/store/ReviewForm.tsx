"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Star } from "lucide-react";
import { useToast } from "@/components/providers";

export default function ReviewForm({ productId }: { productId: string }) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch(`/api/products/${productId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, title: title || undefined, comment: comment || undefined }),
    });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      toast("Thanks for your review!");
      router.refresh();
    } else toast(data.error ?? "Could not save your review");
  }

  return (
    <form onSubmit={submit} className="card mt-6 space-y-4 p-5">
      <p className="font-semibold">Write a review</p>
      <div className="flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} stars`} onClick={() => setRating(n)}>
            <Star size={26} className={n <= rating ? "fill-gold text-gold" : "text-[#d6cfca]"} />
          </button>
        ))}
      </div>
      <input className="input" placeholder="Headline (optional)" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} />
      <textarea className="input min-h-24" placeholder="What did you love about it?" value={comment} maxLength={1000} onChange={(e) => setComment(e.target.value)} />
      <button disabled={busy} className="btn btn-dark btn-sm">{busy ? "Saving…" : "Submit review"}</button>
    </form>
  );
}
