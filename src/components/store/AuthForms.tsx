"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

async function post(url: string, body: unknown) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return { ok: res.ok, data: await res.json().catch(() => ({})) };
}

function safeNext(next?: string) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/account";
}

function Shell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="wrap grid min-h-[70vh] place-items-center py-14">
      <div className="card w-full max-w-md p-8 sm:p-10">
        <h1 className="h-display text-3xl">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
        <div className="mt-7">{children}</div>
      </div>
    </div>
  );
}

const Err = ({ msg }: { msg: string | null }) => (msg ? <p role="alert" className="rounded-xl bg-blush p-3 text-sm font-medium text-berry">{msg}</p> : null);

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await post("/api/auth/login", { email, password });
    if (r.ok) {
      router.push(safeNext(next));
      router.refresh();
    } else {
      setError(r.data.error ?? "Could not log in");
      setBusy(false);
    }
  }

  return (
    <Shell title="Welcome back" subtitle="Log in to see your orders and favourites.">
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label" htmlFor="email">Email</label><input id="email" type="email" required autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div><label className="label" htmlFor="password">Password</label><input id="password" type="password" required autoComplete="current-password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <div className="text-right text-sm"><Link href="/forgot-password" className="font-medium text-rose hover:underline">Forgot password?</Link></div>
        <Err msg={error} />
        <button className="btn btn-dark btn-block" disabled={busy}>{busy ? "Logging in…" : "Log in"}</button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">New here? <Link href={`/signup${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-ink underline">Create an account</Link></p>
    </Shell>
  );
}

export function SignupForm({ next }: { next?: string }) {
  const router = useRouter();
  const [step, setStep] = useState<"details" | "code">("details");
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "" });
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submitDetails(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await post("/api/auth/register", f);
    setBusy(false);
    if (r.ok) setStep("code");
    else setError(r.data.error ?? "Could not create your account");
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await post("/api/auth/verify-signup", { email: f.email, code });
    if (r.ok) {
      router.push(safeNext(next));
      router.refresh();
    } else {
      setError(r.data.error ?? "That code didn't work");
      setBusy(false);
    }
  }

  if (step === "code") {
    return (
      <Shell title="Check your email" subtitle={`We sent a 6-digit code to ${f.email}. It expires in 10 minutes.`}>
        <form onSubmit={submitCode} className="space-y-4">
          <input inputMode="numeric" maxLength={6} autoFocus aria-label="Verification code" className="input text-center text-2xl tracking-[0.5em]" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
          <Err msg={error} />
          <button className="btn btn-dark btn-block" disabled={busy || code.length !== 6}>{busy ? "Verifying…" : "Verify & create account"}</button>
          <button type="button" className="block w-full text-center text-sm font-medium underline" onClick={() => { setStep("details"); setCode(""); setError(null); }}>Use a different email</button>
        </form>
      </Shell>
    );
  }

  return (
    <Shell title="Create your account" subtitle="Save favourites, check out faster and track every order.">
      <form onSubmit={submitDetails} className="space-y-4">
        <div><label className="label" htmlFor="name">Full name</label><input id="name" required autoComplete="name" className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div><label className="label" htmlFor="email">Email</label><input id="email" type="email" required autoComplete="email" className="input" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
        <div><label className="label" htmlFor="phone">Phone (optional)</label><input id="phone" inputMode="tel" autoComplete="tel" className="input" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
        <div><label className="label" htmlFor="password">Password</label><input id="password" type="password" required minLength={8} autoComplete="new-password" className="input" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /><p className="mt-1 text-xs text-muted">At least 8 characters.</p></div>
        <Err msg={error} />
        <button className="btn btn-dark btn-block" disabled={busy}>{busy ? "Sending code…" : "Continue"}</button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">Already have an account? <Link href="/login" className="font-semibold text-ink underline">Log in</Link></p>
    </Shell>
  );
}

export function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await post("/api/auth/forgot-password", { email });
    setBusy(false);
    if (r.ok) setStep("reset");
    else setError(r.data.error ?? "Something went wrong");
  }

  async function reset(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await post("/api/auth/reset-password", { email, code, password });
    if (r.ok) {
      router.push("/account");
      router.refresh();
    } else {
      setError(r.data.error ?? "Could not reset your password");
      setBusy(false);
    }
  }

  if (step === "email") {
    return (
      <Shell title="Forgot your password?" subtitle="Enter your email and we'll send you a code to set a new one.">
        <form onSubmit={sendCode} className="space-y-4">
          <div><label className="label" htmlFor="email">Email</label><input id="email" type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <Err msg={error} />
          <button className="btn btn-dark btn-block" disabled={busy}>{busy ? "Sending…" : "Send code"}</button>
        </form>
        <p className="mt-6 text-center text-sm"><Link href="/login" className="font-semibold underline">Back to log in</Link></p>
      </Shell>
    );
  }
  return (
    <Shell title="Set a new password" subtitle={`If an account exists for ${email}, a code is on its way.`}>
      <form onSubmit={reset} className="space-y-4">
        <div><label className="label" htmlFor="code">6-digit code</label><input id="code" inputMode="numeric" maxLength={6} className="input text-center text-xl tracking-[0.4em]" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} /></div>
        <div><label className="label" htmlFor="newpw">New password</label><input id="newpw" type="password" minLength={8} required autoComplete="new-password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <Err msg={error} />
        <button className="btn btn-dark btn-block" disabled={busy || code.length !== 6}>{busy ? "Saving…" : "Reset password"}</button>
      </form>
    </Shell>
  );
}
