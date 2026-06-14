"use client";

import { useEffect, useState } from "react";
import type { Collection } from "@/lib/data";
import { collections as initialCollections } from "@/lib/data";
import { fetchCollections } from "@/lib/supabaseCatalog";

const collectionChangeEvent = "vaporis-collections-change";
let cachedCollections = initialCollections;

export function notifyCollectionsChanged() {
  window.dispatchEvent(new Event(collectionChangeEvent));
}

export function saveStoredCollections(_collections: Collection[]) {
  notifyCollectionsChanged();
}

export function useStoredCollections() {
  const [collections, setCollections] = useState<Collection[]>(cachedCollections);

  useEffect(() => {
    let active = true;

    async function loadCollections() {
      try {
        const nextCollections = await fetchCollections();
        if (active) {
          cachedCollections = nextCollections;
          setCollections(nextCollections);
        }
      } catch (error) {
        console.error("Unable to load collections from Supabase", error);
        if (active) {
          setCollections(cachedCollections);
        }
      }
    }

    function reloadCollections() {
      void loadCollections();
    }

    void loadCollections();
    window.addEventListener(collectionChangeEvent, reloadCollections);
    return () => {
      active = false;
      window.removeEventListener(collectionChangeEvent, reloadCollections);
    };
  }, []);

  return collections;
}
