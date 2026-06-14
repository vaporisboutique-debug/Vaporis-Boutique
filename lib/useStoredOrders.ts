"use client";

import { useEffect, useState } from "react";
import type { Order } from "@/lib/data";
import { orders as initialOrders } from "@/lib/data";
import { fetchOrders } from "@/lib/supabaseCatalog";
import { isSupabaseConfigured } from "@/lib/supabaseClient";

const orderStorageKey = "vaporis_orders";
const orderChangeEvent = "vaporis-orders-change";
let cachedRawOrders = "";
let cachedOrders = initialOrders;

function readLocalOrders() {
  const savedOrders = window.localStorage.getItem(orderStorageKey);
  if (!savedOrders) {
    cachedRawOrders = "";
    cachedOrders = initialOrders;
    return cachedOrders;
  }

  if (savedOrders !== cachedRawOrders) {
    cachedRawOrders = savedOrders;
    cachedOrders = JSON.parse(savedOrders) as Order[];
  }

  return cachedOrders;
}

export function saveStoredOrders(orders: Order[]) {
  window.localStorage.setItem(orderStorageKey, JSON.stringify(orders));
  cachedOrders = orders;
  window.dispatchEvent(new Event(orderChangeEvent));
}

export function notifyOrdersChanged() {
  window.dispatchEvent(new Event(orderChangeEvent));
}

export function useStoredOrders() {
  const [orders, setOrders] = useState<Order[]>(cachedOrders);

  useEffect(() => {
    let active = true;

    async function loadOrders() {
      try {
        const nextOrders = isSupabaseConfigured ? await fetchOrders() : readLocalOrders();
        if (active) {
          cachedOrders = nextOrders;
          setOrders(nextOrders);
        }
      } catch (error) {
        console.error("Unable to load orders from Supabase", error);
        if (active) {
          setOrders(cachedOrders);
        }
      }
    }

    function reloadOrders() {
      void loadOrders();
    }

    void loadOrders();
    window.addEventListener(orderChangeEvent, reloadOrders);
    window.addEventListener("storage", reloadOrders);
    return () => {
      active = false;
      window.removeEventListener(orderChangeEvent, reloadOrders);
      window.removeEventListener("storage", reloadOrders);
    };
  }, []);

  return orders;
}
