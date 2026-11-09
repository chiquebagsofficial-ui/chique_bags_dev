import type { Metadata } from "next";

export const metadata: Metadata = { title: { default: "Admin", template: "%s | Chique Admin" }, robots: { index: false, follow: false } };

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#f6f3f1]">{children}</div>;
}
