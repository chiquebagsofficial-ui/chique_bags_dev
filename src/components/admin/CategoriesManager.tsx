"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

interface Cat { id: string; name: string; description: string | null; image: string | null; sortOrder: number; isActive: boolean; productCount: number }
const BLANK = { name: "", description: "", image: "", sortOrder: 100, isActive: true };

export default function CategoriesManager({ categories }: { categories: Cat[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [f, setF] = useState(BLANK);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function open(c?: Cat) {
    setError(null);
    setEditing(c ? c.id : "new");
    setF(c ? { name: c.name, description: c.description ?? "", image: c.image ?? "", sortOrder: c.sortOrder, isActive: c.isActive } : BLANK);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch(editing === "new" ? "/api/admin/categories" : `/api/admin/categories/${editing}`, {
      method: editing === "new" ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: f.name, description: f.description || null, image: f.image || null, sortOrder: Number(f.sortOrder) || 0, isActive: f.isActive }),
    });
    setBusy(false);
    if (res.ok) {
      setEditing(null);
      router.refresh();
    } else setError((await res.json().catch(() => ({}))).error ?? "Could not save");
  }

  return (
    <div className="space-y-6">
      {editing === null ? (
        <button className="btn btn-dark btn-sm" onClick={() => open()}><Plus size={15} /> New category</button>
      ) : (
        <form onSubmit={save} className="card grid gap-4 p-6 sm:grid-cols-2">
          <div><label className="label" htmlFor="ct-name">Name</label><input id="ct-name" required className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div><label className="label" htmlFor="ct-order">Display order (lower shows first)</label><input id="ct-order" type="number" min={0} className="input" value={f.sortOrder} onChange={(e) => setF({ ...f, sortOrder: Number(e.target.value) })} /></div>
          <div className="sm:col-span-2"><label className="label" htmlFor="ct-desc">Description</label><input id="ct-desc" className="input" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
          <div className="sm:col-span-2"><label className="label" htmlFor="ct-img">Cover image link</label><input id="ct-img" type="url" placeholder="https://…" className="input" value={f.image} onChange={(e) => setF({ ...f, image: e.target.value })} /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.isActive} onChange={(e) => setF({ ...f, isActive: e.target.checked })} className="accent-[#1a1a1a]" /> Visible in the store</label>
          {error && <p role="alert" className="rounded-xl bg-blush p-3 text-sm font-medium text-berry sm:col-span-2">{error}</p>}
          <div className="flex gap-3 sm:col-span-2"><button className="btn btn-dark btn-sm" disabled={busy}>{busy ? "Saving…" : "Save category"}</button><button type="button" className="btn btn-line btn-sm" onClick={() => setEditing(null)}>Cancel</button></div>
        </form>
      )}
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {categories.map((c) => (
          <li key={c.id} className="card flex items-center gap-4 p-4">
            <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-cream">{c.image && <Image src={c.image} alt="" fill sizes="64px" className="object-cover" />}</span>
            <div className="min-w-0 flex-1 text-sm"><p className="truncate font-semibold">{c.name} {!c.isActive && <span className="badge ml-1 !bg-stone-200">Hidden</span>}</p><p className="text-muted">{c.productCount} product{c.productCount === 1 ? "" : "s"}</p></div>
            <button aria-label="Edit category" className="grid h-9 w-9 place-items-center rounded-full hover:bg-blush" onClick={() => open(c)}><Pencil size={16} /></button>
            <button aria-label="Delete category" className="grid h-9 w-9 place-items-center rounded-full hover:bg-blush hover:text-berry" onClick={async () => {
              if (!confirm(`Delete ${c.name}?`)) return;
              const res = await fetch(`/api/admin/categories/${c.id}`, { method: "DELETE" });
              if (!res.ok) alert((await res.json().catch(() => ({}))).error ?? "Could not delete");
              router.refresh();
            }}><Trash2 size={16} /></button>
          </li>
        ))}
      </ul>
    </div>
  );
}
