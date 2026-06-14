"use client";

import type { CSSProperties } from "react";
import type { Product } from "@/lib/data";
import { SafeImage } from "@/components/SafeImage";

export function ProductArt({ product, tall = false }: { product: Product; tall?: boolean }) {
  if (product.imageUrl) {
    return (
      <div className={`photo-grain relative overflow-hidden bg-porcelain ${tall ? "min-h-[560px]" : "aspect-[3/4]"}`}>
        <SafeImage src={product.imageUrl} alt={product.name} fill className="object-cover transition duration-700 group-hover:scale-105" />
      </div>
    );
  }

  return (
    <div
      className={`photo-grain boutique-visual flex items-end justify-center transition duration-700 group-hover:scale-[1.015] ${tall ? "min-h-[560px]" : "aspect-[3/4]"}`}
      style={{ "--visual-bg": `linear-gradient(145deg, ${product.accent}, #fffaf2 52%, ${product.color})` } as CSSProperties}
    >
      <div className="mb-[14%] flex w-[42%] flex-col items-center">
        <div className="h-8 w-16 rounded-t-full border border-ink/45 bg-paper/80" />
        <div className="h-5 w-10 bg-ink/80" />
        <div className="flex aspect-[3/4] w-full flex-col items-center justify-center border border-ink/35 bg-paper/82 px-3 text-center shadow-soft backdrop-blur-sm">
          <span className="font-serif text-lg text-ink sm:text-2xl">V</span>
          <span className="mt-2 text-[0.55rem] uppercase tracking-[0.24em] text-ink/70">{product.name}</span>
        </div>
      </div>
    </div>
  );
}
