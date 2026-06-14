"use client";

import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/lib/data";
import { getProductPricing, isOutOfStock } from "@/lib/data";
import { useStoredProducts } from "@/lib/useStoredProducts";

export type CartLine = {
  slug: string;
  qty: number;
};

export type CartItem = Product & {
  qty: number;
  lineTotal: number;
};

const cartStorageKey = "vaporis_cart";
const cartChangeEvent = "vaporis-cart-change";
let cachedCart: CartLine[] = [];

function readCart() {
  if (typeof window === "undefined") {
    return cachedCart;
  }

  const savedCart = window.localStorage.getItem(cartStorageKey);
  if (!savedCart) {
    cachedCart = [];
    return cachedCart;
  }

  try {
    cachedCart = JSON.parse(savedCart) as CartLine[];
  } catch {
    cachedCart = [];
  }

  return cachedCart;
}

function writeCart(lines: CartLine[]) {
  cachedCart = lines;
  window.localStorage.setItem(cartStorageKey, JSON.stringify(lines));
  window.dispatchEvent(new Event(cartChangeEvent));
}

export function addCartProduct(product: Product, quantity = 1) {
  if (isOutOfStock(product)) {
    return;
  }

  const lines = readCart();
  const current = lines.find((line) => line.slug === product.slug);
  const currentQty = current?.qty || 0;
  const nextQty = Math.min(product.stock, currentQty + quantity);
  const nextLines = current
    ? lines.map((line) => (line.slug === product.slug ? { ...line, qty: nextQty } : line))
    : [...lines, { slug: product.slug, qty: Math.max(1, nextQty) }];

  writeCart(nextLines.filter((line) => line.qty > 0));
}

export function setCartProductQuantity(product: Product, quantity: number) {
  const lines = readCart();
  const nextQty = Math.min(Math.max(quantity, 0), product.stock);
  const nextLines = nextQty === 0
    ? lines.filter((line) => line.slug !== product.slug)
    : lines.map((line) => (line.slug === product.slug ? { ...line, qty: nextQty } : line));

  writeCart(nextLines);
}

export function removeCartProduct(slug: string) {
  writeCart(readCart().filter((line) => line.slug !== slug));
}

export function clearCart() {
  writeCart([]);
}

export function useCart() {
  const products = useStoredProducts();
  const [lines, setLines] = useState<CartLine[]>(cachedCart);

  useEffect(() => {
    function syncCart() {
      setLines(readCart());
    }

    syncCart();
    window.addEventListener(cartChangeEvent, syncCart);
    window.addEventListener("storage", syncCart);
    return () => {
      window.removeEventListener(cartChangeEvent, syncCart);
      window.removeEventListener("storage", syncCart);
    };
  }, []);

  const items = useMemo<CartItem[]>(() => {
    return lines
      .map((line) => {
        const product = products.find((item) => item.slug === line.slug);
        if (!product) {
          return null;
        }

        const qty = Math.min(line.qty, product.stock);
        return {
          ...product,
          qty,
          lineTotal: getProductPricing(product).currentPrice * qty
        };
      })
      .filter((item): item is CartItem => Boolean(item));
  }, [lines, products]);

  const count = items.reduce((total, item) => total + item.qty, 0);
  const productTotal = items.reduce((total, item) => total + item.lineTotal, 0);
  const hasStockIssue = items.some((item) => item.qty > item.stock || item.stock <= 0);

  return {
    count,
    hasStockIssue,
    items,
    productTotal
  };
}
