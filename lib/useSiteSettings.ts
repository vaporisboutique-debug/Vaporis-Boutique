"use client";

import { useEffect, useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
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
let settingsLoaded = !isSupabaseConfigured;
let settingsRequest: Promise<SiteSettings> | null = null;

export async function saveSiteSettings(settings: SiteSettings) {
  await upsertSiteSettings(settings);
  cachedSettings = settings;
  settingsLoaded = true;
  window.dispatchEvent(new Event(settingsChangeEvent));
}

export function useSiteSettings() {
  return useSiteSettingsResource().settings;
}

export function useSiteSettingsResource() {
  const [settings, setSettings] = useState<SiteSettings>(cachedSettings);
  const [isLoading, setIsLoading] = useState(!settingsLoaded);

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      if (!isSupabaseConfigured) {
        settingsLoaded = true;
        setIsLoading(false);
        return;
      }

      try {
        settingsRequest ||= fetchSiteSettings();
        const nextSettings = await settingsRequest;
        if (active) {
          cachedSettings = nextSettings;
          settingsLoaded = true;
          setSettings(nextSettings);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Unable to load site settings from Supabase", error);
        if (active) {
          settingsLoaded = true;
          setSettings(cachedSettings);
          setIsLoading(false);
        }
      } finally {
        settingsRequest = null;
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

  return { settings, isLoading };
}
