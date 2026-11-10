import { Prisma, type Order, type OrderItem } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getRazorpay, isGatewayConfigured, isSimulatedPaymentAllowed } from "@/lib/razorpay";
import { sendOrderCancelled, sendOrderConfirmation, sendOwnerNewOrder } from "@/lib/emails";
import { ensureInvoiceNumber } from "@/lib/gst";
import { lookupPincode } from "@/lib/pincode";
import type { AddressInput } from "@/lib/validations";

type Tx = Prisma.TransactionClient;
export type OrderWithItems = Order & { items: OrderItem[] };

export interface CartLineInput {
  variantId: string;
  quantity: number;
}

export interface PricedLine {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  variantName: string;
  image: string | null;
  price: number;
  mrp: number;
  quantity: number;
  stock: number;
}

export type PriceResult =
  | {
      ok: true;
      lines: PricedLine[];
      subtotal: number;
      mrpTotal: number;
      discount: number;
      shipping: number;
      giftFee: number;
      total: number;
      couponCode: string | null;
      couponError: string | null;
    }
  | { ok: false; error: string; code?: string; variantId?: string };

/** The server is the only source of truth for prices, discounts, shipping and stock. */
export async function priceCart(
  items: CartLineInput[],
  opts: { couponCode?: string | null; userId?: string | null; giftBox?: boolean } = {}
): Promise<PriceResult> {
  const merged = new Map<string, number>();
  for (const it of items) merged.set(it.variantId, (merged.get(it.variantId) ?? 0) + it.quantity);

  const variants = await prisma.productVariant.findMany({
    where: { id: { in: [...merged.keys()] } },
    include: { product: true },
  });
  const byId = new Map(variants.map((v) => [v.id, v]));

  const lines: PricedLine[] = [];
  for (const [variantId, quantity] of merged) {
    const v = byId.get(variantId);
    if (!v || !v.product.isActive) {
      return { ok: false, error: "An item in your bag is no longer available. Please remove it and try again.", code: "UNAVAILABLE", variantId };
    }
    if (v.stock < quantity) {
      const label = `${v.product.name} (${v.name})`;
      return {
        ok: false,
        code: "STOCK",
        variantId,
        error: v.stock === 0 ? `${label} just sold out.` : `Only ${v.stock} left of ${label}.`,
      };
    }
    lines.push({
      variantId,
      productId: v.productId,
      slug: v.product.slug,
      name: v.product.name,
      variantName: v.name,
      image: v.product.images[0] ?? null,
      price: v.product.price,
      mrp: Math.max(v.product.originalPrice ?? v.product.price, v.product.price),
      quantity,
      stock: v.stock,
    });
  }

  const settings = await getSettings();
  const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);
  const mrpTotal = lines.reduce((s, l) => s + l.mrp * l.quantity, 0);

  let discount = 0;
  let couponCode: string | null = null;
  let couponError: string | null = null;
  if (opts.couponCode) {
    const res = await evaluateCoupon(opts.couponCode, subtotal, opts.userId ?? null);
    if (res.ok) {
      discount = res.discount;
      couponCode = res.code;
    } else {
      couponError = res.error;
    }
  }

  const shipping = 0; // free shipping on every order
  const giftFee = opts.giftBox && settings.giftBoxEnabled ? settings.giftBoxFee : 0;
  const total = Math.max(0, subtotal - discount + shipping + giftFee);

  return {
    ok: true,
    lines,
    subtotal,
    mrpTotal,
    discount,
    shipping,
    giftFee,
    total,
    couponCode,
    couponError,
  };
}

