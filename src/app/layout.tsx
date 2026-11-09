import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap", style: ["normal", "italic"] });

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3020";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Chique Bags | Handcrafted Sling & Crossbody Bags", template: "%s | Chique Bags" },
  description: "Handcrafted vegan-leather sling and crossbody bags with gold-finish hardware. Free shipping above ₹999, delivered across India.",
  openGraph: { type: "website", siteName: "Chique Bags", locale: "en_IN" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#fdf5f7" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${jakarta.variable} ${playfair.variable}`}>
      <body>{children}</body>
    </html>
  );
}
