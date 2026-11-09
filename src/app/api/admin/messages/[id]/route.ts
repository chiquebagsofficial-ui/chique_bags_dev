import { prisma } from "@/lib/db";
import { adminGuard, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await adminGuard();
  if (denied) return denied;
  const { id } = await params;
  await prisma.contactMessage.update({ where: { id }, data: { isRead: true } }).catch(() => null);
  return ok();
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await adminGuard();
  if (denied) return denied;
  const { id } = await params;
  await prisma.contactMessage.delete({ where: { id } }).catch(() => null);
  return ok();
}
