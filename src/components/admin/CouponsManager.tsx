"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

export interface CouponRow {
  id: string; code: string; description: string | null; type: "PERCENTAGE" | "FLAT"; value: number; maxDiscount: number | null;
  minOrder: number; usageLimit: number | null; usedCount: number; oncePerUser: boolean; isActive: boolean; expiresAt: string | null;
}

const BLANK = { code: "", description: "", type: "PERCENTAGE" as "PERCENTAGE" | "FLAT", value: "" as number | "", maxDiscount: "" as number | "", minOrder: 0 as number | "", usageLimit: "" as number | "", oncePerUser: true, isActive: true, expiresAt: "" };

export default function CouponsManager({ coupons }: { coupons: CouponRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [f, setF] = useState(BLANK);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function open(c?: CouponRow) {
    setError(null);
    setEditing(c ? c.id : "new");
    setF(c ? { code: c.code, description: c.description ?? "", type: c.type, value: c.value, maxDiscount: c.maxDiscount ?? "", minOrder: c.minOrder, usageLimit: c.usageLimit ?? "", oncePerUser: c.oncePerUser, isActive: c.isActive, expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : "" } : BLANK);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const body = {
      code: f.code, description: f.description || null, type: f.type, value: Number(f.value),
      maxDiscount: f.maxDiscount === "" ? null : Number(f.maxDiscount), minOrder: Number(f.minOrder) || 0,
      usageLimit: f.usageLimit === "" ? null : Number(f.usageLimit), oncePerUser: f.oncePerUser, isActive: f.isActive,
      expiresAt: f.expiresAt ? new Date(`${f.expiresAt}T23:59:59`).toISOString() : null,
    };
    const res = await fetch(editing === "new" ? "/api/admin/coupons" : `/api/admin/coupons/${editing}`, { method: editing === "new" ? "POST" : "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy(false);
    if (res.ok) {
      setEditing(null);
      router.refresh();
    } else setError((await res.json().catch(() => ({}))).error ?? "Could not save");
  }

  async function toggle(c: CouponRow) {
    await fetch(`/api/admin/coupons/${c.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...c, expiresAt: c.expiresAt, isActive: !c.isActive }) });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {editing === null ? (
        <button className="btn btn-dark btn-sm" onClick={() => open()}><Plus size={15} /> New coupon</button>
      ) : (
        <form onSubmit={save} className="card grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
          <div><label className="label" htmlFor="cp-code">Code</label><input id="cp-code" required className="input uppercase" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} /></div>
          <div><label className="label" htmlFor="cp-type">Type</label><select id="cp-type" className="input" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as "PERCENTAGE" | "FLAT" })}><option value="PERCENTAGE">Percentage off</option><option value="FLAT">Flat amount off</option></select></div>
          <div><label className="label" htmlFor="cp-val">{f.type === "PERCENTAGE" ? "Percent (%)" : "Amount (₹)"}</label><input id="cp-val" required type="number" min={1} className="input" value={f.value} onChange={(e) => setF({ ...f, value: e.target.value === "" ? "" : Number(e.target.value) })} /></div>
          {f.type === "PERCENTAGE" && <div><label className="label" htmlFor="cp-max">Max discount (₹, optional)</label><input id="cp-max" type="number" min={0} className="input" value={f.maxDiscount} onChange={(e) => setF({ ...f, maxDiscount: e.target.value === "" ? "" : Number(e.target.value) })} /></div>}
          <div><label className="label" htmlFor="cp-min">Minimum order (₹)</label><input id="cp-min" type="number" min={0} className="input" value={f.minOrder} onChange={(e) => setF({ ...f, minOrder: e.target.value === "" ? "" : Number(e.target.value) })} /></div>
          <div><label className="label" htmlFor="cp-lim">Total uses (optional)</label><input id="cp-lim" type="number" min={1} className="input" value={f.usageLimit} onChange={(e) => setF({ ...f, usageLimit: e.target.value === "" ? "" : Number(e.target.value) })} /></div>
          <div><label className="label" htmlFor="cp-exp">Expires on (optional)</label><input id="cp-exp" type="date" className="input" value={f.expiresAt} onChange={(e) => setF({ ...f, expiresAt: e.target.value })} /></div>
          <div className="sm:col-span-2"><label className="label" htmlFor="cp-desc">Description</label><input id="cp-desc" className="input" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
          <div className="flex flex-col justify-end gap-2 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={f.oncePerUser} onChange={(e) => setF({ ...f, oncePerUser: e.target.checked })} className="accent-[#241f1a]" /> One use per customer</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={f.isActive} onChange={(e) => setF({ ...f, isActive: e.target.checked })} className="accent-[#241f1a]" /> Active</label>
          </div>
          {error && <p role="alert" className="rounded-sm bg-blush p-3 text-sm font-medium text-berry sm:col-span-2 lg:col-span-3">{error}</p>}
          <div className="flex gap-3 sm:col-span-2 lg:col-span-3"><button className="btn btn-dark btn-sm" disabled={busy}>{busy ? "Saving…" : "Save coupon"}</button><button type="button" className="btn btn-line btn-sm" onClick={() => setEditing(null)}>Cancel</button></div>
        </form>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead><tr className="border-b border-line text-xs uppercase tracking-wider text-muted">{["Code", "Offer", "Min order", "Used", "Expires", "Active", ""].map((h) => <th key={h} className="px-5 py-3.5 font-semibold">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-line">
            {coupons.map((c) => (
              <tr key={c.id} className="hover:bg-cream">
                <td className="px-5 py-3.5 font-mono font-semibold">{c.code}</td>
                <td className="px-5 py-3.5">{c.type === "PERCENTAGE" ? `${c.value}% off${c.maxDiscount ? ` (max ₹${c.maxDiscount})` : ""}` : `₹${c.value} off`}</td>
                <td className="px-5 py-3.5 text-muted">{c.minOrder ? `₹${c.minOrder}` : "None"}</td>
                <td className="px-5 py-3.5">{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ""}</td>
                <td className="px-5 py-3.5 text-muted">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("en-IN") : "Never"}</td>
                <td className="px-5 py-3.5"><button role="switch" aria-checked={c.isActive} aria-label={`Toggle ${c.code}`} onClick={() => toggle(c)} className={`relative h-6 w-11 rounded-full transition ${c.isActive ? "bg-emerald-500" : "bg-stone-300"}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${c.isActive ? "left-[22px]" : "left-0.5"}`} /></button></td>
                <td className="px-5 py-3.5"><div className="flex justify-end gap-1"><button aria-label="Edit coupon" className="grid h-9 w-9 place-items-center rounded-full hover:bg-blush" onClick={() => open(c)}><Pencil size={16} /></button><button aria-label="Delete coupon" className="grid h-9 w-9 place-items-center rounded-full hover:bg-blush hover:text-berry" onClick={async () => { if (confirm(`Delete ${c.code}?`)) { await fetch(`/api/admin/coupons/${c.id}`, { method: "DELETE" }); router.refresh(); } }}><Trash2 size={16} /></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
        {coupons.length === 0 && <p className="px-5 py-10 text-center text-sm text-muted">No coupons yet.</p>}
      </div>
    </div>
  );
}