export async function evaluateCoupon(
  rawCode: string,
  subtotal: number,
  userId: string | null
): Promise<{ ok: true; code: string; discount: number } | { ok: false; error: string }> {
  const code = rawCode.trim().toUpperCase();
  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (!coupon || !coupon.isActive) return { ok: false, error: "This coupon code isn't valid." };
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return { ok: false, error: "This coupon has expired." };
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) return { ok: false, error: "This coupon has been fully redeemed." };
  if (subtotal < coupon.minOrder) return { ok: false, error: `Add items worth ₹${coupon.minOrder.toLocaleString("en-IN")} or more to use this coupon.` };
  if (coupon.oncePerUser && userId) {
    const used = await prisma.couponRedemption.count({ where: { couponId: coupon.id, userId } });
    if (used > 0) return { ok: false, error: "You've already used this coupon." };
  }
  let discount = coupon.type === "PERCENTAGE" ? Math.floor((subtotal * coupon.value) / 100) : coupon.value;
  if (coupon.type === "PERCENTAGE" && coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.min(discount, subtotal);
  return { ok: true, code: coupon.code, discount };
}

async function nextOrderNumber(tx: Tx): Promise<string> {
  const year = new Date().getFullYear();
  const counter = await tx.orderCounter.upsert({
    where: { year },
    create: { year, seq: 1 },
    update: { seq: { increment: 1 } },
  });
  return `CB-${String(year).slice(2)}-${String(counter.seq).padStart(5, "0")}`;
}

class StockError extends Error {
  constructor(public itemName: string) {
    super(`${itemName} is out of stock`);
  }
}

/** Reduces stock atomically. The `stock >= qty` guard means stock can never go negative. */
async function deductStock(tx: Tx, items: OrderItem[]) {
  for (const item of items) {
    if (!item.variantId) continue;
    const res = await tx.productVariant.updateMany({
      where: { id: item.variantId, stock: { gte: item.quantity } },
      data: { stock: { decrement: item.quantity } },
    });
    if (res.count === 0) throw new StockError(`${item.name}${item.variantName ? ` (${item.variantName})` : ""}`);
  }
}

