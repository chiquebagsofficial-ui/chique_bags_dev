"use client";

import { useRouter } from "next/navigation";

export default function MessageActions({ id, isRead }: { id: string; isRead: boolean }) {
  const router = useRouter();
  return (
    <div className="flex gap-3 text-xs font-semibold">
      {!isRead && <button className="underline" onClick={async () => { await fetch(`/api/admin/messages/${id}`, { method: "PATCH" }); router.refresh(); }}>Mark as read</button>}
      <button className="text-berry underline" onClick={async () => { if (confirm("Delete this message?")) { await fetch(`/api/admin/messages/${id}`, { method: "DELETE" }); router.refresh(); } }}>Delete</button>
    </div>
  );
}
