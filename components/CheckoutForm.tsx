"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BadgePercent, Banknote, Gift, MapPin } from "lucide-react";
import { deliveryFee, deliveryNotice, formatOmr, giftWrapFee, muscatDeliveryAreas, outsideMuscatMessage } from "@/lib/data";
import { createSupabaseOrder } from "@/lib/supabaseCatalog";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import { clearCart, type CartItem } from "@/lib/useCart";
import { useStoredDiscountCodes } from "@/lib/useStoredDiscountCodes";
import { notifyOrdersChanged, saveStoredOrders, useStoredOrders } from "@/lib/useStoredOrders";

type DiscountResult = {
  amount: number;
  message: string;
  code: string;
};

function calculateDiscount(
  discountCodes: ReturnType<typeof useStoredDiscountCodes>,
  discountInput: string,
  totalBeforeDiscount: number,
  currentTime: number
): DiscountResult {
  const normalizedCode = discountInput.trim().toUpperCase();
  if (!normalizedCode) {
    return { amount: 0, message: "", code: "" };
  }

  const discountCode = discountCodes.find((item) => item.code.toUpperCase() === normalizedCode);
  if (!discountCode) {
    return { amount: 0, message: "Invalid discount code.", code: "" };
  }

  if (!discountCode.isActive) {
    return { amount: 0, message: "This discount code is inactive.", code: "" };
  }

  if (discountCode.expiresAt) {
    const expiresAt = new Date(`${discountCode.expiresAt}T23:59:59`);
    if (expiresAt.getTime() < currentTime) {
      return { amount: 0, message: "This discount code has expired.", code: "" };
    }
  }

  if (discountCode.minimumOrderAmount && totalBeforeDiscount < discountCode.minimumOrderAmount) {
    return { amount: 0, message: `Minimum order amount is ${formatOmr(discountCode.minimumOrderAmount)}.`, code: "" };
  }

  const rawDiscount = discountCode.type === "percentage" ? totalBeforeDiscount * (discountCode.value / 100) : discountCode.value;
  const amount = Math.min(totalBeforeDiscount, rawDiscount);
  return { amount, message: `Discount applied: ${discountCode.code}.`, code: discountCode.code };
}

function createLocalOrderId() {
  return `VB-${Date.now().toString().slice(-6)}`;
}

