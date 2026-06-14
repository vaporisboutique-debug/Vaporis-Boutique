"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/useCart";

export function CartHeaderLink() {
  const { count } = useCart();

  return (
    <Link href="/cart" className="relative grid size-9 place-items-center rounded-full border border-ink/15 transition hover:border-rosewood" aria-label={`Cart with ${count} items`}>
      <ShoppingBag size={17} strokeWidth={1.6} />
      {count > 0 ? (
        <span className="absolute -right-2 -top-2 grid min-w-5 place-items-center rounded-full bg-ink px-1.5 text-[0.62rem] leading-5 text-paper">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
