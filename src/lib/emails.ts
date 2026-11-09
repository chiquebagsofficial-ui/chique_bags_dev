import type { Order, OrderItem } from "@prisma/client";
import { sendMail } from "@/lib/mail";
import { getSettings } from "@/lib/settings";
import { appUrl, escapeHtml as e, formatINR } from "@/lib/utils";

type OrderWithItems = Order & { items: OrderItem[] };

function layout(title: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;background:#faf7f5;font-family:Helvetica,Arial,sans-serif;color:#1a1a1a">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f5;padding:24px 12px"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #f1ece9;border-radius:14px;overflow:hidden">
<tr><td style="background:#141414;padding:22px 28px;text-align:center">
<span style="font-family:Georgia,'Times New Roman',serif;font-size:24px;letter-spacing:1px;color:#ffffff">Chique Bags</span></td></tr>
<tr><td style="padding:30px 28px 10px"><h1 style="font-family:Georgia,serif;font-size:22px;margin:0 0 14px;font-weight:600">${e(title)}</h1>${body}</td></tr>
<tr><td style="padding:18px 28px 28px;color:#6b7280;font-size:12px;line-height:1.6;border-top:1px solid #f1ece9">
Handcrafted bags made with love in India.<br>Questions? Just reply to this email.</td></tr>
</table></td></tr></table></body></html>`;
}

const p = (t: string) => `<p style="font-size:15px;line-height:1.65;margin:0 0 14px">${t}</p>`;
const button = (href: string, label: string) =>
  `<p style="margin:22px 0"><a href="${e(href)}" style="background:#d8899f;color:#ffffff;text-decoration:none;padding:13px 26px;border-radius:999px;font-weight:600;font-size:14px;display:inline-block">${e(label)}</a></p>`;

function itemsTable(order: OrderWithItems): string {
  const rows = order.items
    .map(
      (i) => `<tr>
<td style="padding:10px 0;border-bottom:1px solid #f1ece9;font-size:14px">${e(i.name)}${i.variantName ? `<br><span style="color:#6b7280;font-size:12px">${e(i.variantName)}</span>` : ""}</td>
<td style="padding:10px 8px;border-bottom:1px solid #f1ece9;font-size:14px;text-align:center">× ${i.quantity}</td>
<td style="padding:10px 0;border-bottom:1px solid #f1ece9;font-size:14px;text-align:right">${formatINR(i.price * i.quantity)}</td></tr>`
    )
    .join("");
  const line = (label: string, value: string, bold = false) =>
    `<tr><td colspan="2" style="padding:4px 0;font-size:14px;${bold ? "font-weight:700;font-size:16px;padding-top:10px" : "color:#6b7280"}">${label}</td><td style="padding:4px 0;font-size:14px;text-align:right;${bold ? "font-weight:700;font-size:16px;padding-top:10px" : ""}">${value}</td></tr>`;
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 18px">${rows}
${line("Subtotal", formatINR(order.subtotal))}
${order.discount ? line(`Coupon${order.couponCode ? ` (${e(order.couponCode)})` : ""}`, `−${formatINR(order.discount)}`) : ""}
${line("Shipping", order.shipping ? formatINR(order.shipping) : "Free")}
${line("Total", formatINR(order.total), true)}</table>`;
}

function addressBlock(order: Order): string {
  const a = order.shippingAddress as Record<string, string>;
  return `<p style="font-size:14px;line-height:1.6;margin:0 0 14px;color:#374151"><strong>${e(a.name)}</strong><br>${e(a.line1)}${a.line2 ? `, ${e(a.line2)}` : ""}<br>${e(a.city)}, ${e(a.state)} ${e(a.pincode)}<br>${e(a.phone)}</p>`;
}

export async function sendVerificationCode(email: string, code: string, purpose: "SIGNUP" | "CHECKOUT" | "RESET") {
  const reason = {
    SIGNUP: "finish creating your Chique Bags account",
    CHECKOUT: "continue with your checkout",
    RESET: "reset your password",
  }[purpose];
  await sendMail({
    to: email,
    subject: `${code} is your Chique Bags verification code`,
    html: layout(
      "Your verification code",
      p(`Use this code to ${reason}. It expires in 10 minutes.`) +
        `<p style="font-size:34px;letter-spacing:8px;font-weight:700;margin:18px 0;font-family:Georgia,serif">${e(code)}</p>` +
        p("If you didn't ask for this, you can safely ignore this email.")
    ),
  });
}

export async function sendWelcome(name: string, email: string) {
  await sendMail({
    to: email,
    subject: "Welcome to Chique Bags",
    html: layout(
      `Welcome, ${name.split(" ")[0]}`,
      p("Your account is ready. Save your favourites, track your orders and check out faster next time.") +
        button(appUrl("/shop"), "Start shopping")
    ),
  });
}

export async function sendOrderConfirmation(order: OrderWithItems) {
  const cod = order.paymentMethod === "COD";
  await sendMail({
    to: order.customerEmail,
    subject: `Order ${order.orderNumber} confirmed`,
    html: layout(
      "Thank you for your order",
      p(`Hi ${e(order.customerName.split(" ")[0])}, we've received order <strong>${e(order.orderNumber)}</strong>. ${
        cod ? "You'll pay in cash when it's delivered." : "Your payment was successful."
      }`) +
        itemsTable(order) +
        p("<strong>Delivering to</strong>") +
        addressBlock(order) +
        button(appUrl(`/account/orders/${order.id}`), "View your order") +
        p("We'll email you again as soon as your bag ships.")
    ),
  });
}

export async function sendOrderShipped(order: OrderWithItems) {
  await sendMail({
    to: order.customerEmail,
    subject: `Your order ${order.orderNumber} is on its way`,
    html: layout(
      "Your order has shipped",
      p(`Good news, ${e(order.customerName.split(" ")[0])}! Order <strong>${e(order.orderNumber)}</strong> is on its way.`) +
        (order.courier ? p(`Courier: <strong>${e(order.courier)}</strong>`) : "") +
        (order.trackingUrl ? button(order.trackingUrl, "Track your order") : button(appUrl(`/account/orders/${order.id}`), "View your order")) +
        addressBlock(order)
    ),
  });
}

export async function sendOrderDelivered(order: OrderWithItems) {
  await sendMail({
    to: order.customerEmail,
    subject: `Order ${order.orderNumber} delivered`,
    html: layout(
      "Your order has been delivered",
      p(`We hope you love your new bag, ${e(order.customerName.split(" ")[0])}. Tag us <strong>@chiquebagsofficial</strong> on Instagram, we'd love to see how you style it.`) +
        button(appUrl(`/account/orders/${order.id}`), "Review your purchase")
    ),
  });
}

