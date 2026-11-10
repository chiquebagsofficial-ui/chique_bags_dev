import type { Order, OrderItem, Prisma, ReturnReason, ReturnRequest, ReturnStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getRazorpay } from "@/lib/razorpay";
import { sendReturnReceived, sendReturnUpdate } from "@/lib/emails";

type Tx = Prisma.TransactionClient;

export const RETURN_WINDOW_DAYS = 7;

export const REASON_LABEL: Record<ReturnReason, string> = {
  DAMAGED: "Damaged when it arrived",
  DEFECTIVE: "Defective or faulty",
  WRONG_ITEM: "Wrong item received",
  NOT_AS_DESCRIBED: "Not as described",
  OTHER: "Other",
};

export const STATUS_LABEL: Record<ReturnStatus, string> = {
  REQUESTED: "Requested",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  RECEIVED: "Item received",
  REFUNDED: "Refunded",
  CLOSED: "Closed",
};

export interface ReturnItemSnapshot {
  orderItemId: string;
  name: string;
  variantName: string | null;
  quantity: number;
  price: number;
}

export const OPEN_STATUSES: ReturnStatus[] = ["REQUESTED", "APPROVED", "RECEIVED"];

/** Last day a customer can report a problem: seven days after delivery. */
export function returnDeadline(order: Pick<Order, "deliveredAt" | "updatedAt">): Date {
  const base = order.deliveredAt ?? order.updatedAt;
  return new Date(base.getTime() + RETURN_WINDOW_DAYS * 86400_000);
}

export function canRequestReturn(order: Pick<Order, "status" | "deliveredAt" | "updatedAt" | "paymentStatus" | "refundedAmount" | "total">): boolean {
  return order.status === "DELIVERED" && order.paymentStatus !== "REFUNDED" && order.refundedAmount < order.total && returnDeadline(order) > new Date();
}

async function nextReturnNumber(tx: Tx): Promise<string> {
  const year = new Date().getFullYear();
  const c = await tx.returnCounter.upsert({ where: { year }, create: { year, seq: 1 }, update: { seq: { increment: 1 } } });
  return `RR-${String(year).slice(2)}-${String(c.seq).padStart(4, "0")}`;
}

export interface CreateReturnInput {
  order: Order & { items: OrderItem[] };
  userId: string;
  reason: ReturnReason;
  details: string;
  photos: string[];
  items: { orderItemId: string; quantity: number }[];
  byAdmin?: { name: string } | null;
}

export type ReturnActionResult<T = ReturnRequest> = { ok: true; data: T } | { ok: false; status: number; error: string };

export async function createReturn(input: CreateReturnInput): Promise<ReturnActionResult> {
  const { order } = input;

  const open = await prisma.returnRequest.count({ where: { orderId: order.id, status: { in: OPEN_STATUSES } } });
  if (open > 0) return { ok: false, status: 409, error: "There is already an open request for this order." };

  const snapshot: ReturnItemSnapshot[] = [];
  for (const sel of input.items) {
    const item = order.items.find((i) => i.id === sel.orderItemId);
    if (!item) return { ok: false, status: 400, error: "That item isn't part of this order." };
    if (sel.quantity < 1 || sel.quantity > item.quantity) return { ok: false, status: 400, error: `Choose between 1 and ${item.quantity} for ${item.name}.` };
    snapshot.push({ orderItemId: item.id, name: item.name, variantName: item.variantName, quantity: sel.quantity, price: item.price });
  }
  if (snapshot.length === 0) return { ok: false, status: 400, error: "Choose at least one item." };

  const actor = input.byAdmin ? input.byAdmin.name : "customer";
  const created = await prisma.$transaction(async (tx) => {
    const number = await nextReturnNumber(tx);
    return tx.returnRequest.create({
      data: {
        number,
        orderId: order.id,
        userId: input.userId,
        reason: input.reason,
        details: input.details,
        photos: input.photos,
        items: snapshot as unknown as Prisma.InputJsonValue,
        status: input.byAdmin ? "APPROVED" : "REQUESTED",
        createdByAdmin: Boolean(input.byAdmin),
        events: { create: { status: input.byAdmin ? "APPROVED" : "REQUESTED", actor, note: input.byAdmin ? "Recorded by the store" : null } },
      },
    });
  });

  void sendReturnReceived(order, created, Boolean(input.byAdmin));
  return { ok: true, data: created };
}

export type ReturnAction =
  | { action: "approve"; note?: string }
  | { action: "reject"; note: string }
  | { action: "received"; note?: string }
  | { action: "note"; note: string }
  | { action: "refund"; amount: number; restock: boolean; note?: string };

/** Suggested refund: the price of the items on the request. */
export function suggestedRefund(items: ReturnItemSnapshot[]): number {
  return items.reduce((s, i) => s + i.price * i.quantity, 0);
}

