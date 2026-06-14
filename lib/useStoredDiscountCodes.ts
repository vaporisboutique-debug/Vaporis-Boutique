"use client";

import { useEffect, useState } from "react";
import type { DiscountCode } from "@/lib/data";
import { discountCodes as initialDiscountCodes } from "@/lib/data";
import { fetchDiscountCodes } from "@/lib/supabaseCatalog";

const discountCodeChangeEvent = "vaporis-discount-codes-change";
const discountCodeStorageKey = "vaporis_discount_codes";
let cachedDiscountCodes = initialDiscountCodes;

function readLocalDiscountCodes() {
  const savedCodes = window.localStorage.getItem(discountCodeStorageKey);
  if (!savedCodes) {
    return initialDiscountCodes;
  }

  try {
    return JSON.parse(savedCodes) as DiscountCode[];
  } catch {
    return initialDiscountCodes;
  }
}

export function notifyDiscountCodesChanged() {
  window.dispatchEvent(new Event(discountCodeChangeEvent));
}

export function saveLocalDiscountCodes(codes: DiscountCode[]) {
  window.localStorage.setItem(discountCodeStorageKey, JSON.stringify(codes));
  cachedDiscountCodes = codes;
  notifyDiscountCodesChanged();
}

export function useStoredDiscountCodes() {
  const [codes, setCodes] = useState<DiscountCode[]>(cachedDiscountCodes);

  useEffect(() => {
    let active = true;

    async function loadCodes() {
      try {
        const nextCodes = await fetchDiscountCodes();
        if (active) {
          cachedDiscountCodes = nextCodes;
          setCodes(nextCodes);
        }
      } catch (error) {
        console.error("Unable to load discount codes from Supabase", error);
        if (active) {
          const localCodes = readLocalDiscountCodes();
          cachedDiscountCodes = localCodes;
          setCodes(localCodes);
        }
      }
    }

    function reloadCodes() {
      void loadCodes();
    }

    void loadCodes();
    window.addEventListener(discountCodeChangeEvent, reloadCodes);
    return () => {
      active = false;
      window.removeEventListener(discountCodeChangeEvent, reloadCodes);
    };
  }, []);

  return codes;
}
