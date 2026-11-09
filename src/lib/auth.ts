import { cache } from "react";
import { cookies } from "next/headers";
import { getIronSession, type SessionOptions } from "iron-session";
import { prisma } from "@/lib/db";

export interface CustomerSession {
  userId?: string;
  isLoggedIn: boolean;
}

export interface AdminSession {
  userId?: string;
  isLoggedIn: boolean;
}

function secret(name: string, devFallback: string): string {
  const value = process.env[name];
  if (value && value.length >= 32) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error(`${name} must be set to a random string of at least 32 characters`);
  }
  return devFallback;
}

export const customerSessionOptions: SessionOptions = {
  password: secret("SESSION_SECRET", "dev_only_customer_session_secret_not_for_production"),
  cookieName: "chique_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  },
};

export const adminSessionOptions: SessionOptions = {
  password: secret("ADMIN_SESSION_SECRET", "dev_only_admin_session_secret_not_for_production!"),
  cookieName: "chique_admin_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7,
  },
};

export async function getCustomerSession() {
  return getIronSession<CustomerSession>(await cookies(), customerSessionOptions);
}

export async function getAdminSession() {
  return getIronSession<AdminSession>(await cookies(), adminSessionOptions);
}

export type SessionUser = { id: string; name: string; email: string; phone: string | null };

/** The signed-in customer (fresh from the database) or null. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const session = await getCustomerSession();
  if (!session.isLoggedIn || !session.userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, phone: true, role: true },
  });
  if (!user || user.role !== "CUSTOMER") return null;
  return { id: user.id, name: user.name, email: user.email, phone: user.phone };
});

/** The signed-in admin or null. Every admin page and route checks this. */
export const getAdminUser = cache(async () => {
  const session = await getAdminSession();
  if (!session.isLoggedIn || !session.userId) return null;
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || user.role !== "ADMIN") return null;
  return { id: user.id, name: user.name, email: user.email };
});

export async function loginCustomer(userId: string) {
  const session = await getCustomerSession();
  session.userId = userId;
  session.isLoggedIn = true;
  await session.save();
}
