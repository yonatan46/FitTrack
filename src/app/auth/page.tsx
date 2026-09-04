"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Dumbbell, LoaderCircle, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const supabase = createClient();
    const result = mode === "signin"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (result.error) setError(result.error.message);
    else if (mode === "signup" && !result.data.session) setMessage("Check your email to confirm your account, then sign in.");
    else router.push("/");
    setLoading(false);
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="brand"><div className="brand-mark"><Zap size={17} fill="currentColor" /></div><span>fittrack<span className="brand-accent">pro</span></span></div>
        <div className="auth-icon"><Dumbbell size={21} /></div>
        <p className="eyebrow">Your training, made personal</p>
        <h1>{mode === "signin" ? "Welcome back." : "Start your stronger chapter."}</h1>
        <p className="auth-copy">{mode === "signin" ? "Sign in to pick up where you left off." : "Create your account and we will build your first plan together."}</p>
        <form onSubmit={submit}>
          <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label>
          <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} autoComplete={mode === "signin" ? "current-password" : "new-password"} /></label>
          {error && <p className="form-error">{error}</p>}
          {message && <p className="form-message">{message}</p>}
          <button className="primary-button auth-submit" disabled={loading}>{loading ? <LoaderCircle size={16} className="spin" /> : null}{mode === "signin" ? "Sign in" : "Create account"}</button>
        </form>
        <button className="switch-auth" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); setMessage(""); }}>{mode === "signin" ? "New to FitTrack Pro? Create an account" : "Already have an account? Sign in"}</button>
      </section>
    </main>
  );
}
