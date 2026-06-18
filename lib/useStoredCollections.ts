"use client";

import { useEffect, useState } from "react";
import type { Collection } from "@/lib/data";
import { collections as initialCollections } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { fetchCollections } from "@/lib/supabaseCatalog";

const collectionChangeEvent = "vaporis-collections-change";
let cachedCollections = initialCollections;
let collectionsLoaded = !isSupabaseConfigured;
let collectionsRequest: Promise<Collection[]> | null = null;

export function notifyCollectionsChanged() {
  window.dispatchEvent(new Event(collectionChangeEvent));
}

export function saveStoredCollections(_collections: Collection[]) {
  notifyCollectionsChanged();
}

export function useStoredCollections() {
  return useCollectionsResource().collections;
}

export function useCollectionsResource() {
  const [collections, setCollections] = useState<Collection[]>(cachedCollections);
  const [isLoading, setIsLoading] = useState(!collectionsLoaded);

  useEffect(() => {
    let active = true;

    async function loadCollections() {
      if (!isSupabaseConfigured) {
        collectionsLoaded = true;
        setIsLoading(false);
        return;
      }

      try {
        collectionsRequest ||= fetchCollections();
        const nextCollections = await collectionsRequest;
        if (active) {
          cachedCollections = nextCollections;
          collectionsLoaded = true;
          setCollections(nextCollections);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Unable to load collections from Supabase", error);
        if (active) {
          collectionsLoaded = true;
          setCollections(cachedCollections);
          setIsLoading(false);
        }
      } finally {
        collectionsRequest = null;
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

  return { collections, isLoading };
}
