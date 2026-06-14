"use client";

import Link from "next/link";
import { useState } from "react";
import { SafeImage } from "@/components/SafeImage";
import { useSiteSettings } from "@/lib/useSiteSettings";

export function Logo({ compact = false }: { compact?: boolean }) {
  const settings = useSiteSettings();
  const [useFallbackLogo, setUseFallbackLogo] = useState(false);
  const src = useFallbackLogo ? "/brand/vaporis-logo.png" : settings.logoUrl || "/brand/vaporis-logo.png";

  return (
    <Link href="/" className="inline-flex items-center justify-center" aria-label="Vaporis Boutique home">
      <SafeImage
        src={src}
        alt="Vaporis Boutique"
        width={compact ? 220 : 360}
        height={compact ? 96 : 102}
        priority={!compact}
        className={compact ? "h-auto w-44 sm:w-56" : "h-auto w-64 sm:w-[360px]"}
        onFail={() => setUseFallbackLogo(true)}
      />
    </Link>
  );
}
