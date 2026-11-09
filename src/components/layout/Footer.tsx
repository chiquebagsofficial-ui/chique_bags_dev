import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Instagram } from "@/components/icons";
import NewsletterForm from "@/components/layout/NewsletterForm";
import type { Settings } from "@/lib/settings";

export default function Footer({ settings, categories }: { settings: Settings; categories: { name: string; slug: string }[] }) {
  const link = "text-sm text-white/70 transition hover:text-rose-soft";
  return (
    <footer className="mt-24 bg-ink pb-24 text-white lg:pb-0">
      <div className="wrap grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
        <div>
          <p className="font-serif text-2xl font-semibold">Chique Bags</p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/70">
            Handcrafted sling and crossbody bags in cruelty-free vegan leather, with gold-finish hardware. Made in India.
          </p>
          <ul className="mt-6 space-y-2.5 text-sm text-white/70">
            {settings.instagram && (
              <li><a href={settings.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-rose-soft"><Instagram size={16} /> @chiquebagsofficial</a></li>
            )}
            {settings.contactEmail && <li className="flex items-center gap-2"><Mail size={16} /> {settings.contactEmail}</li>}
            {settings.contactPhone && <li className="flex items-center gap-2"><Phone size={16} /> {settings.contactPhone}</li>}
            {settings.address && <li className="flex items-center gap-2"><MapPin size={16} /> {settings.address}</li>}
          </ul>
        </div>

        <div>
          <h3 className="eyebrow !text-rose-soft">Shop</h3>
          <ul className="mt-5 space-y-3">
            <li><Link href="/shop" className={link}>All bags</Link></li>
            {categories.map((c) => <li key={c.slug}><Link href={`/shop?category=${c.slug}`} className={link}>{c.name}</Link></li>)}
            <li><Link href="/shop?max=999" className={link}>Under ₹999</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="eyebrow !text-rose-soft">Customer care</h3>
          <ul className="mt-5 space-y-3">
            <li><Link href="/track" className={link}>Track your order</Link></li>
            <li><Link href="/shipping" className={link}>Shipping &amp; delivery</Link></li>
            <li><Link href="/returns" className={link}>Returns &amp; exchange</Link></li>
            <li><Link href="/terms" className={link}>Terms &amp; conditions</Link></li>
            <li><Link href="/privacy" className={link}>Privacy policy</Link></li>
            <li><Link href="/contact" className={link}>Contact us</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="eyebrow !text-rose-soft">Stay in the loop</h3>
          <p className="mb-4 mt-5 text-sm leading-relaxed text-white/70">New drops, restocks and the occasional offer. No spam.</p>
          <NewsletterForm />
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="wrap flex flex-col justify-between gap-2 py-6 text-xs text-white/50 sm:flex-row">
          <p>© {new Date().getFullYear()} Chique Bags. All rights reserved.</p>
          <p>Secure checkout · UPI, cards, net banking &amp; cash on delivery</p>
        </div>
      </div>
    </footer>
  );
}
