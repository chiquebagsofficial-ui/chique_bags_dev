import { formatDate, formatINR } from "@/lib/utils";
import { STATUS_LABEL } from "@/lib/returns";
import type { ReturnStatus } from "@prisma/client";

const STYLES: Record<ReturnStatus, string> = {
  REQUESTED: "bg-amber-100 text-amber-800",
  APPROVED: "bg-sky-100 text-sky-800",
  REJECTED: "bg-stone-200 text-stone-700",
  RECEIVED: "bg-indigo-100 text-indigo-800",
  REFUNDED: "bg-emerald-100 text-emerald-800",
  CLOSED: "bg-stone-200 text-stone-700",
};

export function ReturnStatusBadge({ status }: { status: ReturnStatus }) {
  return <span className={`inline-block px-3 py-1 text-xs font-medium ${STYLES[status]}`}>{STATUS_LABEL[status]}</span>;
}

export default function ReturnTimeline({ events, showActor = false }: { events: { id: string; status: ReturnStatus; note: string | null; amount: number | null; actor: string; createdAt: Date }[]; showActor?: boolean }) {
  return (
    <ol className="space-y-4 border-l border-line pl-5">
      {events.map((e) => (
        <li key={e.id} className="relative">
          <span className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full bg-gold" />
          <p className="text-sm font-medium">
            {STATUS_LABEL[e.status]}
            {e.amount ? <span className="ml-2 text-emerald-700">{formatINR(e.amount)}</span> : null}
          </p>
          <p className="text-xs text-muted">{formatDate(e.createdAt, true)}{showActor ? ` · ${e.actor}` : ""}</p>
          {e.note && <p className="mt-1 text-sm text-muted">{e.note}</p>}
        </li>
      ))}
    </ol>
  );
}
