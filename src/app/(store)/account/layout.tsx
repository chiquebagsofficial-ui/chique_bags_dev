import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import LogoutButton from "@/components/store/LogoutButton";

export const dynamic = "force-dynamic";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/account");
  const tab = "rounded-full px-5 py-2.5 text-sm font-medium hover:bg-blush";
  return (
    <div className="wrap py-10 lg:py-14">
      <div className="no-print mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">My account</p>
          <h1 className="h-display mt-1 text-4xl">Hi, {user.name.split(" ")[0]}</h1>
        </div>
        <LogoutButton />
      </div>
      <nav className="no-print no-scrollbar mb-10 flex gap-2 overflow-x-auto border-b border-line pb-4" aria-label="Account">
        <Link href="/account" className={tab}>Profile &amp; addresses</Link>
        <Link href="/account/orders" className={tab}>My orders</Link>
        <Link href="/wishlist" className={tab}>Favourites</Link>
      </nav>
      {children}
    </div>
  );
}
