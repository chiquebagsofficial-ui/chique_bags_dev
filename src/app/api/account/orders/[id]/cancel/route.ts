import { fail, ok } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { cancelOrder } from "@/lib/checkout";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return fail("Please log in.", 401);
  const { id } = await params;
  const result = await cancelOrder(id, { by: "customer", userId: user.id, reason: "Cancelled by customer" });
  if (!result.ok) return fail(result.error, 400);
  return ok();
}
