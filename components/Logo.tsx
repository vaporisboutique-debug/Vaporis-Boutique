"use client";

import Link from "next/link";
import { useState } from "react";
import { SafeImage } from "@/components/SafeImage";
import { useSiteSettingsResource } from "@/lib/useSiteSettings";

export function Logo({ compact = false }: { compact?: boolean }) {
  const { settings, isLoading } = useSiteSettingsResource();
  const [useFallbackLogo, setUseFallbackLogo] = useState(false);
  const src = useFallbackLogo ? "/brand/vaporis-logo.png" : settings.logoUrl || "/brand/vaporis-logo.png";
  const skeletonClass = compact ? "h-16 w-44 sm:w-56" : "h-20 w-64 sm:w-[360px]";

  return (
    <Link href="/" className="inline-flex items-center justify-center" aria-label="Vaporis Boutique home">
      {isLoading ? (
        <span className={`${skeletonClass} block animate-pulse bg-porcelain`} />
      ) : (
        <SafeImage
          src={src}
          alt="Vaporis Boutique"
          width={compact ? 220 : 360}
          height={compact ? 96 : 102}
          priority={!compact}
          className={compact ? "h-auto w-44 sm:w-56" : "h-auto w-64 sm:w-[360px]"}
          onFail={() => setUseFallbackLogo(true)}
        />
      )}
    </Link>
  );
}
