import { createHash, randomInt, timingSafeEqual } from "crypto";
import type { CodePurpose, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const hash = (code: string, email: string) =>
  createHash("sha256").update(`${email}:${code}:${process.env.SESSION_SECRET ?? "dev"}`).digest("hex");

/** Creates a fresh 6-digit code for the email (replacing any earlier one). Returns the code to email. */
export async function issueCode(email: string, purpose: CodePurpose, data?: Prisma.InputJsonValue): Promise<string> {
  const code = randomInt(100000, 1000000).toString();
  await prisma.verificationCode.deleteMany({ where: { email, purpose } });
  await prisma.verificationCode.create({
    data: { email, purpose, codeHash: hash(code, email), data, expiresAt: new Date(Date.now() + TTL_MS) },
  });
  return code;
}

export type CodeResult = { ok: true; data: unknown } | { ok: false; error: string };

/** Checks and consumes a code. Codes expire after 10 minutes and lock after 5 wrong attempts. */
export async function consumeCode(email: string, purpose: CodePurpose, submitted: unknown): Promise<CodeResult> {
  const row = await prisma.verificationCode.findFirst({ where: { email, purpose }, orderBy: { createdAt: "desc" } });
  if (!row) return { ok: false, error: "No verification in progress. Please request a new code." };
  if (row.expiresAt < new Date()) {
    await prisma.verificationCode.delete({ where: { id: row.id } });
    return { ok: false, error: "This code has expired. Please request a new one." };
  }
  if (row.attempts >= MAX_ATTEMPTS) {
    await prisma.verificationCode.delete({ where: { id: row.id } });
    return { ok: false, error: "Too many incorrect attempts. Please request a new code." };
  }
  const a = Buffer.from(hash(String(submitted ?? "").trim(), email));
  const b = Buffer.from(row.codeHash);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    await prisma.verificationCode.update({ where: { id: row.id }, data: { attempts: { increment: 1 } } });
    return { ok: false, error: "Invalid verification code." };
  }
  await prisma.verificationCode.delete({ where: { id: row.id } });
  return { ok: true, data: row.data };
}
