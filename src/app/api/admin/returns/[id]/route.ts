import { z } from "zod";
import { adminGuard, fail, ok, parseBody } from "@/lib/api";
import { getAdminUser } from "@/lib/auth";
import { applyReturnAction } from "@/lib/returns";

export const dynamic = "force-dynamic";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve"), note: z.string().trim().max(500).optional() }),
  z.object({ action: z.literal("reject"), note: z.string().trim().min(3, "Add a reason").max(500) }),
  z.object({ action: z.literal("received"), note: z.string().trim().max(500).optional() }),
  z.object({ action: z.literal("note"), note: z.string().trim().min(1).max(500) }),
  z.object({ action: z.literal("refund"), amount: z.number().int().min(1), restock: z.boolean().default(false), note: z.string().trim().max(500).optional() }),
]);

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await adminGuard();
  if (denied) return denied;
  const admin = await getAdminUser();
  const { id } = await params;
  const parsed = await parseBody(req, schema);
  if ("error" in parsed) return parsed.error;
  const res = await applyReturnAction(id, parsed.data, admin?.name ?? "Store");
  if (!res.ok) return fail(res.error, res.status);
  return ok();
}
