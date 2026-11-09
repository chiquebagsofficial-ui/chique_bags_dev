"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/components/providers";

async function call(url: string, method: string, body?: unknown) {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  return { ok: res.ok, data: await res.json().catch(() => ({})) };
}

export function ProfileForm({ user, hasPassword }: { user: { name: string; email: string; phone: string | null }; hasPassword: boolean }) {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const router = useRouter();

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await call("/api/account/profile", "PUT", { name, phone, ...(next ? { currentPassword: current, newPassword: next } : {}) });
    setBusy(false);
    if (r.ok) {
      toast("Profile saved");
      setCurrent("");
      setNext("");
      router.refresh();
    } else setError(r.data.error ?? "Could not save");
  }

  return (
    <form onSubmit={save} className="card space-y-4 p-6">
      <h2 className="font-serif text-xl font-semibold">Profile</h2>
      <div><label className="label" htmlFor="p-name">Full name</label><input id="p-name" className="input" value={name} onChange={(e) => setName(e.target.value)} required /></div>
      <div><label className="label">Email</label><input className="input bg-cream" value={user.email} disabled /></div>
      <div><label className="label" htmlFor="p-phone">Phone</label><input id="p-phone" inputMode="tel" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
      <div className="border-t border-line pt-4">
        <p className="mb-3 text-sm font-semibold">{hasPassword ? "Change password" : "Set a password"}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {hasPassword && <div><label className="label" htmlFor="p-cur">Current password</label><input id="p-cur" type="password" autoComplete="current-password" className="input" value={current} onChange={(e) => setCurrent(e.target.value)} /></div>}
          <div><label className="label" htmlFor="p-new">New password</label><input id="p-new" type="password" minLength={8} autoComplete="new-password" className="input" value={next} onChange={(e) => setNext(e.target.value)} /></div>
        </div>
      </div>
      {error && <p role="alert" className="rounded-sm bg-blush p-3 text-sm font-medium text-berry">{error}</p>}
      <button className="btn btn-dark btn-sm" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>
    </form>
  );
}

interface Addr { id: string; name: string; phone: string; line1: string; line2: string | null; city: string; state: string; pincode: string; isDefault: boolean }
const EMPTY = { name: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "" };

export function AddressManager({ addresses }: { addresses: Addr[] }) {
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const router = useRouter();
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  function open(a?: Addr) {
    setError(null);
    setEditing(a ? a.id : "new");
    setForm(a ? { name: a.name, phone: a.phone, line1: a.line1, line2: a.line2 ?? "", city: a.city, state: a.state, pincode: a.pincode } : { ...EMPTY });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = editing === "new" ? await call("/api/account/addresses", "POST", form) : await call(`/api/account/addresses/${editing}`, "PUT", form);
    setBusy(false);
    if (r.ok) {
      toast("Address saved");
      setEditing(null);
      router.refresh();
    } else setError(r.data.error ?? "Could not save the address");
  }

  async function remove(id: string) {
    if (!confirm("Delete this address?")) return;
    await call(`/api/account/addresses/${id}`, "DELETE");
    router.refresh();
  }

  async function makeDefault(a: Addr) {
    await call(`/api/account/addresses/${a.id}`, "PUT", { ...a, line2: a.line2 ?? "", isDefault: true });
    router.refresh();
  }

  return (
    <section className="card p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-serif text-xl font-semibold">Saved addresses</h2>
        {editing === null && <button className="btn btn-line btn-sm" onClick={() => open()}><Plus size={14} /> Add address</button>}
      </div>

      {addresses.length === 0 && editing === null && <p className="text-sm text-muted">No saved addresses yet.</p>}
      <ul className="space-y-3">
        {addresses.map((a) => (
          <li key={a.id} className="flex items-start justify-between gap-4 rounded-sm border border-line p-4 text-sm">
            <div>
              <p className="font-semibold">{a.name} <span className="font-normal text-muted">· {a.phone}</span> {a.isDefault && <span className="badge badge-rose ml-1">Default</span>}</p>
              <p className="mt-1 text-muted">{a.line1}{a.line2 && `, ${a.line2}`}, {a.city}, {a.state} {a.pincode}</p>
              {!a.isDefault && <button className="mt-2 text-xs font-semibold underline" onClick={() => makeDefault(a)}>Make default</button>}
            </div>
            <div className="flex gap-1">
              <button aria-label="Edit address" className="grid h-9 w-9 place-items-center rounded-full hover:bg-blush" onClick={() => open(a)}><Pencil size={16} /></button>
              <button aria-label="Delete address" className="grid h-9 w-9 place-items-center rounded-full hover:bg-blush hover:text-berry" onClick={() => remove(a.id)}><Trash2 size={16} /></button>
            </div>
          </li>
        ))}
      </ul>

      {editing !== null && (
        <form onSubmit={save} className="mt-5 grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
          <div><label className="label" htmlFor="ad-name">Recipient name</label><input id="ad-name" required className="input" value={form.name} onChange={set("name")} /></div>
          <div><label className="label" htmlFor="ad-phone">Phone</label><input id="ad-phone" required inputMode="tel" className="input" value={form.phone} onChange={set("phone")} /></div>
          <div className="sm:col-span-2"><label className="label" htmlFor="ad-l1">Address</label><input id="ad-l1" required className="input" value={form.line1} onChange={set("line1")} /></div>
          <div className="sm:col-span-2"><label className="label" htmlFor="ad-l2">Landmark / area (optional)</label><input id="ad-l2" className="input" value={form.line2} onChange={set("line2")} /></div>
          <div><label className="label" htmlFor="ad-city">City</label><input id="ad-city" required className="input" value={form.city} onChange={set("city")} /></div>
          <div><label className="label" htmlFor="ad-state">State</label><input id="ad-state" required className="input" value={form.state} onChange={set("state")} /></div>
          <div><label className="label" htmlFor="ad-pin">Pincode</label><input id="ad-pin" required inputMode="numeric" maxLength={6} className="input" value={form.pincode} onChange={set("pincode")} /></div>
          {error && <p role="alert" className="rounded-sm bg-blush p-3 text-sm font-medium text-berry sm:col-span-2">{error}</p>}
          <div className="flex gap-3 sm:col-span-2">
            <button className="btn btn-dark btn-sm" disabled={busy}>{busy ? "Saving…" : "Save address"}</button>
            <button type="button" className="btn btn-line btn-sm" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </form>
      )}
    </section>
  );
}

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const toast = useToast();
  return (
    <div>
      <button
        className="btn btn-line btn-sm"
        disabled={busy}
        onClick={async () => {
          if (!confirm("Cancel this order? This can't be undone.")) return;
          setBusy(true);
          const r = await call(`/api/account/orders/${orderId}/cancel`, "POST");
          setBusy(false);
          if (r.ok) {
            toast("Order cancelled");
            router.refresh();
          } else setError(r.data.error ?? "Could not cancel");
        }}
      >
        {busy ? "Cancelling…" : "Cancel order"}
      </button>
      {error && <p className="mt-2 text-sm text-berry">{error}</p>}
    </div>
  );
}

export function PrintButton() {
  return <button className="btn btn-dark btn-sm no-print" onClick={() => window.print()}>Print / save as PDF</button>;
}
