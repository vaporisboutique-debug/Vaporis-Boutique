"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Mail } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import { notifyProfilesChanged } from "@/lib/useSupabaseProfiles";

export function LoginForm({ verificationMessage }: { verificationMessage?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/account";
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState("");

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    setError("");
    setMessage("");

    if (!supabase || !isSupabaseConfigured) {
      setError("Supabase is not connected yet.");
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { first_name: "", surname: "" } }
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      notifyProfilesChanged();
      setPendingVerificationEmail(email);
      setMessage(verificationMessage || "Account created. Please check your email for the Supabase verification link before signing in.");
      return;
    }

    notifyProfilesChanged();
    router.push(next);
  }

  async function resendVerificationEmail() {
    if (!supabase || !pendingVerificationEmail) {
      return;
    }

    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: pendingVerificationEmail
    });

    if (resendError) {
      setError(resendError.message);
      return;
    }

    setMessage(verificationMessage || "Verification email sent again. Please check your inbox for the Supabase verification link.");
  }

  return (
    <form className="mt-10 grid gap-5" onSubmit={submitLogin}>
      <div className="grid gap-3">
        <label className="text-xs uppercase tracking-[0.2em]">Email</label>
        <input name="email" className="border border-ink/15 bg-paper px-4 py-4 outline-none focus:border-ink" placeholder="name@example.com" type="email" required />
      </div>
      <div className="grid gap-3">
        <label className="text-xs uppercase tracking-[0.2em]">Password</label>
        <input name="password" className="border border-ink/15 bg-paper px-4 py-4 outline-none focus:border-ink" placeholder="Password" type="password" required />
      </div>
      {error ? <p className="border border-rosewood/20 bg-rosewood/5 px-4 py-3 text-sm text-rosewood">{error}</p> : null}
      {message ? <p className="border border-ink/10 bg-porcelain px-4 py-3 text-sm text-ink/65">{message}</p> : null}
      {pendingVerificationEmail ? (
        <button type="button" onClick={resendVerificationEmail} className="border border-ink px-5 py-3 text-xs uppercase tracking-[0.18em]">
          Resend verification email
        </button>
      ) : null}
      <button className="mt-2 flex items-center justify-center gap-2 bg-ink px-6 py-4 text-xs uppercase tracking-[0.22em] text-paper">
        <Mail size={16} />
        Continue
      </button>
    </form>
  );
}
