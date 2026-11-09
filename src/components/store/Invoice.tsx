import type { Order, OrderItem } from "@prisma/client";
import { PrintButton } from "@/components/store/AccountForms";
import type { Settings } from "@/lib/settings";
import { formatDate, formatINR } from "@/lib/utils";

/** Printable invoice used by both the customer account and the admin panel. */
export default function Invoice({ order, settings }: { order: Order & { items: OrderItem[] }; settings: Settings }) {
  const a = order.shippingAddress as Record<string, string>;
  const saved = order.mrpTotal - order.subtotal + order.discount;
  return (
    <div className="mx-auto max-w-3xl bg-white p-6 text-sm sm:p-10">
      <div className="mb-8 flex justify-end"><PrintButton /></div>
      <div className="flex flex-wrap items-start justify-between gap-6 border-b border-line pb-6">
        <div>
          <p className="font-serif text-3xl font-semibold">Chique Bags</p>
          <p className="mt-1 text-muted">{settings.address}<br />{settings.contactEmail}{settings.contactPhone && ` · ${settings.contactPhone}`}</p>
        </div>
        <div className="text-right">
          <p className="eyebrow">Invoice</p>
          <p className="mt-1 text-lg font-semibold">{order.orderNumber}</p>
          <p className="text-muted">{formatDate(order.createdAt)}</p>
        </div>
      </div>

      <div className="grid gap-6 py-6 sm:grid-cols-2">
        <div><p className="eyebrow mb-1">Billed to</p><p className="leading-relaxed">{order.customerName}<br />{order.customerEmail}<br />{order.customerPhone}</p></div>
        <div><p className="eyebrow mb-1">Shipped to</p><p className="leading-relaxed">{a.name}<br />{a.line1}{a.line2 && `, ${a.line2}`}<br />{a.city}, {a.state} {a.pincode}</p></div>
      </div>

      <table className="w-full">
        <thead><tr className="border-y border-line text-left text-xs uppercase tracking-wider text-muted"><th className="py-3">Item</th><th className="py-3 text-center">Qty</th><th className="py-3 text-right">MRP</th><th className="py-3 text-right">Price</th><th className="py-3 text-right">Amount</th></tr></thead>
        <tbody>
          {order.items.map((i) => (
            <tr key={i.id} className="border-b border-line">
              <td className="py-3">{i.name}<br /><span className="text-xs text-muted">{i.variantName}</span></td>
              <td className="py-3 text-center">{i.quantity}</td>
              <td className="py-3 text-right text-muted">{formatINR(i.mrp)}</td>
              <td className="py-3 text-right">{formatINR(i.price)}</td>
              <td className="py-3 text-right font-medium">{formatINR(i.price * i.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="ml-auto mt-6 w-full max-w-xs space-y-2">
        <div className="flex justify-between"><dt className="text-muted">Total at MRP</dt><dd>{formatINR(order.mrpTotal)}</dd></div>
        <div className="flex justify-between"><dt className="text-muted">Discount</dt><dd>−{formatINR(order.mrpTotal - order.subtotal)}</dd></div>
        {order.discount > 0 && <div className="flex justify-between"><dt className="text-muted">Coupon {order.couponCode}</dt><dd>−{formatINR(order.discount)}</dd></div>}
        <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd>{order.shipping ? formatINR(order.shipping) : "Free"}</dd></div>
        {order.giftBox && <div className="flex justify-between"><dt className="text-muted">Gift box &amp; note</dt><dd>{order.giftFee ? formatINR(order.giftFee) : "Free"}</dd></div>}
        <div className="flex justify-between border-t border-ink pt-3 text-base font-bold"><dt>Total</dt><dd>{formatINR(order.total)}</dd></div>
        {saved > 0 && <p className="pt-1 text-right text-xs text-muted">You saved {formatINR(saved)} on this order</p>}
      </dl>

      <p className="mt-10 border-t border-line pt-4 text-xs text-muted">
        Payment: {order.paymentMethod === "COD" ? "Cash on delivery" : "Online"} ({order.paymentStatus.toLowerCase()}). All prices are in Indian Rupees and inclusive of applicable taxes. This is a computer-generated invoice.
      </p>
    </div>
  );
}
