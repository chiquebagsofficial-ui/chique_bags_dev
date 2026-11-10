"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ReturnStatus } from "@prisma/client";
import { formatINR } from "@/lib/utils";

export default function ReturnActions({ id, status, suggested, remaining }: { id: string; status: ReturnStatus; suggested: number; remaining: number }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState<number | "">(Math.min(suggested, remaining));
  const [restock, setRestock] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function act(body: Record<string, unknown>, success: string) {
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/admin/returns/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setMsg({ ok: true, text: success });
      setNote("");
      router.refresh();
    } else setMsg({ ok: false, text: data.error ?? "That didn't work" });
  }

  const finished = status === "REJECTED" || status === "CLOSED";
  const canRefund = (status === "APPROVED" || status === "RECEIVED") && remaining > 0;

  return (
    <section className="card space-y-5 p-6">
      <h2 className="font-serif text-lg font-semibold">Actions</h2>

      {!finished && (
        <div>
          <label className="label" htmlFor="ra-note">Note (shown to the customer in their email)</label>
          <textarea id="ra-note" className="input min-h-20" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {status === "REQUESTED" && <button className="btn btn-dark btn-sm" disabled={busy} onClick={() => act({ action: "approve", note }, "Request approved. The customer has been emailed.")}>Approve</button>}
        {status === "APPROVED" && <button className="btn btn-line btn-sm" disabled={busy} onClick={() => act({ action: "received", note }, "Marked as received.")}>Item received back</button>}
        {(status === "REQUESTED" || status === "APPROVED") && <button className="btn btn-line btn-sm !border-berry !text-berry hover:!bg-berry hover:!text-white" disabled={busy} onClick={() => { if (confirm("Reject this request? The customer will be emailed your note.")) act({ action: "reject", note }, "Request rejected."); }}>Reject</button>}
        {!finished && <button className="btn btn-line btn-sm" disabled={busy || !note.trim()} onClick={() => act({ action: "note", note }, "Note saved to the history.")}>Save note only</button>}
      </div>

      {canRefund && (
        <div className="space-y-4 border-t border-line pt-5">
          <h3 className="text-sm font-semibold">Issue refund</h3>
          <p className="text-xs text-muted">Refunded to the customer's original payment method through Razorpay. You can refund up to {formatINR(remaining)} on this order.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label" htmlFor="ra-amt">Refund amount (₹)</label><input id="ra-amt" type="number" min={1} max={remaining} className="input" value={amount} onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))} /></div>
            <label className="flex items-center gap-2 self-end pb-3 text-sm"><input type="checkbox" checked={restock} onChange={(e) => setRestock(e.target.checked)} className="h-4 w-4 accent-[#241f1a]" /> Put the item(s) back in stock</label>
          </div>
          <button
            className="btn btn-dark btn-sm"
            disabled={busy || amount === "" || Number(amount) < 1}
            onClick={() => { if (confirm(`Refund ${formatINR(Number(amount))} now? This cannot be undone.`)) act({ action: "refund", amount: Number(amount), restock, note }, "Refund issued and recorded."); }}
          >
            {busy ? "Processing…" : `Refund ${amount === "" ? "" : formatINR(Number(amount))}`}
          </button>
        </div>
      )}
      {(status === "APPROVED" || status === "RECEIVED") && remaining <= 0 && <p className="bg-cream p-3 text-sm">This order has already been refunded in full.</p>}
      {finished && <p className="text-sm text-muted">This request is closed.</p>}
      {msg && <p role="status" className={`text-sm font-medium ${msg.ok ? "text-emerald-700" : "text-berry"}`}>{msg.text}</p>}
    </section>
  );
}
