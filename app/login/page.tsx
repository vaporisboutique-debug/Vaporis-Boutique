"use client";

import Link from "next/link";
import { Suspense } from "react";
import { ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/LoginForm";
import { useSiteSettingsResource } from "@/lib/useSiteSettings";

export default function LoginPage() {
  const { settings, isLoading } = useSiteSettingsResource();

  return (
    <section className="container-pad mx-auto grid max-w-6xl gap-10 py-14 lg:grid-cols-[0.9fr_1.1fr]">
      {isLoading ? (
        <div className="min-h-[560px] animate-pulse bg-porcelain" />
      ) : (
        <div
          className="photo-grain min-h-[560px] bg-[linear-gradient(145deg,#fffdf8,#e9e0d1_48%,#6f2e2b)]"
          style={settings.loginImageUrl ? { backgroundImage: `url(${settings.loginImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
        />
      )}
      <div className="flex flex-col justify-center">
        <p className="text-xs uppercase tracking-[0.28em] text-brass">Account</p>
        {isLoading ? (
          <div className="mt-4 grid gap-5">
            <div className="h-16 w-full max-w-xl animate-pulse bg-porcelain" />
            <div className="h-5 w-full max-w-md animate-pulse bg-porcelain" />
            <div className="mt-5 h-72 w-full animate-pulse bg-porcelain" />
          </div>
        ) : (
          <>
            <h1 className="mt-4 font-serif text-6xl">{settings.loginTitle || "Login or create account"}</h1>
            {settings.loginSubtitle ? <p className="mt-5 text-sm leading-7 text-ink/62">{settings.loginSubtitle}</p> : null}
            <Suspense fallback={<div className="mt-10 border border-ink/10 bg-porcelain p-5 text-sm text-ink/62">Loading account form...</div>}>
              <LoginForm verificationMessage={settings.verificationMessage} />
            </Suspense>
            <div className="mt-8 border border-ink/12 bg-porcelain p-5 text-sm leading-6 text-ink/70">
              <div className="mb-2 flex items-center gap-2 text-ink">
                <ShieldCheck size={18} />
                {settings.createAccountTitle || "Email verification"}
              </div>
              {settings.createAccountSubtitle || "Supabase Auth sends an email verification link when email confirmation is enabled."}
            </div>
            <Link className="mt-6 text-sm underline underline-offset-8" href="/account">View account</Link>
          </>
        )}
      </div>
    </section>
  );
}
