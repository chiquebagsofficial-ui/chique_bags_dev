"use client";

import { useState } from "react";
import { useToast } from "@/components/providers";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }).catch(() => null);
    setBusy(false);
    if (res?.ok) {
      toast("You're on the list. Thank you!");
      setEmail("");
    } else {
      const data = await res?.json().catch(() => null);
      toast(data?.error ?? "Something went wrong. Try again.");
    }
  }

  return (
    <form onSubmit={submit} className="flex overflow-hidden rounded-full border border-white/20 bg-white/5 focus-within:border-rose-soft">
      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email address" aria-label="Email address" className="min-w-0 flex-1 bg-transparent px-5 py-3 text-sm text-white outline-none placeholder:text-white/40" />
      <button disabled={busy} className="bg-rose-soft px-6 text-xs font-bold uppercase tracking-wider text-ink transition hover:bg-white disabled:opacity-60">Join</button>
    </form>
  );
}
