import Providers from "@/components/providers";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/layout/CartDrawer";
import MobileTabBar from "@/components/layout/MobileTabBar";
import { getSessionUser } from "@/lib/auth";
import { getNavCategories } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [user, settings, categories] = await Promise.all([getSessionUser(), getSettings(), getNavCategories()]);
  return (
    <Providers user={user}>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[999] focus:rounded-full focus:bg-white focus:px-4 focus:py-2">Skip to content</a>
      <Header categories={categories} announcement={settings.announcement} />
      <main id="main">{children}</main>
      <Footer settings={settings} categories={categories} />
      <CartDrawer freeShippingThreshold={settings.freeShippingThreshold} />
      <MobileTabBar />
    </Providers>
  );
}
