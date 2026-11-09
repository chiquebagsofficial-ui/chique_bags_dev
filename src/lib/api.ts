import { NextResponse } from "next/server";
import type { ZodType } from "zod";
import { firstError } from "@/lib/validations";
import { getAdminUser } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const ok = (data: unknown = { ok: true }, status = 200) => NextResponse.json(data, { status });
export const fail = (error: string, status = 400, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ error, ...extra }, { status });

export async function parseBody<T>(req: Request, schema: ZodType<T>): Promise<{ data: T } | { error: NextResponse }> {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return { error: fail(firstError(parsed.error), 400) };
  return { data: parsed.data };
}

/** Returns an error response when the caller is not the signed-in admin. */
export async function adminGuard(): Promise<NextResponse | null> {
  const admin = await getAdminUser();
  return admin ? null : fail("Unauthorized", 401);
}

/** Returns an error response when the caller has made too many requests. */
export async function limit(req: Request, bucket: string, max: number, windowMs: number, extraKey = ""): Promise<NextResponse | null> {
  const allowed = await checkRateLimit(`${getClientIp(req)}:${extraKey}`, bucket, max, windowMs);
  return allowed ? null : fail("Too many attempts. Please wait a few minutes and try again.", 429);
}
