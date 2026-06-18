"use client";

import Link from "next/link";
import { useSiteSettingsResource } from "@/lib/useSiteSettings";

export function HomeHero() {
  const { settings, isLoading } = useSiteSettingsResource();

  if (isLoading) {
    return (
      <section className="container-pad py-6 sm:py-8">
        <div className="relative flex min-h-[78vh] animate-pulse overflow-hidden border border-ink/10 bg-porcelain px-5 py-8 sm:px-10 lg:min-h-[86vh] lg:px-16">
          <div className="mt-auto w-full max-w-4xl">
            <div className="h-3 w-44 bg-ink/10" />
            <div className="mt-6 h-16 w-full max-w-3xl bg-ink/10 sm:h-24" />
            <div className="mt-4 h-16 w-full max-w-2xl bg-ink/8" />
            <div className="mt-8 h-12 w-44 bg-ink/10" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="container-pad py-6 sm:py-8">
      <div
        className="reveal photo-grain relative flex min-h-[78vh] overflow-hidden border border-ink/10 bg-[linear-gradient(135deg,#ffffff_0%,#faf9f6_52%,#e9e0d1_100%)] px-5 py-8 sm:px-10 lg:min-h-[86vh] lg:px-16"
        style={settings.heroImageUrl ? { backgroundImage: `linear-gradient(rgba(255,255,255,.2), rgba(255,255,255,.72)), url(${settings.heroImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
      >
        <div className="mt-auto max-w-4xl">
          <p className="text-xs uppercase tracking-[0.28em] text-brass" style={settings.accentColor ? { color: settings.accentColor } : undefined}>Vaporis Boutique</p>
          <h1 className="mt-5 font-serif text-5xl leading-[0.96] sm:text-7xl lg:text-8xl">
            {settings.heroTitle || "Quiet luxury for daily rituals and thoughtful gifts."}
          </h1>
          {settings.heroSubtitle ? <p className="mt-6 max-w-2xl text-base leading-7 text-ink/68 sm:text-lg">{settings.heroSubtitle}</p> : null}
          <Link href="/products" className="mt-8 inline-flex border border-ink bg-paper px-6 py-4 text-xs uppercase tracking-[0.22em] transition hover:bg-ink hover:text-paper">
            Shop collection
          </Link>
        </div>
      </div>
    </section>
  );
}
