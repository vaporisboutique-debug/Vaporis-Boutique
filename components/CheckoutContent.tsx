"use client";

import { CheckoutForm } from "@/components/CheckoutForm";
import { useCart } from "@/lib/useCart";

export function CheckoutContent() {
  const { items, productTotal } = useCart();

  return <CheckoutForm cartItems={items} productTotal={productTotal} />;
}
