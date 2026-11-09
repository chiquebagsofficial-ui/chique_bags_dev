"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ImagePlus, Plus, Trash2, X } from "lucide-react";

export interface ProductFormValues {
  id?: string;
  name: string;
  categoryId: string;
  price: number | "";
  originalPrice: number | "";
  shortDescription: string;
  description: string;
  images: string[];
  features: string;
  tags: string;
  material: string;
  dimensions: string;
  careInstructions: string;
  isNew: boolean;
  isBestSeller: boolean;
  isFeatured: boolean;
  isActive: boolean;
  variants: { id?: string; name: string; hex: string; stock: number | "" }[];
}

export const EMPTY_PRODUCT: ProductFormValues = {
  name: "", categoryId: "", price: "", originalPrice: "", shortDescription: "", description: "", images: [], features: "", tags: "",
  material: "", dimensions: "", careInstructions: "", isNew: true, isBestSeller: false, isFeatured: false, isActive: true,
  variants: [{ name: "", hex: "#222222", stock: 10 }],
};

export default function ProductForm({ initial, categories }: { initial: ProductFormValues; categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const [v, setV] = useState<ProductFormValues>(initial);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const editing = Boolean(initial.id);

  const text = (k: keyof ProductFormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setV({ ...v, [k]: e.target.value });
  const num = (k: "price" | "originalPrice") => (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: e.target.value === "" ? "" : Number(e.target.value) });
  const flag = (k: "isNew" | "isBestSeller" | "isFeatured" | "isActive") => (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: e.target.checked });

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    try {
      const sigRes = await fetch("/api/admin/cloudinary-signature", { method: "POST" });
      const sig = await sigRes.json();
      if (!sigRes.ok) throw new Error(sig.error ?? "Upload is not set up");
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("api_key", sig.apiKey);
        fd.append("timestamp", String(sig.timestamp));
        fd.append("folder", sig.folder);
        fd.append("signature", sig.signature);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message ?? "Upload failed");
        urls.push(data.secure_url);
      }
      setV((cur) => ({ ...cur, images: [...cur.images, ...urls] }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const payload = {
      name: v.name,
      categoryId: v.categoryId,
      price: Number(v.price),
      originalPrice: v.originalPrice === "" ? null : Number(v.originalPrice),
      shortDescription: v.shortDescription || null,
      description: v.description || null,
      images: v.images,
      features: v.features.split("\n").map((s) => s.trim()).filter(Boolean),
      tags: v.tags.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
      material: v.material || null,
      dimensions: v.dimensions || null,
      careInstructions: v.careInstructions || null,
      isNew: v.isNew, isBestSeller: v.isBestSeller, isFeatured: v.isFeatured, isActive: v.isActive,
      variants: v.variants.map((x) => ({ id: x.id, name: x.name, hex: x.hex, stock: Number(x.stock) || 0 })),
    };
    const res = await fetch(editing ? `/api/admin/products/${initial.id}` : "/api/admin/products", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      router.push("/admin/products");
      router.refresh();
    } else {
      setError(data.error ?? "Could not save the product");
      setBusy(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  const sec = "card space-y-4 p-6";
  return (
    <form onSubmit={submit} className="grid max-w-5xl gap-6 lg:grid-cols-[1.6fr_1fr]">
      {error && <p role="alert" className="rounded-xl bg-blush p-4 text-sm font-medium text-berry lg:col-span-2">{error}</p>}

      <div className="space-y-6">
        <section className={sec}>
          <h2 className="font-serif text-lg font-semibold">Basics</h2>
          <div><label className="label" htmlFor="pf-name">Name</label><input id="pf-name" required className="input" value={v.name} onChange={text("name")} /></div>
          <div><label className="label" htmlFor="pf-short">Short description</label><input id="pf-short" className="input" maxLength={240} value={v.shortDescription} onChange={text("shortDescription")} /></div>
          <div><label className="label" htmlFor="pf-desc">Full description</label><textarea id="pf-desc" className="input min-h-32" value={v.description} onChange={text("description")} /></div>
          <div><label className="label" htmlFor="pf-feat">Highlights (one per line)</label><textarea id="pf-feat" className="input min-h-24" value={v.features} onChange={text("features")} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label" htmlFor="pf-mat">Material</label><input id="pf-mat" className="input" value={v.material} onChange={text("material")} /></div>
            <div><label className="label" htmlFor="pf-dim">Dimensions</label><input id="pf-dim" className="input" placeholder="22 × 14 × 6 cm" value={v.dimensions} onChange={text("dimensions")} /></div>
          </div>
          <div><label className="label" htmlFor="pf-care">Care instructions</label><textarea id="pf-care" className="input min-h-20" value={v.careInstructions} onChange={text("careInstructions")} /></div>
          <div><label className="label" htmlFor="pf-tags">Search tags (comma separated)</label><input id="pf-tags" className="input" placeholder="crescent, black, under999" value={v.tags} onChange={text("tags")} /></div>
        </section>

        <section className={sec}>
          <h2 className="font-serif text-lg font-semibold">Photos</h2>
          <p className="text-xs text-muted">The first photo is the cover. Upload from your device or paste an image link.</p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {v.images.map((src, i) => (
              <div key={src + i} className="group relative aspect-[4/5] overflow-hidden rounded-xl bg-cream">
                <Image src={src} alt="" fill sizes="140px" className="object-cover" />
                {i === 0 && <span className="badge badge-dark absolute left-1.5 top-1.5">Cover</span>}
                <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/50 p-1 opacity-0 transition group-hover:opacity-100">
                  <button type="button" className="px-1.5 text-xs text-white" disabled={i === 0} onClick={() => setV({ ...v, images: [src, ...v.images.filter((_, n) => n !== i)] })}>Make cover</button>
                  <button type="button" aria-label="Remove photo" className="text-white" onClick={() => setV({ ...v, images: v.images.filter((_, n) => n !== i) })}><X size={14} /></button>
                </div>
              </div>
            ))}
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="grid aspect-[4/5] place-items-center rounded-xl border-2 border-dashed border-[#e0d6d0] text-sm text-muted hover:border-rose hover:text-rose">
              <span className="flex flex-col items-center gap-1"><ImagePlus size={22} />{uploading ? "Uploading…" : "Upload"}</span>
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files)} />
          <div className="flex gap-2">
            <input className="input" placeholder="https://… image link" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} aria-label="Image link" />
            <button type="button" className="btn btn-line btn-sm" onClick={() => { if (/^https?:\/\//.test(urlInput)) { setV({ ...v, images: [...v.images, urlInput.trim()] }); setUrlInput(""); } }}>Add</button>
          </div>
        </section>

        <section className={sec}>
          <h2 className="font-serif text-lg font-semibold">Colours &amp; stock</h2>
          <div className="space-y-3">
            {v.variants.map((x, i) => (
              <div key={x.id ?? i} className="flex flex-wrap items-center gap-3">
                <input type="color" aria-label="Colour swatch" value={x.hex} onChange={(e) => setV({ ...v, variants: v.variants.map((y, n) => (n === i ? { ...y, hex: e.target.value } : y)) })} className="h-11 w-12 cursor-pointer rounded-lg border border-[#e7e0dc] bg-white p-1" />
                <input required className="input min-w-0 flex-1" placeholder="Colour name (e.g. Dusty Rose)" aria-label="Colour name" value={x.name} onChange={(e) => setV({ ...v, variants: v.variants.map((y, n) => (n === i ? { ...y, name: e.target.value } : y)) })} />
                <input type="number" min={0} className="input !w-24" aria-label="Stock" placeholder="Stock" value={x.stock} onChange={(e) => setV({ ...v, variants: v.variants.map((y, n) => (n === i ? { ...y, stock: e.target.value === "" ? "" : Number(e.target.value) } : y)) })} />
                <button type="button" aria-label="Remove colour" disabled={v.variants.length === 1} className="text-muted hover:text-berry disabled:opacity-30" onClick={() => setV({ ...v, variants: v.variants.filter((_, n) => n !== i) })}><Trash2 size={17} /></button>
              </div>
            ))}
          </div>
          <button type="button" className="btn btn-line btn-sm" onClick={() => setV({ ...v, variants: [...v.variants, { name: "", hex: "#cccccc", stock: 5 }] })}><Plus size={14} /> Add colour</button>
        </section>
      </div>

      <div className="space-y-6">
        <section className={sec}>
          <h2 className="font-serif text-lg font-semibold">Pricing</h2>
          <div><label className="label" htmlFor="pf-price">Selling price (₹)</label><input id="pf-price" required type="number" min={1} className="input" value={v.price} onChange={num("price")} /></div>
          <div>
            <label className="label" htmlFor="pf-mrp">MRP / original price (₹)</label>
            <input id="pf-mrp" type="number" min={0} className="input" value={v.originalPrice} onChange={num("originalPrice")} />
            {Number(v.originalPrice) > Number(v.price) && Number(v.price) > 0 && <p className="mt-1.5 text-xs font-semibold text-berry">{Math.round(((Number(v.originalPrice) - Number(v.price)) / Number(v.originalPrice)) * 100)}% off shown to customers</p>}
          </div>
        </section>

        <section className={sec}>
          <h2 className="font-serif text-lg font-semibold">Organise</h2>
          <div>
            <label className="label" htmlFor="pf-cat">Category</label>
            <select id="pf-cat" required className="input" value={v.categoryId} onChange={text("categoryId")}>
              <option value="">Choose…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {([["isActive", "Visible in the store"], ["isNew", "Show “New” badge"], ["isBestSeller", "Bestseller"], ["isFeatured", "Featured on homepage hero"]] as const).map(([k, label]) => (
            <label key={k} className="flex items-center gap-3 text-sm"><input type="checkbox" checked={v[k]} onChange={flag(k)} className="h-4 w-4 accent-[#1a1a1a]" /> {label}</label>
          ))}
        </section>

        <button className="btn btn-dark btn-block" disabled={busy || uploading}>{busy ? "Saving…" : editing ? "Save changes" : "Create product"}</button>
      </div>
    </form>
  );
}
