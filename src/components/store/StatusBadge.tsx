import { ORDER_STATUS_LABEL } from "@/lib/utils";

const STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-sky-100 text-sky-800",
  PROCESSING: "bg-indigo-100 text-indigo-800",
  SHIPPED: "bg-violet-100 text-violet-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-stone-200 text-stone-700",
};

export default function StatusBadge({ status }: { status: string }) {
  return <span className={`inline-block rounded-none px-3 py-1 text-xs font-semibold ${STYLES[status] ?? "bg-stone-100"}`}>{ORDER_STATUS_LABEL[status] ?? status}</span>;
}

const STEPS = ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] as const;

/** Four-step progress tracker used on order pages. */
export function OrderProgress({ status }: { status: string }) {
  if (status === "CANCELLED") return null;
  const idx = status === "PENDING" ? -1 : STEPS.indexOf(status as (typeof STEPS)[number]);
  return (
    <ol className="flex items-center" aria-label="Order progress">
      {STEPS.map((s, i) => (
        <li key={s} className="flex flex-1 items-center last:flex-none">
          <span className="flex flex-col items-center gap-1.5">
            <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${i <= idx ? "bg-ink text-white" : "bg-line text-muted"}`}>{i + 1}</span>
            <span className={`text-[0.7rem] font-medium ${i <= idx ? "text-ink" : "text-muted"}`}>{ORDER_STATUS_LABEL[s]}</span>
          </span>
          {i < STEPS.length - 1 && <span className={`mx-2 mb-5 h-0.5 flex-1 ${i < idx ? "bg-ink" : "bg-line"}`} />}
        </li>
      ))}
    </ol>
  );
}
