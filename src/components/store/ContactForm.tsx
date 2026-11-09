"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

export default function ContactForm() {
  const [f, setF] = useState({ name: "", email: "", phone: "", message: "" });
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("busy");
    setError(null);
    const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    if (res.ok) setState("done");
    else {
      setState("idle");
      setError((await res.json().catch(() => ({}))).error ?? "Could not send your message");
    }
  }

  if (state === "done") {
    return (
      <div className="card grid place-items-center p-12 text-center">
        <CheckCircle2 size={44} className="text-emerald-600" />
        <p className="mt-4 font-serif text-2xl">Message sent</p>
        <p className="mt-1 text-sm text-muted">Thank you! We'll get back to you within one working day.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-6 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="c-name">Name</label><input id="c-name" required className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div><label className="label" htmlFor="c-email">Email</label><input id="c-email" type="email" required className="input" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
      </div>
      <div><label className="label" htmlFor="c-phone">Phone (optional)</label><input id="c-phone" inputMode="tel" className="input" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
      <div><label className="label" htmlFor="c-msg">Message</label><textarea id="c-msg" required minLength={10} className="input min-h-36" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} /></div>
      {error && <p role="alert" className="rounded-xl bg-blush p-3 text-sm font-medium text-berry">{error}</p>}
      <button className="btn btn-dark" disabled={state === "busy"}>{state === "busy" ? "Sending…" : "Send message"}</button>
    </form>
  );
}
