import type { Metadata } from "next";
import PolicyPage from "@/components/layout/PolicyPage";
import { getSettings } from "@/lib/settings";
import { formatINR } from "@/lib/utils";

export const metadata: Metadata = { title: "Shipping & delivery policy" };
export const dynamic = "force-dynamic";

export default async function ShippingPage() {
  const s = await getSettings();
  return (
    <PolicyPage
      title="Shipping & delivery"
      updated="November 2026"
      sections={[
        { heading: "Where we deliver", body: "We deliver to every serviceable pincode across India. Orders outside India are not available at the moment." },
        { heading: "Delivery time", body: "Orders are packed within 1–2 working days and usually reach you in 3–5 working days after dispatch. Remote areas can take a little longer." },
        { heading: "Shipping charges", body: `Shipping is free on orders of ${formatINR(s.freeShippingThreshold)} and above. Below that, a flat shipping fee of ${formatINR(s.shippingFee)} applies. The exact amount is always shown at checkout before you pay.` },
        { heading: "Tracking", body: "As soon as your order is shipped you'll receive an email with the courier name and a tracking link. You can also see the status of every order in your account, or on the Track order page." },
        { heading: "Cash on delivery", body: s.codEnabled ? `Cash on delivery is available${s.codFee ? ` for an extra fee of ${formatINR(s.codFee)}` : ""}. Please keep the exact amount ready when your parcel arrives.` : "Cash on delivery is not available at the moment." },
        { heading: "Need help?", body: `Write to us at ${s.contactEmail} with your order number and we'll sort it out.` },
      ]}
    />
  );
}
