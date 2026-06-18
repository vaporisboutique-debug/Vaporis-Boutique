"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/lib/data";
import { products as initialProducts } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { fetchProducts } from "@/lib/supabaseCatalog";

const productChangeEvent = "vaporis-products-change";
let cachedProducts = initialProducts;
let productsLoaded = !isSupabaseConfigured;
let productsRequest: Promise<Product[]> | null = null;

export function notifyProductsChanged() {
  window.dispatchEvent(new Event(productChangeEvent));
}

export function saveStoredProducts(_products: Product[]) {
  notifyProductsChanged();
}

export function useStoredProducts() {
  return useProductsResource().products;
}

export function useProductsResource() {
  const [products, setProducts] = useState<Product[]>(cachedProducts);
  const [isLoading, setIsLoading] = useState(!productsLoaded);

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      if (!isSupabaseConfigured) {
        productsLoaded = true;
        setIsLoading(false);
        return;
      }

      try {
        productsRequest ||= fetchProducts();
        const nextProducts = await productsRequest;
        if (active) {
          cachedProducts = nextProducts;
          productsLoaded = true;
          setProducts(nextProducts);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Unable to load products from Supabase", error);
        if (active) {
          productsLoaded = true;
          setProducts(cachedProducts);
          setIsLoading(false);
        }
      } finally {
        productsRequest = null;
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

  return { products, isLoading };
}