async function restoreStock(tx: Tx, items: OrderItem[]) {
  for (const item of items) {
    if (!item.variantId) continue;
    await tx.productVariant.updateMany({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
  }
}

async function redeemCoupon(tx: Tx, order: Order) {
  if (!order.couponCode) return;
  const coupon = await tx.coupon.findUnique({ where: { code: order.couponCode } });
  if (!coupon) return;
  await tx.couponRedemption.create({ data: { couponId: coupon.id, userId: order.userId, orderId: order.id } });
  await tx.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
}

export interface CreateOrderInput {
  userId: string;
  name: string;
  email: string;
  phone: string;
  address: AddressInput;
  items: CartLineInput[];
  couponCode?: string | null;
  expectedTotal?: number;
  giftBox?: boolean;
  giftNote?: string | null;
}

export type CreateOrderResult =
  | {
      ok: true;
      orderId: string;
      orderNumber: string;
      method: "ONLINE";
      razorpayOrderId?: string;
      amountPaise?: number;
      simulated?: boolean;
    }
  | { ok: false; status: number; error: string; code?: string; total?: number };

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const settings = await getSettings();
  if (!isGatewayConfigured() && !isSimulatedPaymentAllowed()) {
    return { ok: false, status: 503, error: "Online payment is not available right now. Please try again later." };
  }

  if (input.giftBox && !settings.giftBoxEnabled) {
    return { ok: false, status: 400, error: "Gift boxes aren't available right now." };
  }
  const priced = await priceCart(input.items, { couponCode: input.couponCode, userId: input.userId, giftBox: input.giftBox });

  if (!priced.ok) return { ok: false, status: 409, error: priced.error, code: priced.code };
  if (priced.couponError) return { ok: false, status: 400, error: priced.couponError, code: "COUPON" };
  if (input.expectedTotal !== undefined && input.expectedTotal !== priced.total) {
    return { ok: false, status: 409, code: "PRICE_CHANGED", total: priced.total, error: "Prices changed while you were checking out. Please review your new total." };
  }

  // The pincode must exist. If the lookup service is down we accept a well-formed pincode.
  const pin = await lookupPincode(input.address.pincode);
  if (pin.status === "invalid") return { ok: false, status: 400, code: "PINCODE", error: "We couldn't find this pincode. Please check it and try again." };

  const addr = input.address;
  const shippingAddress = {
    name: addr.name,
    phone: addr.phone,
    line1: addr.line1,
    line2: addr.line2 || "",
    city: addr.city,
    state: addr.state,
    pincode: addr.pincode,
  };

  const order = await prisma.$transaction(async (tx) => {
    const orderNumber = await nextOrderNumber(tx);
    return tx.order.create({
      data: {
        orderNumber,
        userId: input.userId,
        status: "PENDING",
        subtotal: priced.subtotal,
        mrpTotal: priced.mrpTotal,
        discount: priced.discount,
        shipping: priced.shipping,
        giftBox: Boolean(input.giftBox),
        giftFee: priced.giftFee,
        giftNote: input.giftBox ? input.giftNote?.trim() || null : null,
        total: priced.total,
        couponCode: priced.couponCode,
        paymentMethod: "ONLINE",
        paymentStatus: "UNPAID",
        customerName: input.name,
        customerEmail: input.email,
        customerPhone: input.phone,
        shippingAddress,
        items: {
          create: priced.lines.map((l) => ({
            productId: l.productId,
            variantId: l.variantId,
            name: l.name,
            variantName: l.variantName,
            image: l.image,
            quantity: l.quantity,
            price: l.price,
            mrp: l.mrp,
          })),
        },
      },
      include: { items: true },
    });
  });

  // Online payment: create the gateway order, stock is taken once payment is verified.
  const amountPaise = priced.total * 100;
  const rp = getRazorpay();
  let razorpayOrderId: string;
  let simulated = false;
  if (rp) {
    try {
      const rpOrder = await rp.orders.create({ amount: amountPaise, currency: "INR", receipt: order.orderNumber });
      razorpayOrderId = rpOrder.id;
    } catch (err) {
      console.error("Razorpay order creation failed", err);
      await prisma.order.delete({ where: { id: order.id } }).catch(() => null);
      return { ok: false, status: 502, error: "Could not start the payment. Please try again." };
    }
  } else {
    razorpayOrderId = `sim_${order.orderNumber}`;
    simulated = true;
  }
  await prisma.order.update({ where: { id: order.id }, data: { razorpayOrderId } });
  return { ok: true, orderId: order.id, orderNumber: order.orderNumber, method: "ONLINE", razorpayOrderId, amountPaise, simulated };
}

/**
 * Marks an online order paid and takes stock. Called by the browser verification route AND by the
 * Razorpay webhook, so it is idempotent: whichever arrives second does nothing.
 */
export async function confirmOnlinePayment(orderId: string, razorpayPaymentId: string): Promise<{ ok: boolean; alreadyPaid?: boolean; soldOut?: boolean }> {
  const result = await prisma.$transaction(async (tx) => {
    // Lock the row so a simultaneous webhook and browser call can't both process it.
    await tx.$queryRaw`SELECT id FROM orders WHERE id = ${orderId} FOR UPDATE`;
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) return { ok: false as const };
    if (order.paymentStatus === "PAID") return { ok: true as const, alreadyPaid: true };
    if (order.status === "CANCELLED") {
      await tx.order.update({
        where: { id: orderId },
        data: { paymentStatus: "PAID", razorpayPaymentId, paidAt: new Date(), needsAttention: true, notes: "Paid after the order was cancelled. Refund required." },
      });
      return { ok: true as const, alreadyPaid: false, soldOut: false };
    }
    try {
      await deductStock(tx, order.items);
    } catch (err) {
      if (!(err instanceof StockError)) throw err;
      await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: "PAID",
          razorpayPaymentId,
          paidAt: new Date(),
          needsAttention: true,
          notes: `Payment received but ${err.itemName} sold out at the same moment. Refund or fulfil manually.`,
        },
      });
      return { ok: true as const, alreadyPaid: false, soldOut: true };
    }
    await tx.order.update({
      where: { id: orderId },
      data: { status: "CONFIRMED", paymentStatus: "PAID", razorpayPaymentId, paidAt: new Date(), stockDeducted: true },
    });
    await redeemCoupon(tx, order);
    return { ok: true as const, alreadyPaid: false, soldOut: false };
  });

  if (result.ok && !result.alreadyPaid) {
    void ensureInvoiceNumber(orderId).catch((e) => console.error("invoice number failed", e));
    void notifyNewOrder(orderId);
  }
  return result;
}

