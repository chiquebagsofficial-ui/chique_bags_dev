"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Pencil, Trash2 } from "lucide-react";

export default function ProductRowActions({ id, isActive }: { id: string; isActive: boolean }) {
  const router = useRouter();
  const btn = "grid h-9 w-9 place-items-center rounded-full hover:bg-blush";
  return (
    <div className="flex justify-end gap-1">
      <Link href={`/admin/products/${id}`} className={btn} aria-label="Edit product"><Pencil size={16} /></Link>
      <button
        className={btn}
        aria-label={isActive ? "Hide product" : "Show product"}
        onClick={async () => {
          await fetch(`/api/admin/products/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !isActive }) });
          router.refresh();
        }}
      >
        {isActive ? <Eye size={16} /> : <EyeOff size={16} />}
      </button>
      <button
        className={`${btn} hover:!text-berry`}
        aria-label="Delete product"
        onClick={async () => {
          if (!confirm("Delete this product permanently? Past orders keep their details.")) return;
          await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
          router.refresh();
        }}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
