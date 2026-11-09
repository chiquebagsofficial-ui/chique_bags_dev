import MessageActions from "@/components/admin/MessageActions";
import { PageHead } from "@/components/admin/ui";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Messages" };
export const dynamic = "force-dynamic";

export default async function AdminMessages() {
  const messages = await prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <>
      <PageHead title="Messages" subtitle="Sent through the contact form (also emailed to you)" />
      {messages.length === 0 ? (
        <p className="card p-10 text-center text-sm text-muted">No messages yet.</p>
      ) : (
        <ul className="space-y-4">
          {messages.map((m) => (
            <li key={m.id} className={`card p-5 ${m.isRead ? "" : "border-rose-soft bg-blush/40"}`}>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <p><strong>{m.name}</strong> · <a href={`mailto:${m.email}`} className="text-rose hover:underline">{m.email}</a>{m.phone && ` · ${m.phone}`}</p>
                <p className="text-xs text-muted">{formatDate(m.createdAt, true)}</p>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{m.message}</p>
              <div className="mt-4"><MessageActions id={m.id} isRead={m.isRead} /></div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
