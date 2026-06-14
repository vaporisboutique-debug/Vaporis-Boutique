"use client";

import Link from "next/link";
import { useState } from "react";
import { ProductArt } from "@/components/ProductArt";
import { formatOmr, getProductPricing, isLowStock, isOutOfStock } from "@/lib/data";
import { addCartProduct } from "@/lib/useCart";
import { useStoredProducts } from "@/lib/useStoredProducts";

export function ProductDetailClient({ slug }: { slug: string }) {
  const products = useStoredProducts();
  const [added, setAdded] = useState(false);
  const product = products.find((item) => item.slug === slug);

  if (!product) {
    return (
      <section className="container-pad py-16">
        <p className="text-xs uppercase tracking-[0.28em] text-brass">Product</p>
        <h1 className="mt-4 font-serif text-5xl">Product not found</h1>
        <Link href="/products" className="mt-8 inline-flex border border-ink px-5 py-3 text-xs uppercase tracking-[0.18em]">
          Back to products
        </Link>
      </section>
    );
  }

  const pricing = getProductPricing(product);
  const outOfStock = isOutOfStock(product);

  function addToCart() {
    if (!product) {
      return;
    }

    addCartProduct(product);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  }

  return (
    <section className="container-pad grid gap-10 py-12 lg:grid-cols-[1fr_0.85fr]">
      <ProductArt product={product} tall />
      <div className="flex flex-col justify-center">
        <p className="text-xs uppercase tracking-[0.28em] text-brass">{product.volume}</p>
        <h1 className="mt-5 font-serif text-6xl">{product.name}</h1>
        <p className="mt-5 text-xl text-ink/70">{product.notes}</p>
        <p className="mt-8 text-lg leading-8 text-ink/70">{product.description}</p>
        <div className="mt-8 border-y border-ink/12 py-6">
          <div className="mb-5">
            {pricing.hasDiscount ? (
              <div className="flex flex-wrap items-end gap-4">
                <span className="text-lg text-ink/42 line-through">{formatOmr(pricing.originalPrice)}</span>
                <strong className="font-serif text-5xl">{formatOmr(pricing.currentPrice)}</strong>
                <span className="bg-ink px-3 py-2 text-xs uppercase tracking-[0.16em] text-paper">{pricing.discountPercent}% OFF</span>
              </div>
            ) : (
              <strong className="font-serif text-5xl">{formatOmr(pricing.currentPrice)}</strong>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {pricing.hasDiscount ? (
              <>
                <span>Original price</span><strong>{formatOmr(pricing.originalPrice)}</strong>
                <span>Sale price</span><strong>{formatOmr(pricing.currentPrice)}</strong>
                <span>Amount saved</span><strong>{formatOmr(pricing.amountSaved)}</strong>
                <span>Discount</span><strong>{pricing.discountPercent}% off</strong>
              </>
            ) : (
              <>
                <span>Price</span><strong>{formatOmr(pricing.currentPrice)}</strong>
              </>
            )}
          <span>Stock</span><strong className={outOfStock ? "text-rosewood" : ""}>{outOfStock ? "Out of Stock" : `${product.stock} available`}</strong>
          <span>Delivery</span><strong>Muscat only</strong>
          </div>
        </div>
        {isLowStock(product) ? <p className="mt-5 text-sm text-rosewood">Low stock: {product.stock} remaining.</p> : null}
        {outOfStock ? (
          <span className="mt-8 inline-flex w-fit cursor-not-allowed items-center justify-center border border-ink/15 px-8 py-4 text-xs uppercase tracking-[0.22em] text-ink/35">
            Out of Stock
          </span>
        ) : (
          <button type="button" onClick={addToCart} className="mt-8 inline-flex w-fit items-center justify-center border border-ink bg-ink px-8 py-4 text-xs uppercase tracking-[0.22em] text-paper transition hover:bg-paper hover:text-ink">
            {added ? "Added to cart" : "Add to cart"}
          </button>
        )}
      </div>
    </section>
  );
}
