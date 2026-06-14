"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export function CheckoutButton({ disabled = false }: { disabled?: boolean }) {
  const router = useRouter();

  async function goToCheckout() {
    const { data } = await supabase?.auth.getSession() || { data: { session: null } };
    router.push(data.session ? "/checkout" : "/login?next=/checkout");
  }

  return (
    <button
      disabled={disabled}
      onClick={goToCheckout}
      className="mt-8 flex w-full justify-center bg-ink px-6 py-4 text-xs uppercase tracking-[0.22em] text-paper disabled:cursor-not-allowed disabled:bg-ink/25"
    >
      Checkout
    </button>
  );
}
