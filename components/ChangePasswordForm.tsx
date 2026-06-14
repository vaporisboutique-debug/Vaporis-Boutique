"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function ChangePasswordForm() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const newPassword = String(formData.get("newPassword") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");

    setError("");
    setSuccess("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!supabase) {
      setError("Supabase is not connected.");
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) {
      setError(updateError.message);
      return;
    }

    form.reset();
    setSuccess("Password updated successfully.");
  }

  return (
    <form className="mt-10 grid gap-5" onSubmit={submitPassword}>
      <input name="newPassword" className="border border-ink/15 bg-paper px-4 py-4" type="password" placeholder="New password" required />
      <input name="confirmPassword" className="border border-ink/15 bg-paper px-4 py-4" type="password" placeholder="Confirm new password" required />
      {error ? <p className="border border-rosewood/20 bg-rosewood/5 px-4 py-3 text-sm text-rosewood">{error}</p> : null}
      {success ? <p className="border border-ink/10 bg-porcelain px-4 py-3 text-sm text-ink/65">{success}</p> : null}
      <button className="bg-ink px-6 py-4 text-xs uppercase tracking-[0.22em] text-paper">Save password</button>
    </form>
  );
}
