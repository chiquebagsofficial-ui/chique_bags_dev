// Indian pincode validation using the public India Post lookup. If the lookup service is
// unreachable we fall back to checking the format only, so an outage never blocks a sale.
export type PincodeResult =
  | { status: "valid"; city: string; state: string }
  | { status: "invalid" }
  | { status: "unknown" }; // lookup service unavailable

const cache = new Map<string, { at: number; result: PincodeResult }>();
const TTL_MS = 24 * 60 * 60 * 1000;

export const isPincodeFormat = (pin: string) => /^[1-9]\d{5}$/.test(pin);

export async function lookupPincode(pin: string): Promise<PincodeResult> {
  if (!isPincodeFormat(pin)) return { status: "invalid" };
  const hit = cache.get(pin);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.result;

  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`, { signal: AbortSignal.timeout(4000), cache: "no-store" });
    if (!res.ok) return { status: "unknown" };
    const data = (await res.json()) as { Status?: string; PostOffice?: { District?: string; State?: string; Block?: string }[] }[];
    const entry = data?.[0];
    if (entry?.Status === "Success" && entry.PostOffice?.length) {
      const po = entry.PostOffice[0];
      const result: PincodeResult = { status: "valid", city: po.District || po.Block || "", state: po.State || "" };
      cache.set(pin, { at: Date.now(), result });
      return result;
    }
    // "Error" with "No records found" means the pincode doesn't exist.
    const result: PincodeResult = { status: "invalid" };
    cache.set(pin, { at: Date.now(), result });
    return result;
  } catch {
    return { status: "unknown" };
  }
}
