"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, LogOut, Mail, Menu, Package, Settings, ShoppingCart, Tag, Tags, Users, X } from "lucide-react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/coupons", label: "Coupons", icon: Tag },
  { href: "/admin/messages", label: "Messages", icon: Mail },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminShell({ adminName, unreadMessages, children }: { adminName: string; unreadMessages: number; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex-1 space-y-1 p-4" aria-label="Admin">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
        return (
          <Link key={href} href={href} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition ${active ? "bg-white/12 text-white" : "text-white/60 hover:bg-white/8 hover:text-white"}`}>
            <Icon size={18} /> {label}
            {label === "Messages" && unreadMessages > 0 && <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-rose px-1.5 text-[0.65rem] font-bold text-white">{unreadMessages}</span>}
          </Link>
        );
      })}
    </nav>
  );

  const logout = (
    <div className="border-t border-white/10 p-4">
      <p className="mb-2 truncate px-2 text-xs text-white/50">{adminName}</p>
      <button
        className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-white/60 hover:bg-white/8 hover:text-white"
        onClick={async () => {
          await fetch("/api/admin/logout", { method: "POST" });
          router.push("/admin/login");
          router.refresh();
        }}
      >
        <LogOut size={18} /> Sign out
      </button>
    </div>
  );

  return (
    <div className="lg:flex">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-ink lg:flex">
        <Link href="/admin" className="font-serif px-8 py-7 text-xl font-semibold text-white">Chique Bags <span className="block text-[0.65rem] font-sans font-semibold uppercase tracking-[0.2em] text-rose-soft">Admin</span></Link>
        {nav}
        {logout}
      </aside>

      <header className="sticky top-0 z-40 flex items-center justify-between bg-ink px-4 py-3 text-white lg:hidden">
        <button aria-label="Open menu" onClick={() => setOpen(true)}><Menu size={22} /></button>
        <span className="font-serif text-lg font-semibold">Chique Admin</span>
        <Link href="/" target="_blank" className="text-xs text-white/70">View store</Link>
      </header>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-ink">
            <div className="flex items-center justify-between px-6 py-5 text-white"><span className="font-serif text-lg font-semibold">Chique Admin</span><button aria-label="Close menu" onClick={() => setOpen(false)}><X size={20} /></button></div>
            {nav}
            {logout}
          </aside>
        </div>
      )}

      <main className="min-w-0 flex-1 p-5 sm:p-8 lg:p-10">{children}</main>
    </div>
  );
}
