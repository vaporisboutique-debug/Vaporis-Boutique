"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import { fetchCurrentProfile } from "@/lib/supabaseCatalog";

export function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    if (!supabase || !isSupabaseConfigured) {
      setError("Connect Supabase before using the admin dashboard.");
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      return;
    }

    const profile = await fetchCurrentProfile().catch(() => null);
    if (!profile?.isAdmin) {
      await supabase.auth.signOut();
      setError("This account is not an admin.");
      return;
    }

    router.push("/admin-dashboard");
  }

  return (
    <form className="mt-10 grid gap-5" onSubmit={submitLogin}>
      <div className="grid gap-3">
        <label className="text-xs uppercase tracking-[0.2em]">Admin email</label>
        <input name="email" className="border border-ink/15 bg-paper px-4 py-4 outline-none focus:border-ink" placeholder="Admin email" type="email" required />
      </div>
      <div className="grid gap-3">
        <label className="text-xs uppercase tracking-[0.2em]">Admin password</label>
        <input name="password" className="border border-ink/15 bg-paper px-4 py-4 outline-none focus:border-ink" placeholder="Password" type="password" required />
      </div>
      {error ? <p className="border border-rosewood/20 bg-rosewood/5 px-4 py-3 text-sm text-rosewood">{error}</p> : null}
      <button className="mt-2 flex items-center justify-center gap-2 bg-ink px-6 py-4 text-xs uppercase tracking-[0.22em] text-paper">
        <LockKeyhole size={16} />
        Enter dashboard
      </button>
    </form>
  );
}