export function CheckoutForm({ cartItems = [], productTotal }: { cartItems?: CartItem[]; productTotal: number }) {
  const router = useRouter();
  const orders = useStoredOrders();
  const discountCodes = useStoredDiscountCodes();
  const [giftSelected, setGiftSelected] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");
  const [deliveryArea, setDeliveryArea] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryError, setDeliveryError] = useState("");
  const [orderError, setOrderError] = useState("");
  const [discountInput, setDiscountInput] = useState("");
  const [currentTime] = useState(() => Date.now());
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerName, setCustomerName] = useState("");

  useEffect(() => {
    async function verifySession() {
      const { data } = await supabase?.auth.getSession() || { data: { session: null } };
      if (!data.session) {
        router.replace(`/login?next=${encodeURIComponent("/checkout")}`);
        return;
      }

      setCustomerEmail(data.session.user.email || "");
    }

    void verifySession();
  }, [router]);

  async function submitPayment() {
    setOrderError("");
    const { data } = await supabase?.auth.getSession() || { data: { session: null } };
    if (!data.session && isSupabaseConfigured) {
      router.replace(`/login?next=${encodeURIComponent("/checkout")}`);
      return;
    }
    if (productTotal <= 0 || cartItems.length === 0) {
      router.replace("/cart");
      return;
    }
    if (!deliveryArea) {
      setDeliveryError(outsideMuscatMessage);
      return;
    }

    const addressText = deliveryAddress.toLowerCase();
    const mentionsOutsideMuscat = ["dubai", "abu dhabi", "doha", "riyadh", "salalah", "sohar", "nizwa", "sur", "oman outside muscat", "international"].some((term) =>
      addressText.includes(term)
    );

    if (mentionsOutsideMuscat) {
      setDeliveryError(outsideMuscatMessage);
      return;
    }

    setDeliveryError("");
    if (isSupabaseConfigured) {
      try {
        await createSupabaseOrder({
          customerName: customerName || customerEmail || "Customer",
          customerEmail,
          deliveryArea,
          deliveryAddress,
          giftWrapping: giftSelected,
          giftMessage: giftSelected ? giftMessage : undefined,
          productTotal,
          giftFee,
          deliveryFee,
          discountCode: discountResult.code || undefined,
          discountAmount: discountResult.amount,
          total: finalTotal,
          items: cartItems.map((item) => ({
            slug: item.slug,
            name: item.name,
            quantity: item.qty,
            unitPrice: item.lineTotal / item.qty,
            lineTotal: item.lineTotal
          }))
        });
        clearCart();
        notifyOrdersChanged();
      } catch (error) {
        setOrderError(error instanceof Error ? error.message : "Unable to place order. Please check stock and try again.");
      }
      return;
    }

    saveStoredOrders([{ id: createLocalOrderId(), customer: customerName || "Customer", status: "pending", total: finalTotal, paid: false, date: new Date().toLocaleDateString("en-OM"), deliveryArea, discountCode: discountResult.code || undefined, discountAmount: discountResult.amount || undefined }, ...orders]);
    clearCart();
  }

  const giftWordCount = giftMessage.trim().split(/\s+/).filter(Boolean).length;
  const giftFee = giftSelected ? giftWrapFee : 0;
  const totalBeforeDiscount = productTotal + deliveryFee + giftFee;
  const discountResult = calculateDiscount(discountCodes, discountInput, totalBeforeDiscount, currentTime);
  const finalTotal = Math.max(0, totalBeforeDiscount - discountResult.amount);

  function updateGiftMessage(value: string) {
    const words = value.trim().split(/\s+/).filter(Boolean);
    if (words.length <= 50) {
      setGiftMessage(value);
      return;
    }
    setGiftMessage(words.slice(0, 50).join(" "));
  }

  return (
    <section className="container-pad grid gap-10 py-14 lg:grid-cols-[1fr_420px]">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-brass">Secure checkout</p>
        <h1 className="mt-4 font-serif text-6xl">Delivery in Muscat</h1>
        <p className="mt-5 border border-ink/10 bg-porcelain px-5 py-4 text-sm text-ink/68">{deliveryNotice}</p>
        <form className="mt-10 grid gap-6">
          <div className="grid gap-3">
            <label className="text-xs uppercase tracking-[0.2em]">Full name</label>
            <input className="border border-ink/15 bg-paper px-4 py-4 outline-none focus:border-ink" placeholder="Your name" value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
          </div>
          <div className="grid gap-3">
            <label className="text-xs uppercase tracking-[0.2em]">Delivery area in Muscat</label>
            <select className="border border-ink/15 bg-paper px-4 py-4 outline-none focus:border-ink" value={deliveryArea} onChange={(event) => setDeliveryArea(event.target.value)} required>
              <option value="">Select Muscat area</option>
              {muscatDeliveryAreas.map((area) => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-3">
            <label className="text-xs uppercase tracking-[0.2em]">Muscat delivery address</label>
            <textarea
              className="min-h-28 border border-ink/15 bg-paper px-4 py-4 outline-none focus:border-ink"
              value={deliveryAddress}
              onChange={(event) => setDeliveryAddress(event.target.value)}
              placeholder="Street, building, phone number"
            />
          </div>
          <label className="flex items-center gap-3 border border-ink/12 p-4">
            <input
              type="checkbox"
              checked={giftSelected}
              onChange={(event) => {
                setGiftSelected(event.target.checked);
                if (!event.target.checked) {
                  setGiftMessage("");
                }
              }}
            />
            <Gift size={18} />
            <span className="text-sm">Add gift wrapping for {formatOmr(giftWrapFee)}</span>
          </label>
          {giftSelected ? (
            <div className="grid gap-3">
              <div className="flex items-end justify-between gap-4">
                <label className="text-xs uppercase tracking-[0.2em]">Gift card message</label>
                <span className="text-xs text-ink/50">{giftWordCount}/50 words</span>
              </div>
              <textarea
                className="min-h-28 border border-ink/15 bg-paper px-4 py-4 outline-none focus:border-ink"
                value={giftMessage}
                onChange={(event) => updateGiftMessage(event.target.value)}
                placeholder="Write a message for the gift card"
              />
            </div>
          ) : null}
        </form>
      </div>
      <aside className="h-fit border border-ink/12 bg-porcelain p-6">
        <div className="flex items-center gap-3">
          <Banknote size={20} />
          <h2 className="font-serif text-3xl">Cash on Delivery</h2>
        </div>
        <p className="mt-4 text-sm leading-6 text-ink/65">Payment upon delivery.</p>
        <div className="mt-7 grid gap-3">
          <label className="text-xs uppercase tracking-[0.2em]">Discount code</label>
          <div className="flex gap-2">
            <input
              className="min-w-0 flex-1 border border-ink/15 bg-paper px-4 py-3 uppercase outline-none focus:border-ink"
              value={discountInput}
              onChange={(event) => setDiscountInput(event.target.value)}
              placeholder="HVUGH"
            />
            <div className="grid size-12 shrink-0 place-items-center border border-ink/15 bg-paper">
              <BadgePercent size={17} />
            </div>
          </div>
          {discountResult.message ? (
            <p className={`text-sm ${discountResult.amount > 0 ? "text-ink/65" : "text-rosewood"}`}>{discountResult.message}</p>
          ) : null}
        </div>
        <div className="mt-7 grid gap-4 text-sm">
          <div className="flex justify-between"><span>Product total</span><strong>{formatOmr(productTotal)}</strong></div>
          <div className="flex justify-between"><span>Gift fee</span><strong>{formatOmr(giftFee)}</strong></div>
          <div className="flex justify-between"><span>Delivery fee</span><strong>{formatOmr(deliveryFee)}</strong></div>
          <div className="flex justify-between"><span>Discount</span><strong>-{formatOmr(discountResult.amount)}</strong></div>
          <div className="mt-2 flex justify-between border-t border-ink/12 pt-5 text-lg"><span>Final total</span><strong>{formatOmr(finalTotal)}</strong></div>
        </div>
        {deliveryError ? <p className="mt-6 border border-rosewood/25 bg-rosewood/5 px-4 py-3 text-sm text-rosewood">{deliveryError}</p> : null}
        {orderError ? <p className="mt-6 border border-rosewood/25 bg-rosewood/5 px-4 py-3 text-sm text-rosewood">{orderError}</p> : null}
        <button type="button" onClick={submitPayment} className="mt-8 flex w-full items-center justify-center gap-2 bg-ink px-6 py-4 text-xs uppercase tracking-[0.22em] text-paper">
          <MapPin size={16} />
          Place order
        </button>
      </aside>
    </section>
  );
}
