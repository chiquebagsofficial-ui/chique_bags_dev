import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { SignupForm } from "@/components/store/AuthForms";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Create account", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getSessionUser()) redirect("/account");
  return <SignupForm next={next} />;
}
