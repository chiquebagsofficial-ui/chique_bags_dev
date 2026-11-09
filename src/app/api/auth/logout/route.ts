import { ok } from "@/lib/api";
import { getCustomerSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getCustomerSession();
  session.destroy();
  return ok();
}
