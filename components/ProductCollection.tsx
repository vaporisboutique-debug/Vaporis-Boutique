"use client";

import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/lib/data";
import { useCollectionsResource } from "@/lib/useStoredCollections";
import { useProductsResource } from "@/lib/useStoredProducts";
import { SafeImage } from "@/components/SafeImage";

export function ProductCollection({ limit, grouped = false }: { limit?: number; grouped?: boolean }) {
  const { products: items, isLoading: productsLoading } = useProductsResource();
  const { collections, isLoading: collectionsLoading } = useCollectionsResource();
  const isLoading = productsLoading || (grouped && collectionsLoading);

  const visibleItems = typeof limit === "number" ? items.slice(0, limit) : items;

  if (isLoading) {
    const skeletonCount = limit || 4;
    return (
      <div className={limit ? "grid gap-10 md:grid-cols-3" : "grid gap-x-10 gap-y-16 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"}>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <article key={index}>
            <div className="aspect-[4/5] animate-pulse border border-ink/10 bg-porcelain" />
            <div className="mt-6 h-8 w-2/3 animate-pulse bg-porcelain" />
            <div className="mt-3 h-5 w-full animate-pulse bg-porcelain" />
            <div className="mt-5 h-11 w-36 animate-pulse bg-porcelain" />
          </article>
        ))}
      </div>
    );
  }

  if (visibleItems.length === 0) {
    return (
      <div className="border border-ink/10 bg-porcelain px-6 py-16 text-center">
        <h2 className="font-serif text-3xl">No products yet</h2>
      </div>
    );
  }

  if (grouped) {
    const groupedItems = collections
      .map((collection) => ({
        collection,
        products: visibleItems.filter((product) => product.collectionId === collection.id)
      }))
      .filter((group) => group.products.length > 0);
    const unassignedProducts = visibleItems.filter(
      (product) => !product.collectionId || !collections.some((collection) => collection.id === product.collectionId)
    );
    const sections: Array<{ id: string; name: string; description?: string; imageUrl?: string; products: Product[] }> = [
      ...groupedItems.map((group) => ({ ...group.collection, products: group.products })),
      ...(unassignedProducts.length > 0 ? [{ id: "unassigned", name: "Collection", products: unassignedProducts }] : [])
    ];

    return (
      <div className="grid gap-16">
        {sections.map((section) => (
          <section key={section.id} className="reveal">
            <div className="mb-8 grid gap-6 border-b border-ink/10 pb-6 md:grid-cols-[220px_1fr] md:items-end">
              {section.id !== "unassigned" && "imageUrl" in section && section.imageUrl ? (
                <div className="relative aspect-[4/3] overflow-hidden border border-ink/10 bg-porcelain">
                  <SafeImage src={section.imageUrl} alt={section.name} fill className="object-cover" />
                </div>
              ) : null}
              <div>
                <h2 className="font-serif text-4xl">{section.name}</h2>
                {section.description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/62">{section.description}</p> : null}
              </div>
            </div>
            <div className="grid gap-x-10 gap-y-16 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {section.products.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  }

  return (
    <div className={limit ? "grid gap-10 md:grid-cols-3" : "grid gap-x-10 gap-y-16 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"}>
      {visibleItems.map((product) => (
        <ProductCard key={product.slug} product={product} />
      ))}
    </div>
  );
}
