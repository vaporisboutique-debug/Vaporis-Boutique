"use client";

import { useEffect, useState } from "react";
import type { Profile } from "@/lib/data";
import { fetchProfiles } from "@/lib/supabaseCatalog";
import { isSupabaseConfigured } from "@/lib/supabaseClient";

const profilesChangeEvent = "vaporis-profiles-change";
let cachedProfiles: Profile[] = [];

export function notifyProfilesChanged() {
  window.dispatchEvent(new Event(profilesChangeEvent));
}

export function useSupabaseProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>(cachedProfiles);

  useEffect(() => {
    let active = true;

    async function loadProfiles() {
      if (!isSupabaseConfigured) {
        setProfiles([]);
        return;
      }

      try {
        const nextProfiles = await fetchProfiles();
        if (active) {
          cachedProfiles = nextProfiles;
          setProfiles(nextProfiles);
        }
      } catch (error) {
        console.error("Unable to load profiles from Supabase", error);
        if (active) {
          setProfiles(cachedProfiles);
        }
      }
    }

    function reloadProfiles() {
      void loadProfiles();
    }

    void loadProfiles();
    window.addEventListener(profilesChangeEvent, reloadProfiles);
    return () => {
      active = false;
      window.removeEventListener(profilesChangeEvent, reloadProfiles);
    };
  }, []);

  return profiles;
}
