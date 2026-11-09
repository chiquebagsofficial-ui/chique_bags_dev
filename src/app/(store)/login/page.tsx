import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { LoginForm } from "@/components/store/AuthForms";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Log in", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getSessionUser()) redirect(next?.startsWith("/") && !next.startsWith("//") ? next : "/account");
  return <LoginForm next={next} />;
}
