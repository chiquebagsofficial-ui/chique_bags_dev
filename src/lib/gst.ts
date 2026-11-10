import type { Order, OrderItem } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { Settings } from "@/lib/settings";

// Money here is worked in paise (integers) so the tax columns always add up to the order total.

export interface GstLine {
  description: string;
  hsn: string;
  quantity: number;
  /** Taxable value in paise (price excluding GST, after the coupon share) */
  taxable: number;
  /** Total tax in paise */
  tax: number;
  /** Line total in paise (taxable + tax) */
  total: number;
}

export interface GstSummary {
  lines: GstLine[];
  rate: number;
  intraState: boolean;
  placeOfSupply: string;
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

/**
 * Prices on the website already include GST, so the taxable value is carved out of each line:
 * taxable = line total / (1 + rate). A coupon is shared across the product lines in proportion to their value.
 */
export function computeGst(order: Order & { items: OrderItem[] }, settings: Pick<Settings, "gstRate" | "hsnCode" | "businessState">): GstSummary {
  const addr = order.shippingAddress as Record<string, string>;
  const rate = settings.gstRate;
  const intraState = Boolean(settings.businessState) && norm(addr.state ?? "") === norm(settings.businessState);

  const gross = order.items.map((i) => ({ description: i.name + (i.variantName ? ` (${i.variantName})` : ""), quantity: i.quantity, paise: i.price * i.quantity * 100 }));
  if (order.giftFee > 0) gross.push({ description: "Gift box and note card", quantity: 1, paise: order.giftFee * 100 });

  const productGross = order.items.reduce((s, i) => s + i.price * i.quantity * 100, 0);
  const discountPaise = order.discount * 100;
  let allocated = 0;
  const lines: GstLine[] = gross.map((g, idx) => {
    const isGift = g.description === "Gift box and note card";
    let net = g.paise;
    if (!isGift && productGross > 0 && discountPaise > 0) {
      const share = idx === order.items.length - 1 ? discountPaise - allocated : Math.round((discountPaise * g.paise) / productGross);
      allocated += share;
      net = g.paise - share;
    }
    const taxable = Math.round(net / (1 + rate / 100));
    return { description: g.description, hsn: settings.hsnCode, quantity: g.quantity, taxable, tax: net - taxable, total: net };
  });

  const taxable = lines.reduce((s, l) => s + l.taxable, 0);
  const totalTax = lines.reduce((s, l) => s + l.tax, 0);
  const cgst = intraState ? Math.round(totalTax / 2) : 0;
  const sgst = intraState ? totalTax - cgst : 0;
  const igst = intraState ? 0 : totalTax;
  return { lines, rate, intraState, placeOfSupply: addr.state ?? "", taxable, cgst, sgst, igst, total: lines.reduce((s, l) => s + l.total, 0) };
}

export const money = (paise: number) => (paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── Amount in words (Indian numbering) ────────────────────────────────

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function below1000(n: number): string {
  const parts: string[] = [];
  if (n >= 100) {
    parts.push(`${ONES[Math.floor(n / 100)]} Hundred`);
    n %= 100;
  }
  if (n >= 20) {
    parts.push(TENS[Math.floor(n / 10)] + (n % 10 ? ` ${ONES[n % 10]}` : ""));
  } else if (n > 0) parts.push(ONES[n]);
  return parts.join(" ");
}

export function rupeesInWords(rupees: number): string {
  if (rupees === 0) return "Zero Rupees only";
  const crore = Math.floor(rupees / 10000000);
  const lakh = Math.floor((rupees % 10000000) / 100000);
  const thousand = Math.floor((rupees % 100000) / 1000);
  const rest = rupees % 1000;
  const words = [crore && `${below1000(crore)} Crore`, lakh && `${below1000(lakh)} Lakh`, thousand && `${below1000(thousand)} Thousand`, rest && below1000(rest)].filter(Boolean);
  return `${words.join(" ")} Rupees only`;
}

// ─── Invoice numbers ───────────────────────────────────────────────────

/** Indian financial year label for a date, e.g. 10 Nov 2026 -> "26-27". */
export function financialYear(d: Date): string {
  const y = d.getFullYear();
  const start = d.getMonth() >= 3 ? y : y - 1;
  return `${String(start).slice(2)}-${String(start + 1).slice(2)}`;
}

/** Gives a paid order its invoice number the first time one is needed. Numbers are never reused. */
export async function ensureInvoiceNumber(orderId: string): Promise<{ invoiceNumber: string; invoiceDate: Date } | null> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return null;
  if (order.invoiceNumber && order.invoiceDate) return { invoiceNumber: order.invoiceNumber, invoiceDate: order.invoiceDate };
  if (order.paymentStatus === "UNPAID" || order.paymentStatus === "FAILED") return null;

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM orders WHERE id = ${orderId} FOR UPDATE`;
    const fresh = await tx.order.findUnique({ where: { id: orderId } });
    if (fresh?.invoiceNumber && fresh.invoiceDate) return { invoiceNumber: fresh.invoiceNumber, invoiceDate: fresh.invoiceDate };
    const date = order.paidAt ?? new Date();
    const fy = financialYear(date);
    const counter = await tx.invoiceCounter.upsert({ where: { fy }, create: { fy, seq: 1 }, update: { seq: { increment: 1 } } });
    const invoiceNumber = `CB/${fy}/${String(counter.seq).padStart(5, "0")}`;
    await tx.order.update({ where: { id: orderId }, data: { invoiceNumber, invoiceDate: date } });
    return { invoiceNumber, invoiceDate: date };
  });
}
