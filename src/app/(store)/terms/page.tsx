import type { Metadata } from "next";
import PolicyPage from "@/components/layout/PolicyPage";

export const metadata: Metadata = { title: "Terms & conditions" };

export default function TermsPage() {
  return (
    <PolicyPage
      title="Terms & conditions"
      updated="November 2026"
      intro="By using this website and placing an order you agree to the terms below."
      sections={[
        { heading: "About us", body: "This website is operated by Chique Bags, a handcrafted bag brand based in India. In these terms, “we”, “us” and “our” mean Chique Bags." },
        { heading: "Products and prices", body: "We try to show our bags as accurately as we can, but colours may look slightly different on different screens. All prices are in Indian Rupees and include applicable taxes. We may change prices or withdraw products at any time; the price you see at checkout is the price you pay." },
        { heading: "Orders", body: "An order is confirmed once your online payment is received and you get a confirmation email. We may cancel an order if an item is out of stock or there's a pricing error, and will refund anything you've paid." },
        { heading: "Payments", body: "Online payments are processed securely by Razorpay. We never see or store your card details." },
        { heading: "Accounts", body: "You're responsible for keeping your login details safe and for activity under your account." },
        { heading: "Shipping and exchange", body: "Shipping and exchange are covered by our Shipping & delivery and Returns & exchange policies, which form part of these terms." },
        { heading: "Intellectual property", body: "All photos, text, logos and designs on this website belong to Chique Bags and may not be copied without our written permission." },
        { heading: "Limitation of liability", body: "To the extent the law allows, our liability for any claim is limited to the amount you paid for the order concerned." },
        { heading: "Governing law", body: "These terms are governed by the laws of India." },
      ]}
    />
  );
}
