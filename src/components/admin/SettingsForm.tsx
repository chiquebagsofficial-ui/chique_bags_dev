"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Settings } from "@/lib/settings";

export default function SettingsForm({ initial }: { initial: Settings }) {
  const router = useRouter();
  const [s, setS] = useState(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const str = (k: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement>) => setS({ ...s, [k]: e.target.value });
  const numf = (k: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement>) => setS({ ...s, [k]: Number(e.target.value) || 0 });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s) });
    setBusy(false);
    if (res.ok) {
      setMsg({ ok: true, text: "Settings saved" });
      router.refresh();
    } else setMsg({ ok: false, text: (await res.json().catch(() => ({}))).error ?? "Could not save" });
  }

  const sec = "card grid gap-4 p-6 sm:grid-cols-2";
  return (
    <form onSubmit={save} className="max-w-3xl space-y-6">
      <section className={sec}>
        <h2 className="font-serif text-lg font-semibold sm:col-span-2">Storefront</h2>
        <div className="sm:col-span-2"><label className="label" htmlFor="s-story">Our story photo link (homepage)</label><input id="s-story" className="input" placeholder="https://…" value={s.storyImage} onChange={str("storyImage")} /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="s-ann">Announcement bar text (leave empty to hide)</label><input id="s-ann" className="input" value={s.announcement} onChange={str("announcement")} /></div>
      </section>
      <section className={sec}>
        <h2 className="font-serif text-lg font-semibold sm:col-span-2">GST invoice details</h2>
        <div><label className="label" htmlFor="s-legal">Business name on invoices</label><input id="s-legal" className="input" value={s.legalName} onChange={str("legalName")} /></div>
        <div><label className="label" htmlFor="s-gstin">GSTIN</label><input id="s-gstin" className="input uppercase" maxLength={15} placeholder="22AAAAA0000A1Z5" value={s.gstin} onChange={str("gstin")} /></div>
        <div><label className="label" htmlFor="s-state">Business state</label><input id="s-state" className="input" placeholder="Maharashtra" value={s.businessState} onChange={str("businessState")} /></div>
        <div><label className="label" htmlFor="s-hsn">HSN code</label><input id="s-hsn" className="input" value={s.hsnCode} onChange={str("hsnCode")} /></div>
        <div><label className="label" htmlFor="s-rate">GST rate (%)</label><input id="s-rate" type="number" min={0} max={40} step="0.5" className="input" value={s.gstRate} onChange={numf("gstRate")} /></div>
        <p className="text-xs text-muted sm:col-span-2">Prices on the website include GST. Invoices show the taxable value and CGST + SGST (same state) or IGST (other states).</p>
      </section>
      <section className={sec}>
        <h2 className="font-serif text-lg font-semibold sm:col-span-2">Gift box</h2>
        <label className="flex items-center gap-3 self-end pb-3 text-sm"><input type="checkbox" checked={s.giftBoxEnabled} onChange={(e) => setS({ ...s, giftBoxEnabled: e.target.checked })} className="h-4 w-4 accent-[#241f1a]" /> Let customers add a gift box and note</label>
        <div><label className="label" htmlFor="s-gift">Gift box price (₹, 0 = free)</label><input id="s-gift" type="number" min={0} className="input" value={s.giftBoxFee} onChange={numf("giftBoxFee")} /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="s-gimg">Gift box photo link</label><input id="s-gimg" className="input" placeholder="https://…" value={s.giftBoxImage} onChange={str("giftBoxImage")} /></div>
      </section>
      <section className={sec}>
        <h2 className="font-serif text-lg font-semibold sm:col-span-2">Contact details</h2>
        <div><label className="label" htmlFor="s-mail">Public email</label><input id="s-mail" type="email" required className="input" value={s.contactEmail} onChange={str("contactEmail")} /></div>
        <div><label className="label" htmlFor="s-owner">Email for order alerts &amp; messages</label><input id="s-owner" type="email" className="input" value={s.ownerEmail} onChange={str("ownerEmail")} /></div>
        <div><label className="label" htmlFor="s-phone">Phone</label><input id="s-phone" className="input" value={s.contactPhone} onChange={str("contactPhone")} /></div>
        <div><label className="label" htmlFor="s-wa">WhatsApp number (with country code)</label><input id="s-wa" className="input" placeholder="919876543210" value={s.whatsapp} onChange={str("whatsapp")} /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="s-ig">Instagram link</label><input id="s-ig" className="input" value={s.instagram} onChange={str("instagram")} /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="s-addr">Business address (shown in footer and invoices)</label><input id="s-addr" className="input" value={s.address} onChange={str("address")} /></div>
      </section>
      <div className="flex items-center gap-4">
        <button className="btn btn-dark" disabled={busy}>{busy ? "Saving…" : "Save settings"}</button>
        {msg && <p role="status" className={`text-sm font-medium ${msg.ok ? "text-emerald-700" : "text-berry"}`}>{msg.text}</p>}
      </div>
    </form>
  );
}
