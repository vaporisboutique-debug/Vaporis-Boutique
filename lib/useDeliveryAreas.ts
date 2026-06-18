"use client";

import { useEffect, useState } from "react";
import { fetchActiveDeliveryAreas, type DeliveryArea } from "@/lib/supabaseCatalog";

let cachedDeliveryAreas: DeliveryArea[] = [];
let deliveryAreasLoaded = false;
let deliveryAreasRequest: Promise<DeliveryArea[]> | null = null;

export function useDeliveryAreas() {
  const [areas, setAreas] = useState<DeliveryArea[]>(cachedDeliveryAreas);
  const [isLoading, setIsLoading] = useState(!deliveryAreasLoaded);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadAreas() {
      try {
        deliveryAreasRequest ||= fetchActiveDeliveryAreas();
        const nextAreas = await deliveryAreasRequest;
        if (active) {
          cachedDeliveryAreas = nextAreas;
          deliveryAreasLoaded = true;
          setAreas(nextAreas);
          setError("");
          setIsLoading(false);
        }
      } catch (loadError) {
        if (active) {
          deliveryAreasLoaded = true;
          setAreas([]);
          setError(loadError instanceof Error ? loadError.message : "Unable to load delivery areas.");
          setIsLoading(false);
        }
      } finally {
        deliveryAreasRequest = null;
      }
    }

    void loadAreas();

    return () => {
      active = false;
    };
  }, []);

  return { areas, isLoading, error };
}
