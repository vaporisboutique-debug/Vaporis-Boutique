import { ProductCollection } from "@/components/ProductCollection";

export default function ProductsPage() {
  return (
    <section className="container-pad py-14">
      <div className="mb-10 flex flex-col gap-4 border-b border-ink/12 pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-brass">Collection</p>
          <h1 className="mt-4 font-serif text-6xl">Products</h1>
        </div>
      </div>
      <ProductCollection grouped />
    </section>
  );
}
