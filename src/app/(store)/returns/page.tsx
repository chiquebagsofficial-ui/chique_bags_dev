import type { Metadata } from "next";
import PolicyPage from "@/components/layout/PolicyPage";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Returns, exchange & refunds" };
export const dynamic = "force-dynamic";

export default async function ReturnsPage() {
  const s = await getSettings();
  return (
    <PolicyPage
      title="Returns, exchange & refunds"
      updated="November 2026"
      intro="Every bag is checked before it leaves us. If something isn't right, we'll make it right."
      sections={[
        { heading: "Exchange within 7 days", body: ["You can ask for an exchange within 7 days of delivery if you received the wrong item or a defective item.", "Please record an unboxing video when you open the parcel. We'll need it to process your claim.", "The bag must be unused, with its tags and dust bag."] },
        { heading: "Not covered", body: "We can't accept exchanges for a change of mind, small colour differences caused by your screen, or damage after delivery." },
        { heading: "How to start", body: `Email ${s.contactEmail} within 7 days with your order number, photos and the unboxing video. We'll reply within one working day.` },
        { heading: "Cancellations", body: "You can cancel an order from your account any time before it ships. After shipping, the order can't be cancelled." },
        { heading: "Refunds", body: "If your order is cancelled or a claim is approved and a replacement isn't possible, we refund the amount to your original payment method within 5–7 working days. Cash-on-delivery refunds are made by bank transfer." },
      ]}
    />
  );
}
