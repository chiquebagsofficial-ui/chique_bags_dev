"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  id: string;
  customerName: string;
  customerPhone: string;
  address: { name: string; phone: string; line1: string; line2: string; city: string; state: string; pincode: string };
  internalNotes: string;
}

/** Edit contact and delivery details and keep private notes on an order. */
export default function OrderDetailsEditor({ id, customerName, customerPhone, address, internalNotes }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ customerName, customerPhone, ...address, internalNotes });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: f.customerName,
        customerPhone: f.customerPhone,
        address: { name: f.name, phone: f.phone, line1: f.line1, line2: f.line2, city: f.city, state: f.state, pincode: f.pincode },
        internalNotes: f.internalNotes,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setMsg({ ok: true, text: "Details saved" });
      setOpen(false);
      router.refresh();
    } else setMsg({ ok: false, text: data.error ?? "Could not save" });
  }

  if (!open) {
    return (
      <div className="space-y-2">
        <button className="btn btn-line btn-sm" onClick={() => setOpen(true)}>Edit contact, address &amp; notes</button>
        {msg && <p role="status" className={`text-sm font-medium ${msg.ok ? "text-emerald-700" : "text-berry"}`}>{msg.text}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={save} className="card grid gap-4 p-6 text-sm sm:grid-cols-2">
      <h2 className="font-serif text-lg font-semibold sm:col-span-2">Edit order details</h2>
      <div><label className="label" htmlFor="od-cn">Customer name</label><input id="od-cn" required className="input" value={f.customerName} onChange={set("customerName")} /></div>
      <div><label className="label" htmlFor="od-cp">Customer phone</label><input id="od-cp" required className="input" value={f.customerPhone} onChange={set("customerPhone")} /></div>
      <div><label className="label" htmlFor="od-rn">Recipient name</label><input id="od-rn" required className="input" value={f.name} onChange={set("name")} /></div>
      <div><label className="label" htmlFor="od-rp">Recipient phone</label><input id="od-rp" required className="input" value={f.phone} onChange={set("phone")} /></div>
      <div className="sm:col-span-2"><label className="label" htmlFor="od-l1">Address</label><input id="od-l1" required className="input" value={f.line1} onChange={set("line1")} /></div>
      <div className="sm:col-span-2"><label className="label" htmlFor="od-l2">Landmark / area</label><input id="od-l2" className="input" value={f.line2} onChange={set("line2")} /></div>
      <div><label className="label" htmlFor="od-city">City</label><input id="od-city" required className="input" value={f.city} onChange={set("city")} /></div>
      <div><label className="label" htmlFor="od-state">State</label><input id="od-state" required className="input" value={f.state} onChange={set("state")} /></div>
      <div><label className="label" htmlFor="od-pin">Pincode</label><input id="od-pin" required inputMode="numeric" maxLength={6} className="input" value={f.pincode} onChange={set("pincode")} /></div>
      <div className="sm:col-span-2"><label className="label" htmlFor="od-notes">Internal notes (only you can see these)</label><textarea id="od-notes" className="input min-h-24" maxLength={1000} value={f.internalNotes} onChange={set("internalNotes")} /></div>
      {msg && !msg.ok && <p role="alert" className="bg-blush p-3 font-medium text-berry sm:col-span-2">{msg.text}</p>}
      <div className="flex gap-3 sm:col-span-2"><button className="btn btn-dark btn-sm" disabled={busy}>{busy ? "Saving…" : "Save"}</button><button type="button" className="btn btn-line btn-sm" onClick={() => setOpen(false)}>Cancel</button></div>
    </form>
  );
}
