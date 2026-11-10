"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { uploadImages } from "@/lib/cloudinary-client";
import { formatINR } from "@/lib/utils";

interface Item { id: string; name: string; variantName: string | null; quantity: number; price: number }

const REASONS = [
  ["DAMAGED", "Damaged when it arrived"],
  ["DEFECTIVE", "Defective or faulty"],
  ["WRONG_ITEM", "Wrong item received"],
  ["NOT_AS_DESCRIBED", "Not as described"],
  ["OTHER", "Other"],
] as const;

/** Used by customers (mode "customer") and by the store to record a return on someone's behalf (mode "admin"). */
export default function ReturnRequestForm({ orderId, items, mode = "customer" }: { orderId: string; items: Item[]; mode?: "customer" | "admin" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [reason, setReason] = useState<(typeof REASONS)[number][0]>("DAMAGED");
  const [details, setDetails] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const admin = mode === "admin";

  const chosen = items.filter((i) => (qty[i.id] ?? 0) > 0);
  const total = chosen.reduce((s, i) => s + i.price * (qty[i.id] ?? 0), 0);

  async function addPhotos(files: FileList | null) {
    if (!files?.length) return;
    if (photos.length + files.length > 5) return setError("You can add up to 5 photos.");
    setUploading(true);
    setError(null);
    try {
      const urls = await uploadImages(files, admin ? "/api/admin/cloudinary-signature" : "/api/account/upload-signature");
      setPhotos((p) => [...p, ...urls]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (chosen.length === 0) return setError("Choose at least one item.");
    setBusy(true);
    const res = await fetch(admin ? "/api/admin/returns" : "/api/account/returns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, reason, details, photos, items: chosen.map((i) => ({ orderItemId: i.id, quantity: qty[i.id] })) }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setOpen(false);
      router.refresh();
      if (admin && data.id) router.push(`/admin/returns/${data.id}`);
    } else setError(data.error ?? "Could not send your request");
  }

  if (!open) {
    return <button className="btn btn-line btn-sm" onClick={() => setOpen(true)}>{admin ? "Record a return or refund" : "Report a problem"}</button>;
  }

  return (
    <form onSubmit={submit} className="card space-y-5 p-5 text-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-xl font-semibold">{admin ? "Record a return or refund" : "Report a problem"}</h3>
        <button type="button" aria-label="Close" onClick={() => setOpen(false)}><X size={18} /></button>
      </div>

      <fieldset>
        <legend className="label">Which items?</legend>
        <ul className="space-y-2">
          {items.map((i) => (
            <li key={i.id} className="flex items-center gap-3 border border-line p-3">
              <input
                type="checkbox"
                aria-label={`Include ${i.name}`}
                className="h-4 w-4 accent-[#241f1a]"
                checked={(qty[i.id] ?? 0) > 0}
                onChange={(e) => setQty({ ...qty, [i.id]: e.target.checked ? 1 : 0 })}
              />
              <span className="flex-1">{i.name}<span className="block text-xs text-muted">{i.variantName} · {formatINR(i.price)} each</span></span>
              {(qty[i.id] ?? 0) > 0 && i.quantity > 1 && (
                <select aria-label="Quantity" className="input !w-20 !py-1.5" value={qty[i.id]} onChange={(e) => setQty({ ...qty, [i.id]: Number(e.target.value) })}>
                  {Array.from({ length: i.quantity }, (_, n) => n + 1).map((n) => <option key={n}>{n}</option>)}
                </select>
              )}
            </li>
          ))}
        </ul>
      </fieldset>

      <div>
        <label className="label" htmlFor="rr-reason">What went wrong?</label>
        <select id="rr-reason" className="input" value={reason} onChange={(e) => setReason(e.target.value as typeof reason)}>
          {REASONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="rr-details">Tell us more</label>
        <textarea id="rr-details" required minLength={10} maxLength={1000} className="input min-h-28" placeholder="For example: the strap was torn at the buckle when I opened the parcel." value={details} onChange={(e) => setDetails(e.target.value)} />
      </div>

      <div>
        <p className="label">Photos {!admin && (reason === "DAMAGED" || reason === "DEFECTIVE") ? "(required)" : "(optional)"}</p>
        <div className="flex flex-wrap gap-3">
          {photos.map((src) => (
            <div key={src} className="relative h-20 w-20 bg-cream">
              <Image src={src} alt="Uploaded photo" fill sizes="80px" className="object-cover" />
              <button type="button" aria-label="Remove photo" className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-ink text-white" onClick={() => setPhotos(photos.filter((p) => p !== src))}><X size={12} /></button>
            </div>
          ))}
          {photos.length < 5 && (
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="grid h-20 w-20 place-items-center border-2 border-dashed border-[#d6c8ad] text-xs text-muted hover:border-gold">
              <span className="flex flex-col items-center gap-1"><ImagePlus size={18} />{uploading ? "…" : "Add"}</span>
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => addPhotos(e.target.files)} />
      </div>

      {total > 0 && <p className="bg-cream p-3 text-xs text-muted">Value of the selected items: <strong className="text-ink">{formatINR(total)}</strong></p>}
      {error && <p role="alert" className="bg-blush p-3 text-sm font-medium text-berry">{error}</p>}
      <div className="flex gap-3">
        <button className="btn btn-dark btn-sm" disabled={busy || uploading}>{busy ? "Sending…" : admin ? "Save" : "Send request"}</button>
        <button type="button" className="btn btn-line btn-sm" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </form>
  );
}
