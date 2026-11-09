import { formatINR } from "@/lib/utils";
import type { Pricing } from "@/components/store/usePricing";

export default function PriceSummary({ p }: { p: Pricing }) {
  const saved = p.mrpTotal - p.subtotal + p.discount;
  const row = "flex justify-between text-sm";
  return (
    <dl className="space-y-2.5">
      <div className={row}><dt className="text-muted">Total at MRP</dt><dd>{formatINR(p.mrpTotal)}</dd></div>
      {p.mrpTotal > p.subtotal && <div className={row}><dt className="text-muted">Discount</dt><dd className="text-berry">−{formatINR(p.mrpTotal - p.subtotal)}</dd></div>}
      {p.discount > 0 && <div className={row}><dt className="text-muted">Coupon {p.couponCode}</dt><dd className="text-berry">−{formatINR(p.discount)}</dd></div>}
      <div className={row}><dt className="text-muted">Shipping</dt><dd>{p.shipping === 0 ? <span className="font-semibold text-emerald-700">Free</span> : formatINR(p.shipping)}</dd></div>
      {p.giftFee > 0 && <div className={row}><dt className="text-muted">Gift box &amp; note</dt><dd>{formatINR(p.giftFee)}</dd></div>}
      {p.codFee > 0 && <div className={row}><dt className="text-muted">Cash on delivery fee</dt><dd>{formatINR(p.codFee)}</dd></div>}
      <div className="flex justify-between border-t border-line pt-3 text-lg font-semibold"><dt>Total</dt><dd>{formatINR(p.total)}</dd></div>
      {saved > 0 && <p className="rounded-xl bg-blush px-3 py-2 text-center text-xs font-semibold text-berry">You're saving {formatINR(saved)} on this order</p>}
    </dl>
  );
}
