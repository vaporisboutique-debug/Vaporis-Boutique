"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { CheckoutButton } from "@/components/CheckoutButton";
import { deliveryFee, formatOmr, getProductPricing } from "@/lib/data";
import { removeCartProduct, setCartProductQuantity, useCart } from "@/lib/useCart";

export function CartContent() {
  const { hasStockIssue, items, productTotal } = useCart();
  const finalTotal = productTotal > 0 ? productTotal + deliveryFee : 0;

  return (
    <section className="container-pad grid gap-10 py-14 lg:grid-cols-[1fr_380px]">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-brass">Cart</p>
        <h1 className="mt-4 font-serif text-6xl">Shopping Bag</h1>
        {items.length > 0 ? <div className="mt-10 divide-y divide-ink/12 border-y border-ink/12">
          {items.map((item) => (
            <article key={item.slug} className="grid gap-5 py-6 sm:grid-cols-[100px_1fr_auto]">
              <div className="boutique-visual aspect-square" style={{ "--visual-bg": `linear-gradient(145deg, ${item.accent}, #fffaf2, ${item.color})` } as CSSProperties} />
              <div>
                <h2 className="font-serif text-2xl">{item.name}</h2>
                <p className="mt-1 text-sm text-ink/60">{item.notes}</p>
                {item.stock <= 0 ? <p className="mt-3 text-xs uppercase tracking-[0.18em] text-rosewood">Out of Stock</p> : null}
                {item.qty > item.stock ? <p className="mt-3 text-sm text-rosewood">Only {item.stock} available.</p> : null}
                <div className="mt-4 flex w-fit items-center border border-ink/15">
                  <button type="button" disabled={item.qty <= 1} onClick={() => setCartProductQuantity(item, item.qty - 1)} className="grid size-10 place-items-center disabled:text-ink/25" aria-label="Decrease quantity"><Minus size={14} /></button>
                  <span className="w-10 text-center text-sm">{item.qty}</span>
                  <button type="button" disabled={item.qty >= item.stock} onClick={() => setCartProductQuantity(item, item.qty + 1)} className="grid size-10 place-items-center disabled:text-ink/25" aria-label="Increase quantity"><Plus size={14} /></button>
                </div>
              </div>
              <div className="flex items-start gap-5">
                <p className="text-sm uppercase tracking-[0.14em]">{formatOmr(getProductPricing(item).currentPrice * item.qty)}</p>
                <button type="button" onClick={() => removeCartProduct(item.slug)} className="grid size-9 place-items-center rounded-full border border-ink/15" aria-label={`Remove ${item.name}`}><Trash2 size={15} /></button>
              </div>
            </article>
          ))}
        </div> : (
          <div className="mt-10 border border-ink/10 bg-porcelain px-6 py-16 text-center">
            <h2 className="font-serif text-3xl">Your bag is empty</h2>
            <Link href="/products" className="mt-6 inline-flex border border-ink px-5 py-3 text-xs uppercase tracking-[0.18em]">Browse products</Link>
          </div>
        )}
      </div>
      <aside className="h-fit border border-ink/12 bg-porcelain p-6">
        <h2 className="font-serif text-3xl">Order Summary</h2>
        <div className="mt-6 grid gap-4 text-sm">
          <div className="flex justify-between"><span>Product total</span><strong>{formatOmr(productTotal)}</strong></div>
          <div className="flex justify-between"><span>Muscat delivery</span><strong>{productTotal > 0 ? formatOmr(deliveryFee) : formatOmr(0)}</strong></div>
          <div className="mt-3 flex justify-between border-t border-ink/12 pt-4 text-lg"><span>Final total</span><strong>{formatOmr(finalTotal)}</strong></div>
        </div>
        {hasStockIssue ? <p className="mt-5 text-sm text-rosewood">Adjust your bag before checkout. Quantity cannot exceed available stock.</p> : null}
        <CheckoutButton disabled={items.length === 0 || hasStockIssue} />
      </aside>
    </section>
  );
}
