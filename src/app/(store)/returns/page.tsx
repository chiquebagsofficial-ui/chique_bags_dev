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
        { heading: "When you can report a problem", body: ["Within 7 days of delivery, if your bag arrives damaged, defective, or is not the item you ordered.", "The bag should be unused, with its tags and dust bag.", "We cannot accept returns for a change of mind, or for small colour differences caused by your screen."] },
        { heading: "How to report it", body: ["Open your order in My account and choose “Report a problem”. Select the item, tell us what went wrong and attach clear photos (required for damaged or defective bags).", "Please keep the packaging and, if you can, record a short unboxing video. We may ask for it.", `You can also write to us at ${s.contactEmail} with your order number.`] },
        { heading: "What happens next", body: ["We review your request within one working day and email you when it is approved or if we need more information.", "You can follow every step (requested, approved, item received, refunded) on your order page.", "Approved requests are refunded or exchanged, whichever you prefer where stock allows."] },
        { heading: "Refunds", body: "Refunds go back to the original payment method (UPI, card, net banking or wallet) and usually reach you within 5 to 7 working days of the refund being issued. We email you the amount and a reference when it's done. Every refund is recorded against your order." },
        { heading: "Cancellations", body: "You can cancel an order from your account any time before it ships, and the full amount is refunded. After shipping, an order can't be cancelled, but you can still report a problem once it arrives." },
      ]}
    />
  );
}
