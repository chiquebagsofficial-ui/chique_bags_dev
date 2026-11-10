"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ImagePlus, Pencil, Plus, Trash2 } from "lucide-react";
import { uploadImages } from "@/lib/cloudinary-client";

export interface BannerRow {
  id: string; eyebrow: string | null; title: string; subtitle: string | null; ctaText: string | null; ctaHref: string | null;
  cta2Text: string | null; cta2Href: string | null; image: string; imageMobile: string | null; focus: string; theme: string;
  sortOrder: number; isActive: boolean;
}

const BLANK = { eyebrow: "", title: "", subtitle: "", ctaText: "Shop now", ctaHref: "/shop", cta2Text: "", cta2Href: "", image: "", imageMobile: "", focus: "center", theme: "light", sortOrder: 0, isActive: true };

export default function BannersManager({ banners }: { banners: BannerRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [f, setF] = useState(BLANK);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<"image" | "imageMobile" | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const target = useRef<"image" | "imageMobile">("image");

  function open(b?: BannerRow) {
    setError(null);
    setEditing(b ? b.id : "new");
    setF(b ? { eyebrow: b.eyebrow ?? "", title: b.title, subtitle: b.subtitle ?? "", ctaText: b.ctaText ?? "", ctaHref: b.ctaHref ?? "", cta2Text: b.cta2Text ?? "", cta2Href: b.cta2Href ?? "", image: b.image, imageMobile: b.imageMobile ?? "", focus: b.focus, theme: b.theme, sortOrder: b.sortOrder, isActive: b.isActive } : { ...BLANK, sortOrder: banners.length + 1 });
  }

  async function pick(files: FileList | null) {
    if (!files?.length) return;
    const which = target.current;
    setUploading(which);
    setError(null);
    try {
      const [url] = await uploadImages(files);
      setF((cur) => ({ ...cur, [which]: url }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch(editing === "new" ? "/api/admin/banners" : `/api/admin/banners/${editing}`, {
      method: editing === "new" ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...f, sortOrder: Number(f.sortOrder) || 0 }),
    });
    setBusy(false);
    if (res.ok) {
      setEditing(null);
      router.refresh();
    } else setError((await res.json().catch(() => ({}))).error ?? "Could not save");
  }

  const imgBox = (key: "image" | "imageMobile", label: string, ratio: string) => (
    <div>
      <label className="label">{label}</label>
      <button type="button" onClick={() => { target.current = key; fileRef.current?.click(); }} className={`relative grid w-full place-items-center overflow-hidden border-2 border-dashed border-[#dccfb8] text-sm text-muted hover:border-rose ${ratio}`}>
        {f[key] ? <Image src={f[key]} alt="" fill sizes="300px" className="object-cover" /> : <span className="flex flex-col items-center gap-1"><ImagePlus size={22} />{uploading === key ? "Uploading…" : "Upload"}</span>}
      </button>
      <input className="input mt-2 !text-xs" placeholder="or paste an image link" value={f[key]} onChange={(e) => setF({ ...f, [key]: e.target.value })} aria-label={`${label} link`} />
    </div>
  );

  return (
    <div className="space-y-6">
      {editing === null ? (
        <button className="btn btn-dark btn-sm" onClick={() => open()}><Plus size={15} /> New banner</button>
      ) : (
        <form onSubmit={save} className="card grid gap-5 p-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="label" htmlFor="bn-eye">Small heading above (optional)</label><input id="bn-eye" className="input" value={f.eyebrow} onChange={(e) => setF({ ...f, eyebrow: e.target.value })} /></div>
              <div><label className="label" htmlFor="bn-order">Order (lower shows first)</label><input id="bn-order" type="number" min={0} className="input" value={f.sortOrder} onChange={(e) => setF({ ...f, sortOrder: Number(e.target.value) })} /></div>
            </div>
            <div><label className="label" htmlFor="bn-title">Headline (put *stars* around words to set them in italics)</label><input id="bn-title" required className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
            <div><label className="label" htmlFor="bn-sub">Supporting text</label><textarea id="bn-sub" className="input min-h-20" value={f.subtitle} onChange={(e) => setF({ ...f, subtitle: e.target.value })} /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="label" htmlFor="bn-c1">Button text</label><input id="bn-c1" className="input" value={f.ctaText} onChange={(e) => setF({ ...f, ctaText: e.target.value })} /></div>
              <div><label className="label" htmlFor="bn-h1">Button link</label><input id="bn-h1" className="input" placeholder="/shop" value={f.ctaHref} onChange={(e) => setF({ ...f, ctaHref: e.target.value })} /></div>
              <div><label className="label" htmlFor="bn-c2">Second button text (optional)</label><input id="bn-c2" className="input" value={f.cta2Text} onChange={(e) => setF({ ...f, cta2Text: e.target.value })} /></div>
              <div><label className="label" htmlFor="bn-h2">Second button link</label><input id="bn-h2" className="input" value={f.cta2Href} onChange={(e) => setF({ ...f, cta2Href: e.target.value })} /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="label" htmlFor="bn-focus">Photo focus point</label>
                <select id="bn-focus" className="input" value={f.focus} onChange={(e) => setF({ ...f, focus: e.target.value })}>
                  {["center", "left center", "right center", "center top", "center bottom", "70% 30%", "30% 30%"].map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div><label className="label" htmlFor="bn-theme">Text colour</label>
                <select id="bn-theme" className="input" value={f.theme} onChange={(e) => setF({ ...f, theme: e.target.value })}>
                  <option value="light">White text (for darker photos)</option>
                  <option value="dark">Dark text (for lighter photos)</option>
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.isActive} onChange={(e) => setF({ ...f, isActive: e.target.checked })} className="accent-[#241f1a]" /> Show on the homepage</label>
          </div>
          <div className="space-y-4">
            {imgBox("image", "Banner photo (wide, 16:9 works best)", "aspect-video")}
            {imgBox("imageMobile", "Phone photo (optional, tall 4:5)", "aspect-[4/5] max-w-[200px]")}
          </div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files)} />
          {error && <p role="alert" className="bg-blush p-3 text-sm font-medium text-berry lg:col-span-2">{error}</p>}
          <div className="flex gap-3 lg:col-span-2"><button className="btn btn-dark btn-sm" disabled={busy || uploading !== null}>{busy ? "Saving…" : "Save banner"}</button><button type="button" className="btn btn-line btn-sm" onClick={() => setEditing(null)}>Cancel</button></div>
        </form>
      )}

      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {banners.map((b) => (
          <li key={b.id} className="card overflow-hidden">
            <div className="relative aspect-video bg-cream">
              <Image src={b.image} alt="" fill sizes="400px" className="object-cover" style={{ objectPosition: b.focus }} />
              {!b.isActive && <span className="badge badge-dark absolute left-2 top-2">Hidden</span>}
            </div>
            <div className="flex items-center gap-3 p-4 text-sm">
              <div className="min-w-0 flex-1"><p className="truncate font-semibold">{b.title.replace(/\*/g, "")}</p><p className="text-xs text-muted">Order {b.sortOrder}{b.ctaHref ? ` · ${b.ctaHref}` : ""}</p></div>
              <button aria-label="Edit banner" className="grid h-9 w-9 place-items-center rounded-full hover:bg-blush" onClick={() => open(b)}><Pencil size={16} /></button>
              <button aria-label="Delete banner" className="grid h-9 w-9 place-items-center rounded-full hover:bg-blush hover:text-berry" onClick={async () => { if (confirm("Delete this banner?")) { await fetch(`/api/admin/banners/${b.id}`, { method: "DELETE" }); router.refresh(); } }}><Trash2 size={16} /></button>
            </div>
          </li>
        ))}
      </ul>
      {banners.length === 0 && editing === null && <p className="card p-10 text-center text-sm text-muted">No banners yet. The homepage shows a simple hero until you add one.</p>}
    </div>
  );
}
