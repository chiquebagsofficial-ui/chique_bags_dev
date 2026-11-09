import Link from "next/link";
import type { Metadata } from "next";
import { XCircle } from "lucide-react";

export const metadata: Metadata = { title: "Payment failed", robots: { index: false } };

export default function OrderFailedPage() {
  return (
    <div className="wrap max-w-xl py-20 text-center">
      <XCircle size={56} className="mx-auto text-berry" />
      <h1 className="h-display mt-5 text-4xl">Payment didn't go through</h1>
      <p className="mt-3 text-muted">No money has been taken for this order. Your bag is still saved, so you can try again whenever you're ready, or choose cash on delivery.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/checkout" className="btn btn-dark">Try again</Link>
        <Link href="/cart" className="btn btn-line">Review bag</Link>
      </div>
      <p className="mt-8 text-sm text-muted">If money was deducted from your account, it will be refunded automatically within 5–7 working days, or <Link href="/contact" className="underline">contact us</Link>.</p>
    </div>
  );
}
