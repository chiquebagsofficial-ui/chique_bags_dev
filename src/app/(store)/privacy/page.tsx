import type { Metadata } from "next";
import PolicyPage from "@/components/layout/PolicyPage";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Privacy policy" };
export const dynamic = "force-dynamic";

export default async function PrivacyPage() {
  const s = await getSettings();
  return (
    <PolicyPage
      title="Privacy policy"
      updated="November 2026"
      intro="We collect only what we need to deliver your order and look after your account."
      sections={[
        { heading: "What we collect", body: ["Your name, email, phone number and delivery address when you sign up or place an order.", "Your order history, favourites and messages you send us.", "Basic technical data such as browser type, used to keep the site secure."] },
        { heading: "How we use it", body: ["To process and deliver your orders and send order emails.", "To let you log in and manage your account.", "To reply to your questions.", "To send news and offers, only if you subscribe. You can unsubscribe any time."] },
        { heading: "Who we share it with", body: "We share only what's needed with our service providers: payment (Razorpay), delivery couriers, email delivery and hosting. We never sell your data." },
        { heading: "Payments", body: "Card, UPI and bank details are entered on Razorpay's secure window. They are never stored on our servers." },
        { heading: "Security", body: "Passwords are stored only as one-way hashes. Our site uses encrypted connections, and access to customer data is restricted to the store owner." },
        { heading: "Your choices", body: `You can update your details in your account at any time. To ask us to delete your account or data, email ${s.contactEmail}.` },
        { heading: "Cookies and storage", body: "We use essential cookies to keep you logged in, and your browser's storage to remember your bag and favourites." },
      ]}
    />
  );
}