export async function markPaymentFailed(orderId: string) {
  await prisma.order.updateMany({ where: { id: orderId, paymentStatus: "UNPAID" }, data: { paymentStatus: "FAILED" } });
}

/** Sends the customer confirmation and the owner alert. Never throws. */
export async function notifyNewOrder(orderId: string) {
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) return;
    if (order.needsAttention) {
      // Paid but sold out: don't send a "confirmed" email. Alert the owner instead.
      await sendOwnerNewOrder(order);
      return;
    }
    await Promise.all([sendOrderConfirmation(order), sendOwnerNewOrder(order)]);
  } catch (err) {
    console.error("notifyNewOrder failed", err);
  }
}

export type CancelResult = { ok: true } | { ok: false; error: string };

/** Cancels an order that has not shipped, returns stock, releases the coupon and refunds online payments. */
export async function cancelOrder(orderId: string, opts: { by: "customer" | "admin"; userId?: string; reason?: string }): Promise<CancelResult> {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return { ok: false, error: "Order not found" };
  if (opts.by === "customer" && order.userId !== opts.userId) return { ok: false, error: "Order not found" };
  if (["SHIPPED", "DELIVERED"].includes(order.status)) return { ok: false, error: "This order has already shipped and can't be cancelled." };
  if (order.status === "CANCELLED") return { ok: false, error: "This order is already cancelled." };

  let refundNote: string | undefined;
  let paymentStatus = order.paymentStatus;
  let needsAttention = order.needsAttention;
  let notes = order.notes;

  if (order.paymentMethod === "ONLINE" && order.paymentStatus === "PAID") {
    const rp = getRazorpay();
    if (rp && order.razorpayPaymentId) {
      try {
        await rp.payments.refund(order.razorpayPaymentId, { amount: order.total * 100, speed: "normal" });
        paymentStatus = "REFUNDED";
        refundNote = "Your payment will be refunded to the original payment method within 5-7 working days.";
      } catch (err) {
        console.error("Refund failed", err);
        needsAttention = true;
        notes = "Cancelled but the automatic refund failed. Refund manually from the Razorpay dashboard.";
        refundNote = "Your refund is being processed and will reach you within 5-7 working days.";
      }
    } else {
      needsAttention = true;
      notes = "Cancelled after payment. Refund manually.";
      refundNote = "Your refund is being processed and will reach you within 5-7 working days.";
    }
  }

  await prisma.$transaction(async (tx) => {
    if (order.stockDeducted) await restoreStock(tx, order.items);
    if (order.couponCode) {
      const coupon = await tx.coupon.findUnique({ where: { code: order.couponCode } });
      if (coupon) {
        const del = await tx.couponRedemption.deleteMany({ where: { couponId: coupon.id, orderId: order.id } });
        if (del.count > 0) await tx.coupon.update({ where: { id: coupon.id }, data: { usedCount: { decrement: 1 } } });
      }
    }
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        stockDeducted: false,
        paymentStatus,
        needsAttention,
        notes: [notes, opts.reason ? `Cancelled: ${opts.reason}` : null].filter(Boolean).join(" | ") || null,
      },
    });
  });

  void sendOrderCancelled(order, refundNote);
  return { ok: true };
}