export async function sendOrderCancelled(order: OrderWithItems, refundNote?: string) {
  await sendMail({
    to: order.customerEmail,
    subject: `Order ${order.orderNumber} cancelled`,
    html: layout(
      "Your order was cancelled",
      p(`Order <strong>${e(order.orderNumber)}</strong> has been cancelled.`) +
        (refundNote ? p(e(refundNote)) : "") +
        p("If this wasn't expected, just reply to this email and we'll help.")
    ),
  });
}

export async function sendOwnerNewOrder(order: OrderWithItems) {
  const s = await getSettings();
  if (!s.ownerEmail) return;
  await sendMail({
    to: s.ownerEmail,
    subject: `New order ${order.orderNumber} (${formatINR(order.total)})`,
    html: layout(
      "You have a new order",
      p(`<strong>${e(order.customerName)}</strong> (${e(order.customerEmail)}, ${e(order.customerPhone)}) placed order <strong>${e(order.orderNumber)}</strong>, paid by ${
        order.paymentMethod === "COD" ? "cash on delivery" : "online payment"
      }.`) +
        itemsTable(order) +
        addressBlock(order) +
        button(appUrl(`/admin/orders/${order.id}`), "Open in admin")
    ),
  });
}

export async function sendContactMessage(msg: { name: string; email: string; phone?: string | null; message: string }) {
  const s = await getSettings();
  const to = s.ownerEmail || s.contactEmail;
  await sendMail({
    to,
    replyTo: msg.email,
    subject: `New message from ${msg.name}`,
    html: layout(
      "New contact message",
      p(`<strong>${e(msg.name)}</strong> &lt;${e(msg.email)}&gt;${msg.phone ? ` · ${e(msg.phone)}` : ""}`) +
        `<p style="white-space:pre-wrap;font-size:15px;line-height:1.65;background:#faf7f5;padding:14px;border-radius:10px">${e(msg.message)}</p>`
    ),
  });
  await sendMail({
    to: msg.email,
    subject: "We got your message",
    html: layout("Thanks for reaching out", p(`Hi ${e(msg.name.split(" ")[0])}, we've received your message and will reply within one working day.`)),
  });
}
