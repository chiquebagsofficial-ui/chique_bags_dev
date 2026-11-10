import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";

const jost = Jost({ subsets: ["latin"], variable: "--font-jost", display: "swap" });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], variable: "--font-cormorant", display: "swap", weight: ["300", "400", "500", "600"], style: ["normal", "italic"] });

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3020";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Chique Bags | Handcrafted Sling & Crossbody Bags", template: "%s | Chique Bags" },
  description: "Handcrafted vegan-leather sling and crossbody bags with gold-finish hardware. Free shipping on every order, delivered across India.",
  openGraph: { type: "website", siteName: "Chique Bags", locale: "en_IN" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#f6efe3" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${jost.variable} ${cormorant.variable}`}>
      <body>{children}</body>
    </html>
  );
}
