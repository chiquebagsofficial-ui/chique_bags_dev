import type { Metadata } from "next";
import CheckoutClient from "@/components/store/CheckoutClient";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isGatewayConfigured, isSimulatedPaymentAllowed } from "@/lib/razorpay";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const [user, settings] = await Promise.all([getSessionUser(), getSettings()]);
  const addresses = user
    ? await prisma.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { id: "desc" }] })
    : [];
  return (
    <CheckoutClient
      user={user}
      addresses={addresses.map((a) => ({ id: a.id, name: a.name, phone: a.phone, line1: a.line1, line2: a.line2 ?? "", city: a.city, state: a.state, pincode: a.pincode }))}
      gift={{ enabled: settings.giftBoxEnabled, fee: settings.giftBoxFee, image: settings.giftBoxImage }}
      onlineAvailable={isGatewayConfigured() || isSimulatedPaymentAllowed()}
      simulated={isSimulatedPaymentAllowed()}
    />
  );
}
