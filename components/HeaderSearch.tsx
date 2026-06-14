"use client";

import Link from "next/link";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { formatOmr, getProductPricing } from "@/lib/data";
import { useStoredCollections } from "@/lib/useStoredCollections";
import { useStoredProducts } from "@/lib/useStoredProducts";

export function HeaderSearch() {
  const products = useStoredProducts();
  const collections = useStoredCollections();
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [collectionId, setCollectionId] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [newestOnly, setNewestOnly] = useState(false);
  const [featuredOnly, setFeaturedOnly] = useState(false);

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const priceLimit = Number(maxPrice);

    if (!normalizedQuery && !collectionId && !maxPrice && !newestOnly && !featuredOnly) {
      return [];
    }

    return products.filter((product) => {
      const collection = collections.find((item) => item.id === product.collectionId);
      const pricing = getProductPricing(product);
      const searchableText = [
        product.name,
        product.description,
        product.notes,
        collection?.name,
        collection?.description,
        ...(product.tags || [])
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return (
        (!normalizedQuery || searchableText.includes(normalizedQuery)) &&
        (!collectionId || product.collectionId === collectionId) &&
        (!maxPrice || pricing.currentPrice <= priceLimit) &&
        (!newestOnly || Boolean(product.createdAt)) &&
        (!featuredOnly || product.isFeatured)
      );
    });
  }, [collectionId, collections, featuredOnly, maxPrice, newestOnly, products, query]);

  const searchIsActive = query || collectionId || maxPrice || newestOnly || featuredOnly;

  return (
    <div className="relative w-full max-w-xl">
      <div className="flex min-h-11 items-center border border-ink/12 bg-paper">
        <Search className="ml-3 shrink-0 text-ink/48" size={17} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm normal-case tracking-normal outline-none placeholder:text-ink/36"
          placeholder="Search products"
          aria-label="Search products"
        />
        <button type="button" onClick={() => setShowFilters((value) => !value)} className="grid size-11 place-items-center border-l border-ink/10" aria-label="Search filters">
          <SlidersHorizontal size={16} />
        </button>
        {searchIsActive ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCollectionId("");
              setMaxPrice("");
              setNewestOnly(false);
              setFeaturedOnly(false);
            }}
            className="grid size-11 place-items-center border-l border-ink/10"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        ) : null}
      </div>

      {showFilters ? (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 grid gap-3 border border-ink/12 bg-paper p-4 text-sm normal-case tracking-normal shadow-soft">
          <select className="border border-ink/12 bg-paper px-3 py-3" value={collectionId} onChange={(event) => setCollectionId(event.target.value)} aria-label="Collection filter">
            <option value="">All collections</option>
            {collections.map((collection) => (
              <option key={collection.id} value={collection.id}>{collection.name}</option>
            ))}
          </select>
          <input className="border border-ink/12 bg-paper px-3 py-3" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} type="number" min="0" step="0.001" placeholder="Max price OMR" aria-label="Maximum price" />
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={newestOnly} onChange={(event) => setNewestOnly(event.target.checked)} />
            Newest products
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={featuredOnly} onChange={(event) => setFeaturedOnly(event.target.checked)} />
            Featured products
          </label>
        </div>
      ) : null}

      {searchIsActive ? (
        <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-[70vh] overflow-auto border border-ink/12 bg-paper p-3 normal-case tracking-normal shadow-soft">
          {results.length > 0 ? (
            <div className="grid gap-2">
              {results.map((product) => {
                const collection = collections.find((item) => item.id === product.collectionId);
                const pricing = getProductPricing(product);
                return (
                  <Link key={product.slug} href={`/products/${product.slug}`} className="grid gap-1 border border-ink/8 p-3 transition hover:border-ink/30 hover:bg-porcelain" onClick={() => setQuery("")}>
                    <span className="font-serif text-xl">{product.name}</span>
                    <span className="text-xs uppercase tracking-[0.14em] text-ink/48">{collection?.name || "Product"} · {formatOmr(pricing.currentPrice)}</span>
                    {product.description ? <span className="line-clamp-2 text-sm leading-6 text-ink/62">{product.description}</span> : null}
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-sm text-ink/58">No products found</div>
          )}
        </div>
      ) : null}
    </div>
  );
}
