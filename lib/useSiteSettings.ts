"use client";

import { useEffect, useState } from "react";
import { fetchSiteSettings, upsertSiteSettings } from "@/lib/supabaseCatalog";

export type SiteSettings = {
  logoUrl?: string;
  heroImageUrl?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  newestProductsTitle?: string;
  newestProductsSubtitle?: string;
  featuredCollectionsTitle?: string;
  featuredCollectionsSubtitle?: string;
  brandStoryVisible?: boolean;
  brandStoryImageUrl?: string;
  brandStoryTitle?: string;
  brandStorySubtitle?: string;
  brandText?: string;
  brandStoryButtonText?: string;
  brandStoryButtonLink?: string;
  loginImageUrl?: string;
  loginTitle?: string;
  loginSubtitle?: string;
  createAccountTitle?: string;
  createAccountSubtitle?: string;
  verificationMessage?: string;
  instagram?: string;
  tiktok?: string;
  snapchat?: string;
  x?: string;
  facebook?: string;
  email?: string;
  accentColor?: string;
  footerText?: string;
  enabledRegions?: string[];
};

const settingsChangeEvent = "vaporis-site-settings-change";
const emptySettings: SiteSettings = {};
let cachedSettings: SiteSettings = emptySettings;

export async function saveSiteSettings(settings: SiteSettings) {
  await upsertSiteSettings(settings);
  cachedSettings = settings;
  window.dispatchEvent(new Event(settingsChangeEvent));
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(cachedSettings);

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      try {
        const nextSettings = await fetchSiteSettings();
        if (active) {
          cachedSettings = nextSettings;
          setSettings(nextSettings);
        }
      } catch (error) {
        console.error("Unable to load site settings from Supabase", error);
        if (active) {
          setSettings(cachedSettings);
        }
      }
    }

    function reloadSettings() {
      void loadSettings();
    }

    void loadSettings();
    window.addEventListener(settingsChangeEvent, reloadSettings);
    return () => {
      active = false;
      window.removeEventListener(settingsChangeEvent, reloadSettings);
    };
  }, []);

  return settings;
}
