"use client";

import Link from "next/link";
import { Facebook, Instagram, Mail, Music2 } from "lucide-react";
import { FeaturedCollections } from "@/components/FeaturedCollections";
import { HomeHero } from "@/components/HomeHero";
import { ProductCollection } from "@/components/ProductCollection";
import { SafeImage } from "@/components/SafeImage";
import { socialAccounts } from "@/lib/data";
import { useSiteSettings } from "@/lib/useSiteSettings";

export default function HomePage() {
  const settings = useSiteSettings();
  const showBrandStory = settings.brandStoryVisible ?? true;

  return (
    <>
      <HomeHero />
      <FeaturedCollections />

      <section className="container-pad reveal py-16">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-brass">Featured edit</p>
            <h2 className="mt-3 font-serif text-4xl">{settings.newestProductsTitle || "Newest Products"}</h2>
            {settings.newestProductsSubtitle ? <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/62">{settings.newestProductsSubtitle}</p> : null}
          </div>
          <Link href="/products" className="text-xs uppercase tracking-[0.22em] underline underline-offset-8">
            View all
          </Link>
        </div>
        <ProductCollection limit={3} />
      </section>

      {showBrandStory ? (
        <section className="container-pad reveal grid gap-10 py-16 lg:grid-cols-[0.9fr_1.1fr]">
          <div
            className="photo-grain min-h-[440px] border border-ink/10 bg-[linear-gradient(155deg,#ffffff,#faf9f6_48%,#d9cfbc)]"
            style={settings.brandStoryImageUrl ? { backgroundImage: `url(${settings.brandStoryImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
          />
          <div className="flex flex-col justify-center">
            <p className="text-xs uppercase tracking-[0.28em] text-brass">{settings.brandStorySubtitle || "Brand story"}</p>
            <h2 className="mt-4 font-serif text-5xl leading-tight">{settings.brandStoryTitle || "Composed with restraint, wrapped with ceremony."}</h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-ink/70">
              {settings.brandText || "Vaporis Boutique is a Muscat boutique for refined daily rituals: curated products, elegant presentation, and gift details that feel personal without excess."}
            </p>
            {settings.brandStoryButtonText && settings.brandStoryButtonLink ? (
              <Link href={settings.brandStoryButtonLink} className="mt-8 inline-flex w-fit border border-ink px-5 py-3 text-xs uppercase tracking-[0.18em]">
                {settings.brandStoryButtonText}
              </Link>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="container-pad reveal py-14 text-center">
        <div className="mx-auto max-w-3xl border-y border-ink/12 py-10">
          <SafeImage src="/brand/vaporis-socials.png" alt="Vaporis Boutique social accounts" width={1078} height={323} className="mx-auto h-auto w-full max-w-2xl" />
          <div className="mt-6 flex justify-center gap-4">
            <a className="grid size-11 place-items-center rounded-full border border-ink/15" href={socialAccounts.instagram} aria-label="Instagram"><Instagram size={19} /></a>
            <a className="grid size-11 place-items-center rounded-full border border-ink/15" href={socialAccounts.tiktok} aria-label="TikTok"><Music2 size={19} /></a>
            <a className="grid size-11 place-items-center rounded-full border border-ink/15" href={socialAccounts.facebook} aria-label="Facebook"><Facebook size={19} /></a>
            <a className="grid size-11 place-items-center rounded-full border border-ink/15" href={socialAccounts.x} aria-label="X">X</a>
            <a className="grid size-11 place-items-center rounded-full border border-ink/15" href={`mailto:${socialAccounts.email}`} aria-label="Email"><Mail size={19} /></a>
          </div>
        </div>
      </section>
    </>
  );
}
