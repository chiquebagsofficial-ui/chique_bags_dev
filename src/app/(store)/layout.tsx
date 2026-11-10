import Providers from "@/components/providers";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/layout/CartDrawer";
import WhatsAppButton from "@/components/store/WhatsAppButton";
import { getSessionUser } from "@/lib/auth";
import { getCards, getNavCategories } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [user, settings, categories, bestsellers] = await Promise.all([getSessionUser(), getSettings(), getNavCategories(), getCards({ isBestSeller: true }, 6)]);
  const picks = bestsellers.filter((p) => p.image).map((p) => ({ id: p.id, name: p.name, image: p.image! }));
  return (
    <Providers user={user}>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[999] focus:rounded-none focus:bg-white focus:px-4 focus:py-2">Skip to content</a>
      <Header categories={categories} announcement={settings.announcement} />
      <main id="main">{children}</main>
      <Footer settings={settings} categories={categories} picks={picks} />
      <CartDrawer />
      <WhatsAppButton number={settings.whatsapp} />
    </Providers>
  );
}
