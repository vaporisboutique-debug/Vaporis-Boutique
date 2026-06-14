"use client";

import Link from "next/link";
import { Eye, ShoppingBag } from "lucide-react";
import { useState } from "react";
import type { Product } from "@/lib/data";
import { formatOmr, getProductPricing, isOutOfStock } from "@/lib/data";
import { addCartProduct } from "@/lib/useCart";
import { ProductArt } from "./ProductArt";

export function ProductCard({ product }: { product: Product }) {
  const pricing = getProductPricing(product);
  const outOfStock = isOutOfStock(product);
  const [added, setAdded] = useState(false);

  function addToCart() {
    addCartProduct(product);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  }

  return (
    <article className="group reveal">
      <Link href={`/products/${product.slug}`} className="relative block">
        {pricing.hasDiscount ? (
          <span className="absolute right-3 top-3 z-10 bg-ink px-3 py-2 text-[0.65rem] uppercase tracking-[0.16em] text-paper">
            {pricing.discountPercent}% OFF
          </span>
        ) : null}
        <ProductArt product={product} />
        <div className="mt-6 flex items-start justify-between gap-5">
          <div>
            <h3 className="font-serif text-3xl">{product.name}</h3>
            <p className="mt-1 text-sm leading-6 text-ink/62">{product.notes}</p>
            {outOfStock ? <p className="mt-3 text-xs uppercase tracking-[0.18em] text-rosewood">Out of Stock</p> : null}
          </div>
          <div className="text-right">
            {pricing.hasDiscount ? <p className="text-xs uppercase tracking-[0.14em] text-ink/42 line-through">{formatOmr(pricing.originalPrice)}</p> : null}
            <p className="text-sm uppercase tracking-[0.16em]">{formatOmr(pricing.currentPrice)}</p>
          </div>
        </div>
      </Link>
      <div className="mt-5 flex flex-wrap gap-3 opacity-100 transition duration-300 sm:opacity-0 sm:group-hover:opacity-100">
        <Link
          href={`/products/${product.slug}`}
          className="inline-flex items-center gap-2 border border-ink/20 px-4 py-3 text-xs uppercase tracking-[0.18em] transition hover:border-ink hover:bg-ink hover:text-paper"
        >
          <Eye size={16} />
          Quick view
        </Link>
        {outOfStock ? (
          <span className="inline-flex cursor-not-allowed items-center gap-2 border border-ink/15 px-4 py-3 text-xs uppercase tracking-[0.18em] text-ink/35">
            <ShoppingBag size={16} />
            Out of Stock
          </span>
        ) : (
          <button
            type="button"
            onClick={addToCart}
            className="inline-flex items-center gap-2 border border-ink px-4 py-3 text-xs uppercase tracking-[0.18em] transition hover:bg-ink hover:text-paper"
          >
            <ShoppingBag size={16} />
            {added ? "Added" : "Add"}
          </button>
        )}
      </div>
    </article>
  );
}
