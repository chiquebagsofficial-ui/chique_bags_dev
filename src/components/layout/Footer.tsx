import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Instagram } from "@/components/icons";
import NewsletterForm from "@/components/layout/NewsletterForm";
import type { Settings } from "@/lib/settings";

export default function Footer({ settings, categories, picks }: { settings: Settings; categories: { name: string; slug: string }[]; picks: { id: string; name: string; image: string }[] }) {
  const link = "text-[0.88rem] text-white/65 transition hover:text-white";
  return (
    <footer className="mt-28">
      {/* Instagram-style strip of our bestselling bags */}
      {picks.length > 0 && (
        <section aria-label="Follow us on Instagram">
          <div className="wrap mb-8 text-center">
            <p className="eyebrow">Our bestsellers on Instagram</p>
            <h2 className="h-display mt-3 text-3xl sm:text-4xl">
              <a href={settings.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 hover:text-berry"><Instagram size={26} /> @chiquebagsofficial</a>
            </h2>
          </div>
          <div className="grid grid-cols-3 lg:grid-cols-6">
            {picks.map((p) => (
              <a key={p.id} href={settings.instagram} target="_blank" rel="noopener noreferrer" className="group relative aspect-square overflow-hidden bg-cream">
                <Image src={p.image} alt={`${p.name} on Instagram`} fill sizes="(min-width:1024px) 17vw, 33vw" className="object-cover transition duration-700 group-hover:scale-105" />
                <span className="absolute inset-0 grid place-items-center bg-ink/0 text-white opacity-0 transition group-hover:bg-ink/40 group-hover:opacity-100"><Instagram size={26} /></span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* newsletter */}
      <section className="mt-20 bg-blush">
        <div className="wrap py-16 text-center lg:py-20">
          <p className="eyebrow">The Chique list</p>
          <h2 className="h-display mt-4 text-3xl sm:text-5xl">New drops, first</h2>
          <p className="mx-auto mt-4 max-w-md text-muted">Be the first to know about new arrivals, restocks and the occasional private offer.</p>
          <div className="mt-8"><NewsletterForm /></div>
        </div>
      </section>

      <div className="bg-ink text-white">
        <div className="wrap grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr]">
          <div>
            <p className="font-serif text-3xl font-medium uppercase tracking-[0.3em]">Chique</p>
            <p className="mt-1 text-[0.55rem] font-medium uppercase tracking-[0.62em] text-gold">Bags</p>
            <p className="mt-6 max-w-xs text-[0.9rem] leading-relaxed text-white/65">
              Handcrafted sling and crossbody bags, finished with gold-tone hardware and made with care in India.
            </p>
            {settings.instagram && (
              <a href={settings.instagram} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 text-[0.85rem] text-white/80 hover:text-white"><Instagram size={18} /> @chiquebagsofficial</a>
            )}
          </div>

          <div>
            <h3 className="text-[0.68rem] font-medium uppercase tracking-[0.3em] text-gold">Shop</h3>
            <ul className="mt-5 space-y-3">
              <li><Link href="/shop" className={link}>All bags</Link></li>
              {categories.map((c) => <li key={c.slug}><Link href={`/shop?category=${c.slug}`} className={link}>{c.name}</Link></li>)}
              <li><Link href="/shop?max=999" className={link}>Under ₹999</Link></li>
              <li><Link href="/gifting" className={link}>Gifting</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-[0.68rem] font-medium uppercase tracking-[0.3em] text-gold">Care</h3>
            <ul className="mt-5 space-y-3">
              <li><Link href="/track" className={link}>Track your order</Link></li>
              <li><Link href="/shipping" className={link}>Shipping &amp; delivery</Link></li>
              <li><Link href="/returns" className={link}>Returns &amp; exchange</Link></li>
              <li><Link href="/terms" className={link}>Terms &amp; conditions</Link></li>
              <li><Link href="/privacy" className={link}>Privacy policy</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-[0.68rem] font-medium uppercase tracking-[0.3em] text-gold">Contact</h3>
            <ul className="mt-5 space-y-3 text-[0.88rem] text-white/65">
              {settings.contactEmail && <li className="flex items-center gap-2.5"><Mail size={15} /> {settings.contactEmail}</li>}
              {settings.contactPhone && <li className="flex items-center gap-2.5"><Phone size={15} /> {settings.contactPhone}</li>}
              {settings.address && <li className="flex items-center gap-2.5"><MapPin size={15} /> {settings.address}</li>}
              <li><Link href="/contact" className="text-white underline underline-offset-4">Write to us</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="wrap flex flex-col justify-between gap-2 py-6 text-[0.72rem] uppercase tracking-[0.18em] text-white/45 sm:flex-row">
            <p>© {new Date().getFullYear()} Chique Bags</p>
            <p>Prepaid orders · UPI · Cards · Net banking</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
