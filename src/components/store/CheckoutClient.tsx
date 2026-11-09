"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Banknote, CheckCircle2, CreditCard, Gift, Lock } from "lucide-react";
import { useCart, useToast } from "@/components/providers";
import CouponBox from "@/components/store/CouponBox";
import PriceSummary from "@/components/store/PriceSummary";
import { usePricing } from "@/components/store/usePricing";
import { cn, formatINR } from "@/lib/utils";

interface Addr { id?: string; name: string; phone: string; line1: string; line2: string; city: string; state: string; pincode: string }
const EMPTY: Addr = { name: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "" };

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void; on: (e: string, cb: () => void) => void };
  }
}

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

interface Props {
  user: { id: string; name: string; email: string; phone: string | null } | null;
  addresses: Addr[];
  codEnabled: boolean;
  codFee: number;
  gift: { enabled: boolean; fee: number; image: string };
  onlineAvailable: boolean;
  simulated: boolean;
}

export default function CheckoutClient({ user, addresses, codEnabled, codFee, gift, onlineAvailable, simulated }: Props) {
  const cart = useCart();
  const toast = useToast();
  const router = useRouter();

  const [coupon, setCoupon] = useState<string | null>(null);
  const [method, setMethod] = useState<"ONLINE" | "COD">(onlineAvailable ? "ONLINE" : "COD");
  const [selected, setSelected] = useState<string | "new">(addresses[0]?.id ?? "new");
  const [form, setForm] = useState<Addr>({ ...EMPTY, name: user?.name ?? "", phone: user?.phone ?? "" });
  const [saveAddress, setSaveAddress] = useState(true);
  const [giftBox, setGiftBox] = useState(false);
  const [giftNote, setGiftNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [testPay, setTestPay] = useState<{ orderId: string } | null>(null);

  const { data, error } = usePricing(cart.items, coupon, method, cart.ready, giftBox);

  // Guest verification state
  const [gName, setGName] = useState("");
  const [gEmail, setGEmail] = useState("");
  const [gCode, setGCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [gBusy, setGBusy] = useState(false);
  const [gError, setGError] = useState<string | null>(null);

  useEffect(() => {
    if (user && form.name === "") setForm((f) => ({ ...f, name: user.name, phone: user.phone ?? f.phone }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const set = (k: keyof Addr) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function post(url: string, body: unknown) {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return { res, body: await res.json().catch(() => ({})) };
  }

  async function sendCode() {
    setGBusy(true);
    setGError(null);
    const { res, body } = await post("/api/auth/checkout/send-code", { email: gEmail });
    setGBusy(false);
    if (res.ok) setCodeSent(true);
    else setGError(body.error ?? "Could not send the code");
  }

  async function verifyCode() {
    setGBusy(true);
    setGError(null);
    const { res, body } = await post("/api/auth/checkout/verify-code", { email: gEmail, code: gCode, name: gName });
    setGBusy(false);
    if (res.ok) router.refresh();
    else setGError(body.error ?? "That code didn't work");
  }

  async function placeOrder() {
    setMessage(null);
    const address = selected === "new" ? form : addresses.find((a) => a.id === selected)!;
    if (!address) return;
    setBusy(true);
    const { res, body } = await post("/api/orders", {
      items: cart.items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
      address,
      method,
      couponCode: data?.couponCode ?? null,
      expectedTotal: data?.total,
      giftBox,
      giftNote: giftBox ? giftNote : null,
    });

    if (!res.ok) {
      setBusy(false);
      setMessage(body.error ?? "Could not place your order");
      if (body.code === "PRICE_CHANGED") toast("Prices changed. Please review your new total.");
      return;
    }

    if (selected === "new" && saveAddress) {
      fetch("/api/account/addresses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, isDefault: addresses.length === 0 }) }).catch(() => {});
    }

    const done = (id: string) => {
      cart.clear();
      router.push(`/order-success?id=${id}`);
    };
    const failed = (id: string) => router.push(`/order-failed?id=${id}`);

    if (body.method === "COD") return done(body.orderId);

    if (body.simulated) {
      setBusy(false);
      setTestPay({ orderId: body.orderId });
      return;
    }

    const loaded = await loadRazorpay();
    if (!loaded || !window.Razorpay) {
      setBusy(false);
      setMessage("Could not load the payment window. Check your connection and try again.");
      return;
    }
    const rzp = new window.Razorpay({
      key: body.keyId,
      amount: body.amount,
      currency: body.currency,
      name: "Chique Bags",
      description: `Order ${body.orderNumber}`,
      order_id: body.razorpayOrderId,
      prefill: { name: address.name, email: user?.email, contact: address.phone },
      theme: { color: "#d8899f" },
      handler: async (r: { razorpay_payment_id: string; razorpay_signature: string }) => {
        const v = await post("/api/orders/verify", { orderId: body.orderId, razorpayPaymentId: r.razorpay_payment_id, razorpaySignature: r.razorpay_signature });
        if (v.res.ok) done(body.orderId);
        else failed(body.orderId);
      },
      modal: { ondismiss: () => setBusy(false) },
    });
    rzp.on("payment.failed", () => {
      post("/api/orders/verify", { orderId: body.orderId, failed: true });
      failed(body.orderId);
    });
    rzp.open();
  }

  async function finishTestPayment(success: boolean) {
    if (!testPay) return;
    setBusy(true);
    const v = await post("/api/orders/verify", success ? { orderId: testPay.orderId } : { orderId: testPay.orderId, failed: true });
    if (success && v.res.ok) {
      cart.clear();
      router.push(`/order-success?id=${testPay.orderId}`);
    } else router.push(`/order-failed?id=${testPay.orderId}`);
  }

  if (!cart.ready) return <div className="wrap min-h-[50vh] py-20" />;
  if (cart.items.length === 0) {
    return (
      <div className="wrap py-28 text-center">
        <h1 className="h-display text-4xl">Your bag is empty</h1>
        <Link href="/shop" className="btn btn-dark mt-8">Shop bags</Link>
      </div>
    );
  }

  const addrValid = selected !== "new" || (form.name.length > 1 && /^[+\d][\d\s-]{8,16}$/.test(form.phone) && form.line1.length > 2 && form.city.length > 1 && form.state.length > 1 && /^\d{6}$/.test(form.pincode));
  const ready = Boolean(user) && addrValid && Boolean(data) && !error;

  return (
    <div className="wrap py-10 lg:py-14">
      <h1 className="h-display mb-8 text-4xl">Checkout</h1>
      <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-8">
          {/* 1. Contact */}
          <section className="card p-6">
            <h2 className="mb-4 flex items-center gap-3 font-serif text-xl font-semibold"><span className="grid h-7 w-7 place-items-center rounded-full bg-ink text-sm text-white">1</span> Contact</h2>
            {user ? (
              <p className="flex items-center gap-2 text-sm"><CheckCircle2 size={18} className="text-emerald-600" /> Signed in as <strong>{user.name}</strong> ({user.email})</p>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted">Verify your email to place your order, no password needed. Already have an account? <Link href="/login?next=/checkout" className="font-semibold text-ink underline">Log in</Link></p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><label className="label" htmlFor="g-name">Full name</label><input id="g-name" className="input" value={gName} onChange={(e) => setGName(e.target.value)} autoComplete="name" /></div>
                  <div><label className="label" htmlFor="g-email">Email</label><input id="g-email" type="email" className="input" value={gEmail} onChange={(e) => setGEmail(e.target.value)} autoComplete="email" disabled={codeSent} /></div>
                </div>
                {codeSent && (
                  <div>
                    <label className="label" htmlFor="g-code">6-digit code sent to {gEmail}</label>
                    <input id="g-code" inputMode="numeric" maxLength={6} className="input max-w-[200px] text-center text-xl tracking-[0.4em]" value={gCode} onChange={(e) => setGCode(e.target.value.replace(/\D/g, ""))} />
                  </div>
                )}
                {gError && <p className="text-sm font-medium text-berry">{gError}</p>}
                {!codeSent ? (
                  <button className="btn btn-dark btn-sm" disabled={gBusy || gName.trim().length < 2 || !gEmail.includes("@")} onClick={sendCode}>{gBusy ? "Sending…" : "Email me a code"}</button>
                ) : (
                  <div className="flex gap-3">
                    <button className="btn btn-dark btn-sm" disabled={gBusy || gCode.length !== 6} onClick={verifyCode}>{gBusy ? "Checking…" : "Verify & continue"}</button>
                    <button className="btn btn-line btn-sm" onClick={() => { setCodeSent(false); setGCode(""); }}>Change email</button>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* 2. Address */}
          <section className={cn("card p-6 transition", !user && "pointer-events-none opacity-50")}>
            <h2 className="mb-4 flex items-center gap-3 font-serif text-xl font-semibold"><span className="grid h-7 w-7 place-items-center rounded-full bg-ink text-sm text-white">2</span> Delivery address</h2>
            <div className="space-y-3">
              {addresses.map((a) => (
                <label key={a.id} className={cn("flex cursor-pointer gap-3 rounded-xl border-[1.5px] p-4 text-sm", selected === a.id ? "border-ink bg-cream" : "border-[#e7e0dc]")}>
                  <input type="radio" name="addr" className="mt-1 accent-[#1a1a1a]" checked={selected === a.id} onChange={() => setSelected(a.id!)} />
                  <span><strong>{a.name}</strong> · {a.phone}<br />{a.line1}{a.line2 && `, ${a.line2}`}<br />{a.city}, {a.state} {a.pincode}</span>
                </label>
              ))}
              {addresses.length > 0 && (
                <label className={cn("flex cursor-pointer items-center gap-3 rounded-xl border-[1.5px] p-4 text-sm font-medium", selected === "new" ? "border-ink bg-cream" : "border-[#e7e0dc]")}>
                  <input type="radio" name="addr" className="accent-[#1a1a1a]" checked={selected === "new"} onChange={() => setSelected("new")} /> Use a new address
                </label>
              )}
            </div>
            {selected === "new" && (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div><label className="label" htmlFor="a-name">Recipient name</label><input id="a-name" className="input" value={form.name} onChange={set("name")} autoComplete="name" /></div>
                <div><label className="label" htmlFor="a-phone">Phone</label><input id="a-phone" inputMode="tel" className="input" value={form.phone} onChange={set("phone")} autoComplete="tel" /></div>
                <div className="sm:col-span-2"><label className="label" htmlFor="a-l1">Address</label><input id="a-l1" className="input" value={form.line1} onChange={set("line1")} placeholder="House no., building, street" autoComplete="address-line1" /></div>
                <div className="sm:col-span-2"><label className="label" htmlFor="a-l2">Landmark / area (optional)</label><input id="a-l2" className="input" value={form.line2} onChange={set("line2")} autoComplete="address-line2" /></div>
                <div><label className="label" htmlFor="a-city">City</label><input id="a-city" className="input" value={form.city} onChange={set("city")} autoComplete="address-level2" /></div>
                <div><label className="label" htmlFor="a-state">State</label><input id="a-state" className="input" value={form.state} onChange={set("state")} autoComplete="address-level1" /></div>
                <div><label className="label" htmlFor="a-pin">Pincode</label><input id="a-pin" inputMode="numeric" maxLength={6} className="input" value={form.pincode} onChange={set("pincode")} autoComplete="postal-code" /></div>
                <label className="flex items-center gap-2 self-end pb-3 text-sm"><input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="accent-[#1a1a1a]" /> Save for next time</label>
              </div>
            )}
          </section>

          {/* 3. Gift options */}
          {gift.enabled && (
            <section className={cn("card p-6 transition", !user && "pointer-events-none opacity-50")}>
              <h2 className="mb-4 flex items-center gap-3 font-serif text-xl font-semibold"><span className="grid h-7 w-7 place-items-center rounded-full bg-ink text-sm text-white">3</span> Gift options</h2>
              <label className={cn("flex cursor-pointer items-start gap-4 rounded-xl border-[1.5px] p-4", giftBox ? "border-ink bg-cream" : "border-[#e7e0dc]")}>
                <input type="checkbox" className="mt-1 h-4 w-4 accent-[#1a1a1a]" checked={giftBox} onChange={(e) => setGiftBox(e.target.checked)} />
                {gift.image && <span className="relative hidden h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white sm:block"><Image src={gift.image} alt="" fill sizes="80px" className="object-cover" /></span>}
                <span className="text-sm">
                  <span className="flex items-center gap-2 font-semibold"><Gift size={17} /> Add a gift box {gift.fee > 0 ? `for ${formatINR(gift.fee)}` : "(free)"}</span>
                  <span className="text-muted">Your bag arrives in our signature gift box with tissue and ribbon, with a handwritten note card from you.</span>
                </span>
              </label>
              {giftBox && (
                <div className="mt-4">
                  <label className="label" htmlFor="gift-note">Your message (optional, we'll write it on the card)</label>
                  <textarea id="gift-note" className="input min-h-24" maxLength={200} placeholder="Happy birthday! Wishing you the best year yet." value={giftNote} onChange={(e) => setGiftNote(e.target.value)} />
                  <p className="mt-1 text-right text-xs text-muted">{giftNote.length}/200</p>
                </div>
              )}
            </section>
          )}

          {/* 4. Payment */}
          <section className={cn("card p-6 transition", !user && "pointer-events-none opacity-50")}>
            <h2 className="mb-4 flex items-center gap-3 font-serif text-xl font-semibold"><span className="grid h-7 w-7 place-items-center rounded-full bg-ink text-sm text-white">{gift.enabled ? 4 : 3}</span> Payment</h2>
            <div className="space-y-3">
              {onlineAvailable && (
                <label className={cn("flex cursor-pointer items-start gap-3 rounded-xl border-[1.5px] p-4", method === "ONLINE" ? "border-ink bg-cream" : "border-[#e7e0dc]")}>
                  <input type="radio" name="pay" className="mt-1 accent-[#1a1a1a]" checked={method === "ONLINE"} onChange={() => setMethod("ONLINE")} />
                  <span className="text-sm"><span className="flex items-center gap-2 font-semibold"><CreditCard size={17} /> Pay online</span><span className="text-muted">UPI, cards, net banking and wallets{simulated && " (test mode, no real payment)"}</span></span>
                </label>
              )}
              {codEnabled && (
                <label className={cn("flex cursor-pointer items-start gap-3 rounded-xl border-[1.5px] p-4", method === "COD" ? "border-ink bg-cream" : "border-[#e7e0dc]")}>
                  <input type="radio" name="pay" className="mt-1 accent-[#1a1a1a]" checked={method === "COD"} onChange={() => setMethod("COD")} />
                  <span className="text-sm"><span className="flex items-center gap-2 font-semibold"><Banknote size={17} /> Cash on delivery</span><span className="text-muted">Pay when your order arrives{codFee > 0 && ` (+${formatINR(codFee)} fee)`}</span></span>
                </label>
              )}
            </div>
          </section>
        </div>

        {/* Summary */}
        <aside className="card h-fit space-y-6 p-6 lg:sticky lg:top-28">
          <h2 className="font-serif text-xl font-semibold">Order summary</h2>
          <ul className="space-y-4">
            {cart.items.map((i) => (
              <li key={i.variantId} className="flex items-center gap-3 text-sm">
                <span className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-cream">
                  {i.image && <Image src={i.image} alt="" fill sizes="56px" className="object-cover" />}
                  <span className="absolute -right-0 -top-0 grid h-5 min-w-5 place-items-center rounded-bl-lg bg-ink px-1 text-[0.65rem] font-bold text-white">{i.quantity}</span>
                </span>
                <span className="min-w-0 flex-1"><span className="line-clamp-1 font-medium">{i.name}</span><span className="text-xs text-muted">{i.variantName}</span></span>
                <span className="font-semibold">{formatINR(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <CouponBox applied={data?.couponCode ?? null} error={data?.couponError ?? null} onApply={setCoupon} onRemove={() => setCoupon(null)} />
          {data ? <PriceSummary p={data} /> : error ? null : <p className="text-sm text-muted">Calculating…</p>}
          {error && <p className="rounded-xl bg-blush p-3 text-sm font-medium text-berry">{error.message} <Link href="/cart" className="underline">Review your bag</Link></p>}
          {message && <p role="alert" className="rounded-xl bg-blush p-3 text-sm font-medium text-berry">{message}</p>}
          <button className="btn btn-dark btn-block !py-4" disabled={!ready || busy} onClick={placeOrder}>
            <Lock size={15} /> {busy ? "Please wait…" : method === "COD" ? `Place order · ${data ? formatINR(data.total) : ""}` : `Pay ${data ? formatINR(data.total) : ""}`}
          </button>
          {!user && <p className="text-center text-xs text-muted">Verify your email above to continue.</p>}
          <p className="text-center text-xs text-muted">By placing your order you agree to our <Link href="/terms" className="underline">terms</Link> and <Link href="/returns" className="underline">exchange policy</Link>.</p>
        </aside>
      </div>

      {testPay && (
        <div className="fixed inset-0 z-[400] grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-2xl">
            <p className="eyebrow">Test payment</p>
            <h3 className="font-serif mt-2 text-2xl font-semibold">Razorpay isn't connected yet</h3>
            <p className="mt-2 text-sm text-muted">This is a development-only stand-in for the payment window. Choose the outcome to test.</p>
            <button className="btn btn-dark btn-block mt-6" disabled={busy} onClick={() => finishTestPayment(true)}>Simulate successful payment</button>
            <button className="btn btn-line btn-block mt-3" disabled={busy} onClick={() => finishTestPayment(false)}>Simulate failed payment</button>
          </div>
        </div>
      )}
    </div>
  );
}
