import type { Metadata } from "next";
import TrackForm from "@/components/store/TrackForm";

export const metadata: Metadata = { title: "Track your order" };

export default function TrackPage() {
  return (
    <div className="wrap max-w-xl py-14">
      <p className="eyebrow">Order status</p>
      <h1 className="h-display mt-2 text-4xl">Track your order</h1>
      <p className="mt-3 text-muted">Enter your order number (from your confirmation email) and the email you used.</p>
      <TrackForm />
    </div>
  );
}
