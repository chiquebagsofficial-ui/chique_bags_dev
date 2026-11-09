// Fixed-window rate limiter. Uses Upstash Redis when configured (shared across
// serverless instances) and falls back to in-memory counters otherwise.
const memory = new Map<string, { count: number; resetAt: number }>();

export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] || req.headers.get("x-real-ip") || "local").trim();
}

export async function checkRateLimit(key: string, bucket: string, limit: number, windowMs: number): Promise<boolean> {
  const id = `rl:${bucket}:${key}`;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    try {
      const res = await fetch(`${url}/pipeline`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify([
          ["INCR", id],
          ["PEXPIRE", id, windowMs, "NX"],
        ]),
      });
      const data = (await res.json()) as { result: number }[];
      return Number(data[0]?.result) <= limit;
    } catch {
      // fall through to the in-memory limiter
    }
  }

  const now = Date.now();
  const entry = memory.get(id);
  if (!entry || entry.resetAt < now) {
    memory.set(id, { count: 1, resetAt: now + windowMs });
    if (memory.size > 5000) for (const [k, v] of memory) if (v.resetAt < now) memory.delete(k);
    return true;
  }
  entry.count += 1;
  return entry.count <= limit;
}
