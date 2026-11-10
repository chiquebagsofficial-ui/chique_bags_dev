"use client";

import { usePathname } from "next/navigation";
import { WhatsAppIcon } from "@/components/icons";

/** Floating chat button. On a product page the message is pre-filled with that product. */
export default function WhatsAppButton({ number }: { number: string }) {
  const pathname = usePathname();
  if (!number || pathname.startsWith("/checkout")) return null;

  const onProduct = pathname.startsWith("/products/");
  const text = onProduct
    ? `Hi Chique Bags, I'd like to know more about this bag: ${typeof window !== "undefined" ? window.location.href : ""}`
    : "Hi Chique Bags, I have a question.";
  const href = `https://wa.me/${number}?text=${encodeURIComponent(text)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="group fixed bottom-5 right-5 z-[80] flex items-center gap-3 rounded-full bg-[#25D366] p-3.5 text-white shadow-[0_10px_30px_-8px_rgba(0,0,0,0.45)] transition hover:scale-105 lg:bottom-7 lg:right-7"
    >
      <WhatsAppIcon size={28} />
      <span className="hidden max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium transition-all duration-300 group-hover:max-w-[10rem] group-hover:pr-1.5 lg:inline">Chat with us</span>
    </a>
  );
}