export async function applyReturnAction(id: string, act: ReturnAction, actorName: string): Promise<ReturnActionResult> {
  const req = await prisma.returnRequest.findUnique({ where: { id }, include: { order: { include: { items: true } } } });
  if (!req) return { ok: false, status: 404, error: "Return request not found." };
  const note = "note" in act ? act.note?.trim() || undefined : undefined;

  const move = async (status: ReturnStatus, extra: Prisma.ReturnRequestUpdateInput = {}) => {
    const updated = await prisma.returnRequest.update({
      where: { id },
      data: { status, adminNote: note ?? req.adminNote, ...extra, events: { create: { status, note: note ?? null, actor: actorName } } },
    });
    void sendReturnUpdate(req.order, updated, status, note);
    return { ok: true as const, data: updated };
  };

  switch (act.action) {
    case "approve":
      if (req.status !== "REQUESTED") return { ok: false, status: 409, error: "Only a new request can be approved." };
      return move("APPROVED");
    case "reject":
      if (!["REQUESTED", "APPROVED"].includes(req.status)) return { ok: false, status: 409, error: "This request can't be rejected now." };
      if (!note) return { ok: false, status: 400, error: "Add a reason so the customer knows why." };
      return move("REJECTED", { resolvedAt: new Date() });
    case "received":
      if (req.status !== "APPROVED") return { ok: false, status: 409, error: "Approve the request first." };
      return move("RECEIVED");
    case "note": {
      if (!note) return { ok: false, status: 400, error: "Write a note first." };
      const updated = await prisma.returnRequest.update({ where: { id }, data: { adminNote: note, events: { create: { status: req.status, note, actor: actorName } } } });
      return { ok: true, data: updated };
    }
    case "refund":
      return issueRefund(req, act, actorName);
  }
}

async function issueRefund(
  req: ReturnRequest & { order: Order & { items: OrderItem[] } },
  act: { amount: number; restock: boolean; note?: string },
  actorName: string
): Promise<ReturnActionResult> {
  const { order } = req;
  if (!["APPROVED", "RECEIVED"].includes(req.status)) return { ok: false, status: 409, error: "Approve the request before refunding." };
  if (order.paymentStatus === "UNPAID" || order.paymentStatus === "FAILED") return { ok: false, status: 409, error: "This order was never paid." };
  const remaining = order.total - order.refundedAmount;
  const amount = Math.round(act.amount);
  if (!Number.isFinite(amount) || amount < 1) return { ok: false, status: 400, error: "Enter a refund amount." };
  if (amount > remaining) return { ok: false, status: 400, error: `You can refund at most ₹${remaining.toLocaleString("en-IN")} on this order.` };

  // Money first: if Razorpay refuses, nothing is recorded as refunded.
  let reference = "manual";
  const rp = getRazorpay();
  if (rp && order.razorpayPaymentId && !order.razorpayPaymentId.startsWith("sim_")) {
    try {
      const r = await rp.payments.refund(order.razorpayPaymentId, { amount: amount * 100, speed: "normal", notes: { return: req.number, order: order.orderNumber } });
      reference = r.id;
    } catch (err) {
      const msg = (err as { error?: { description?: string } })?.error?.description ?? "Razorpay could not process the refund.";
      console.error("Refund failed", err);
      return { ok: false, status: 502, error: msg };
    }
  } else if (order.razorpayPaymentId?.startsWith("sim_")) {
    reference = "manual (test payment)";
  }

  const newRefunded = order.refundedAmount + amount;
  const note = act.note?.trim() || undefined;
  const updated = await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: { refundedAmount: newRefunded, paymentStatus: newRefunded >= order.total ? "REFUNDED" : "PARTIALLY_REFUNDED" },
    });
    let restocked = req.restocked;
    if (act.restock && !req.restocked) {
      const items = req.items as unknown as ReturnItemSnapshot[];
      for (const it of items) {
        const orderItem = order.items.find((o) => o.id === it.orderItemId);
        if (orderItem?.variantId) await tx.productVariant.updateMany({ where: { id: orderItem.variantId }, data: { stock: { increment: it.quantity } } });
      }
      restocked = true;
    }
    return tx.returnRequest.update({
      where: { id: req.id },
      data: {
        status: "REFUNDED",
        refundAmount: req.refundAmount + amount,
        refundReference: reference,
        restocked,
        resolvedAt: new Date(),
        adminNote: note ?? req.adminNote,
        events: { create: { status: "REFUNDED", amount, note: [note, `Reference: ${reference}`].filter(Boolean).join(" · "), actor: actorName } },
      },
    });
  });

  void sendReturnUpdate(order, updated, "REFUNDED", note, amount);
  return { ok: true, data: updated };
}
