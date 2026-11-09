"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const FLOW = [
  ["CONFIRMED", "Confirmed"],
  ["PROCESSING", "Packing"],
  ["SHIPPED", "Shipped"],
  ["DELIVERED", "Delivered"],
] as const;

export default function OrderControls({ id, status, courier, trackingUrl, needsAttention, awaitingPayment }: { id: string; status: string; courier: string | null; trackingUrl: string | null; needsAttention: boolean; awaitingPayment: boolean }) {
  const router = useRouter();
  const [next, setNext] = useState(status === "PENDING" ? "CONFIRMED" : status);
  const [c, setC] = useState(courier ?? "");
  const [t, setT] = useState(trackingUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const locked = status === "CANCELLED";

  async function patch(body: Record<string, unknown>, success: string) {
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/admin/orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setMsg({ ok: true, text: success });
      router.refresh();
    } else setMsg({ ok: false, text: data.error ?? "Could not update" });
  }

  return (
    <section className="card space-y-4 p-6">
      <h2 className="font-serif text-lg font-semibold">Manage order</h2>
      {awaitingPayment && <p className="rounded-sm bg-amber-50 p-3 text-sm text-amber-900">Waiting for online payment. Status can be changed once it's paid.</p>}
      <div>
        <label className="label" htmlFor="oc-status">Status</label>
        <select id="oc-status" className="input" value={next} disabled={locked || awaitingPayment} onChange={(e) => setNext(e.target.value)}>
          {FLOW.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="oc-courier">Courier</label><input id="oc-courier" className="input" placeholder="e.g. Delhivery" value={c} disabled={locked} onChange={(e) => setC(e.target.value)} /></div>
        <div><label className="label" htmlFor="oc-track">Tracking link</label><input id="oc-track" type="url" className="input" placeholder="https://…" value={t} disabled={locked} onChange={(e) => setT(e.target.value)} /></div>
      </div>
      <p className="text-xs text-muted">The customer is emailed automatically when the order is marked Shipped or Delivered.</p>
      <div className="flex flex-wrap gap-3">
        <button className="btn btn-dark btn-sm" disabled={busy || locked || awaitingPayment} onClick={() => patch({ status: next, courier: c, trackingUrl: t }, "Order updated")}>{busy ? "Saving…" : "Update order"}</button>
        {!locked && status !== "SHIPPED" && status !== "DELIVERED" && (
          <button className="btn btn-line btn-sm !border-berry !text-berry hover:!bg-berry hover:!text-white" disabled={busy} onClick={() => { if (confirm("Cancel this order? Stock is returned and an online payment is refunded.")) patch({ status: "CANCELLED" }, "Order cancelled"); }}>Cancel order</button>
        )}
        {needsAttention && <button className="btn btn-line btn-sm" disabled={busy} onClick={() => patch({ resolved: true }, "Marked as resolved")}>Mark as resolved</button>}
      </div>
      {msg && <p role="status" className={`text-sm font-medium ${msg.ok ? "text-emerald-700" : "text-berry"}`}>{msg.text}</p>}
    </section>
  );
}
