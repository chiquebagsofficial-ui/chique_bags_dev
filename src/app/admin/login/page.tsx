"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lock } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      setError((await res.json().catch(() => ({}))).error ?? "Could not log in");
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-5">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-5 p-8">
        <div className="text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-ink text-white"><Lock size={20} /></span>
          <h1 className="font-serif mt-4 text-2xl font-semibold">Chique Bags admin</h1>
          <p className="mt-1 text-sm text-muted">Sign in to manage your store</p>
        </div>
        <div><label className="label" htmlFor="a-email">Email</label><input id="a-email" type="email" required autoComplete="username" className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div><label className="label" htmlFor="a-pass">Password</label><input id="a-pass" type="password" required autoComplete="current-password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        {error && <p role="alert" className="rounded-sm bg-blush p-3 text-sm font-medium text-berry">{error}</p>}
        <button className="btn btn-dark btn-block" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      </form>
    </div>
  );
}
