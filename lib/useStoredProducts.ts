"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/lib/data";
import { products as initialProducts } from "@/lib/data";
import { fetchProducts } from "@/lib/supabaseCatalog";

const productChangeEvent = "vaporis-products-change";
let cachedProducts = initialProducts;

export function notifyProductsChanged() {
  window.dispatchEvent(new Event(productChangeEvent));
}

export function saveStoredProducts(_products: Product[]) {
  notifyProductsChanged();
}

export function useStoredProducts() {
  const [products, setProducts] = useState<Product[]>(cachedProducts);

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      try {
        const nextProducts = await fetchProducts();
        if (active) {
          cachedProducts = nextProducts;
          setProducts(nextProducts);
        }
      } catch (error) {
        console.error("Unable to load products from Supabase", error);
        if (active) {
          setProducts(cachedProducts);
        }
      }
    }

    function reloadProducts() {
      void loadProducts();
    }

    void loadProducts();
    window.addEventListener(productChangeEvent, reloadProducts);
    return () => {
      active = false;
      window.removeEventListener(productChangeEvent, reloadProducts);
    };
  }, []);

  return products;
}
