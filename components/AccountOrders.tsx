"use client";

import { formatOmr } from "@/lib/data";
import { cancelOwnPendingOrder } from "@/lib/supabaseCatalog";
import { notifyOrdersChanged, useStoredOrders } from "@/lib/useStoredOrders";

const orderSteps = ["pending", "preparing", "shipped", "delivered"];

export function AccountOrders() {
  const customerOrders = useStoredOrders();

  async function cancelOrder(orderId: string) {
    await cancelOwnPendingOrder(orderId);
    notifyOrdersChanged();
  }

  if (customerOrders.length === 0) {
    return (
      <div className="border border-ink/10 bg-porcelain px-6 py-14 text-center">
        <h2 className="font-serif text-3xl">No orders yet</h2>
        <p className="mt-3 text-sm text-ink/62">Your order history will appear here after checkout.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {customerOrders.map((order) => (
        <article key={order.id} className="grid gap-5 border border-ink/12 bg-paper p-5">
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-center">
            <strong>{order.id}</strong>
            <span className="text-sm text-ink/70">{order.date}</span>
            <span className="text-sm capitalize text-ink/70">{order.status}</span>
            <span className="text-sm font-medium">{formatOmr(order.total)}</span>
          </div>
          {order.products && order.products.length > 0 ? (
            <div className="grid gap-2 text-sm text-ink/70">
              {order.products.map((product) => (
                <div key={`${order.id}-${product.name}`} className="flex justify-between border-t border-ink/8 pt-2">
                  <span>{product.name}</span>
                  <span>Qty {product.quantity}</span>
                </div>
              ))}
            </div>
          ) : null}
          <div className="grid grid-cols-4 gap-2">
            {orderSteps.map((step) => {
              const active = orderSteps.indexOf(order.status) >= orderSteps.indexOf(step);
              return (
                <div key={step} className="min-w-0">
                  <div className={`h-1 ${active ? "bg-ink" : "bg-ink/12"}`} />
                  <p className="mt-2 truncate text-[0.65rem] uppercase tracking-[0.12em] text-ink/52">{step}</p>
                </div>
              );
            })}
          </div>
          <button type="button" onClick={() => cancelOrder(order.id)} disabled={order.status !== "pending"} className="w-fit border border-ink px-4 py-3 text-xs uppercase tracking-[0.18em] disabled:cursor-not-allowed disabled:border-ink/15 disabled:text-ink/35">
            Cancel
          </button>
        </article>
      ))}
    </div>
  );
}
