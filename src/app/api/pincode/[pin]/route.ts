import { fail, limit, ok } from "@/lib/api";
import { isPincodeFormat, lookupPincode } from "@/lib/pincode";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ pin: string }> }) {
  const limited = await limit(req, "pincode", 60, 10 * 60_000);
  if (limited) return limited;
  const { pin } = await params;
  if (!isPincodeFormat(pin)) return fail("Enter a valid 6-digit pincode.", 400);
  return ok(await lookupPincode(pin));
}
