import { AccountDetails } from "@/components/AccountDetails";
import { AccountOrders } from "@/components/AccountOrders";

export default function AccountPage() {
  return (
    <section className="container-pad py-14">
      <div className="mb-10 border-b border-ink/12 pb-8">
        <p className="text-xs uppercase tracking-[0.28em] text-brass">Customer account</p>
        <h1 className="mt-4 font-serif text-6xl">Account</h1>
      </div>
      <AccountDetails />
      <div className="mt-14 border-b border-ink/12 pb-5">
        <h2 className="font-serif text-4xl">Orders</h2>
      </div>
      <AccountOrders />
    </section>
  );
}
