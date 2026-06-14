"use client";

import Image from "next/image";
import { useState } from "react";

export function SafeImage({
  alt,
  className,
  fill = false,
  height,
  priority = false,
  src,
  width,
  onFail
}: {
  alt: string;
  className?: string;
  fill?: boolean;
  height?: number;
  priority?: boolean;
  src?: string;
  width?: number;
  onFail?: () => void;
}) {
  const [failed, setFailed] = useState(!src);

  if (!src || failed) {
    return null;
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      unoptimized
      priority={priority}
      onError={() => {
        setFailed(true);
        onFail?.();
      }}
      style={!fill ? { height: "auto" } : undefined}
      className={className}
    />
  );
}
