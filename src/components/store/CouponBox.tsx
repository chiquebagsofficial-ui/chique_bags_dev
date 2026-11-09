"use client";

import { useState } from "react";
import { Tag, X } from "lucide-react";

export default function CouponBox({ applied, error, onApply, onRemove }: { applied: string | null; error: string | null; onApply: (code: string) => void; onRemove: () => void }) {
  const [code, setCode] = useState("");
  if (applied) {
    return (
      <div className="flex items-center justify-between rounded-xl bg-blush px-4 py-3 text-sm">
        <span className="flex items-center gap-2 font-semibold text-berry"><Tag size={15} /> {applied} applied</span>
        <button onClick={onRemove} aria-label="Remove coupon" className="text-muted hover:text-ink"><X size={16} /></button>
      </div>
    );
  }
  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (code.trim()) onApply(code.trim().toUpperCase());
        }}
        className="flex gap-2"
      >
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Coupon code" aria-label="Coupon code" className="input !py-2.5 uppercase" />
        <button className="btn btn-line btn-sm">Apply</button>
      </form>
      {error && <p className="mt-2 text-xs font-medium text-berry">{error}</p>}
    </div>
  );
}
