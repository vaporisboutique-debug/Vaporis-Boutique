"use client";

import Link from "next/link";
import { useCollectionsResource } from "@/lib/useStoredCollections";
import { useSiteSettingsResource } from "@/lib/useSiteSettings";
import { SafeImage } from "@/components/SafeImage";

export function FeaturedCollections() {
  const { collections, isLoading: collectionsLoading } = useCollectionsResource();
  const { settings, isLoading: settingsLoading } = useSiteSettingsResource();
  const isLoading = collectionsLoading || settingsLoading;

  if (isLoading) {
    return (
      <section className="container-pad reveal py-16">
        <div className="mb-8">
          <div className="h-3 w-44 animate-pulse bg-porcelain" />
          <div className="mt-4 h-12 w-64 animate-pulse bg-porcelain" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item}>
              <div className="aspect-[4/5] animate-pulse border border-ink/10 bg-porcelain" />
              <div className="mt-5 h-8 w-40 animate-pulse bg-porcelain" />
              <div className="mt-3 h-5 w-full animate-pulse bg-porcelain" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (collections.length === 0) {
    return null;
  }

  return (
    <section className="container-pad reveal py-16">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-brass">Featured collections</p>
          <h2 className="mt-3 font-serif text-4xl sm:text-5xl">{settings.featuredCollectionsTitle || "Collections"}</h2>
          {settings.featuredCollectionsSubtitle ? <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/62">{settings.featuredCollectionsSubtitle}</p> : null}
        </div>
        <Link href="/products" className="text-xs uppercase tracking-[0.22em] underline underline-offset-8">
          View products
        </Link>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {collections.slice(0, 3).map((collection) => (
          <article key={collection.id} className="group">
            <div className="relative aspect-[4/5] overflow-hidden border border-ink/10 bg-porcelain">
              {collection.imageUrl ? <SafeImage src={collection.imageUrl} alt={collection.name} fill className="object-cover transition duration-700 group-hover:scale-105" /> : null}
            </div>
            <h3 className="mt-5 font-serif text-3xl">{collection.name}</h3>
            {collection.description ? <p className="mt-2 text-sm leading-6 text-ink/62">{collection.description}</p> : null}
          </article>
        ))}
      </div>
    </section>
  );
}
