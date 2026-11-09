import Link from "next/link";

export function PageHead({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-serif text-3xl font-semibold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-2 font-serif text-3xl font-semibold">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function Table({ head, children, empty }: { head: string[]; children: React.ReactNode; empty?: string }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs uppercase tracking-wider text-muted">
            {head.map((h) => <th key={h} className="px-5 py-3.5 font-semibold">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
      {empty && <p className="px-5 py-10 text-center text-sm text-muted">{empty}</p>}
    </div>
  );
}

export const Td = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => <td className={`px-5 py-3.5 align-middle ${className}`}>{children}</td>;

export function Pager({ page, pages, base }: { page: number; pages: number; base: string }) {
  if (pages <= 1) return null;
  const sep = base.includes("?") ? "&" : "?";
  return (
    <div className="mt-6 flex justify-center gap-2">
      {Array.from({ length: pages }, (_, i) => i + 1).slice(0, 20).map((n) => (
        <Link key={n} href={`${base}${sep}page=${n}`} className="chip" data-active={n === page}>{n}</Link>
      ))}
    </div>
  );
}
