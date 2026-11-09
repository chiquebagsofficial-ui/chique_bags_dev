import type { Metadata } from "next";
import WishlistView from "@/components/store/WishlistView";

export const metadata: Metadata = { title: "Your favourites", robots: { index: false } };

export default function WishlistPage() {
  return <WishlistView />;
}
