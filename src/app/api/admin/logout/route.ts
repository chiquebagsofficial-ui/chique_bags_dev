import { ok } from "@/lib/api";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getAdminSession();
  session.destroy();
  return ok();
}
