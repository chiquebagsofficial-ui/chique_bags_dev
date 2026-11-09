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
    <form onSubmit={submit} className="mx-auto flex w-full max-w-lg border-b border-ink focus-within:border-berry">
      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email address" aria-label="Email address" className="min-w-0 flex-1 bg-transparent py-3.5 text-[0.95rem] outline-none placeholder:text-muted/70" />
      <button disabled={busy} className="px-2 text-[0.7rem] font-medium uppercase tracking-[0.22em] transition hover:text-berry disabled:opacity-60">Subscribe</button>
    </form>
  );
}
