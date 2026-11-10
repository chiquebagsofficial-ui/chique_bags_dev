import type { Order, OrderItem } from "@prisma/client";
import { PrintButton } from "@/components/store/AccountForms";
import { computeGst, money, rupeesInWords } from "@/lib/gst";
import type { Settings } from "@/lib/settings";
import { formatDate } from "@/lib/utils";

/** GST tax invoice, printable. Used by the customer account and the admin panel. */
export default function Invoice({
  order,
  settings,
  invoiceNumber,
  invoiceDate,
}: {
  order: Order & { items: OrderItem[] };
  settings: Settings;
  invoiceNumber: string;
  invoiceDate: Date;
}) {
  const a = order.shippingAddress as Record<string, string>;
  const g = computeGst(order, settings);
  const half = g.rate / 2;
  const th = "px-2 py-2.5 text-xs font-medium uppercase tracking-wider text-muted";

  return (
    <div className="mx-auto max-w-4xl bg-white p-6 text-sm sm:p-10">
      <div className="no-print mb-8 flex justify-end"><PrintButton /></div>

      <div className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-ink pb-6">
        <div>
          <p className="font-serif text-3xl font-medium uppercase tracking-[0.25em]">{settings.legalName || "Chique Bags"}</p>
          <p className="mt-2 max-w-xs leading-relaxed text-muted">
            {settings.address}
            {settings.businessState && <><br />State: {settings.businessState}</>}
            <br />{settings.contactEmail}{settings.contactPhone && ` · ${settings.contactPhone}`}
          </p>
          {settings.gstin ? <p className="mt-2 font-medium">GSTIN: {settings.gstin}</p> : <p className="mt-2 text-xs text-berry">GSTIN not set (Admin &gt; Settings)</p>}
        </div>
        <div className="text-right">
          <p className="eyebrow">Tax invoice</p>
          <p className="mt-1 text-lg font-semibold">{invoiceNumber}</p>
          <p className="text-muted">Date: {formatDate(invoiceDate)}</p>
          <p className="text-muted">Order: {order.orderNumber}</p>
        </div>
      </div>

      <div className="grid gap-6 py-6 sm:grid-cols-3">
        <div><p className="eyebrow mb-1">Billed to</p><p className="leading-relaxed">{order.customerName}<br />{order.customerEmail}<br />{order.customerPhone}</p></div>
        <div><p className="eyebrow mb-1">Shipped to</p><p className="leading-relaxed">{a.name}<br />{a.line1}{a.line2 && `, ${a.line2}`}<br />{a.city}, {a.state} {a.pincode}</p></div>
        <div><p className="eyebrow mb-1">Place of supply</p><p className="leading-relaxed">{g.placeOfSupply || "–"}<br /><span className="text-muted">{g.intraState ? "Intra-state (CGST + SGST)" : "Inter-state (IGST)"}</span></p></div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-y border-line text-left">
              <th className={th}>Item</th><th className={th}>HSN</th><th className={`${th} text-center`}>Qty</th><th className={`${th} text-right`}>Taxable value</th>
              {g.intraState ? <><th className={`${th} text-right`}>CGST {half}%</th><th className={`${th} text-right`}>SGST {half}%</th></> : <th className={`${th} text-right`}>IGST {g.rate}%</th>}
              <th className={`${th} text-right`}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {g.lines.map((l, i) => {
              const c = Math.round(l.tax / 2);
              return (
                <tr key={i} className="border-b border-line">
                  <td className="px-2 py-3">{l.description}</td>
                  <td className="px-2 py-3 text-muted">{l.hsn}</td>
                  <td className="px-2 py-3 text-center">{l.quantity}</td>
                  <td className="px-2 py-3 text-right">{money(l.taxable)}</td>
                  {g.intraState ? <><td className="px-2 py-3 text-right">{money(c)}</td><td className="px-2 py-3 text-right">{money(l.tax - c)}</td></> : <td className="px-2 py-3 text-right">{money(l.tax)}</td>}
                  <td className="px-2 py-3 text-right font-medium">{money(l.total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <dl className="ml-auto mt-6 w-full max-w-xs space-y-2">
        <div className="flex justify-between"><dt className="text-muted">Taxable value</dt><dd>₹{money(g.taxable)}</dd></div>
        {g.intraState ? (
          <>
            <div className="flex justify-between"><dt className="text-muted">CGST ({half}%)</dt><dd>₹{money(g.cgst)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">SGST ({half}%)</dt><dd>₹{money(g.sgst)}</dd></div>
          </>
        ) : (
          <div className="flex justify-between"><dt className="text-muted">IGST ({g.rate}%)</dt><dd>₹{money(g.igst)}</dd></div>
        )}
        <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd>Free</dd></div>
        <div className="flex justify-between border-t border-ink pt-3 text-base font-semibold"><dt>Total</dt><dd>₹{money(order.total * 100)}</dd></div>
        {order.refundedAmount > 0 && <div className="flex justify-between text-berry"><dt>Refunded</dt><dd>−₹{money(order.refundedAmount * 100)}</dd></div>}
      </dl>

      <p className="mt-6 text-sm"><span className="text-muted">Amount in words:</span> {rupeesInWords(order.total)}</p>

      <div className="mt-10 grid gap-4 border-t border-line pt-4 text-xs leading-relaxed text-muted sm:grid-cols-2">
        <p>Payment: paid online ({order.paymentStatus.toLowerCase().replace("_", " ")}){order.razorpayPaymentId ? ` · Ref ${order.razorpayPaymentId}` : ""}.<br />Prices include GST. Tax payable on reverse charge: No.</p>
        <p className="sm:text-right">This is a computer-generated invoice and does not require a signature.</p>
      </div>
    </div>
  );
}
