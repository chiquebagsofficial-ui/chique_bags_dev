import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { getAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminUser();
  if (!admin) redirect("/admin/login");
  const unread = await prisma.contactMessage.count({ where: { isRead: false } });
  return <AdminShell adminName={admin.name} unreadMessages={unread}>{children}</AdminShell>;
}
