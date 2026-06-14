export function PolicyPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="container-pad mx-auto max-w-4xl py-16">
      <p className="text-xs uppercase tracking-[0.28em] text-rosewood">Vaporis Boutique</p>
      <h1 className="mt-4 font-serif text-5xl">{title}</h1>
      <div className="mt-10 space-y-7 text-base leading-8 text-ink/72">{children}</div>
    </section>
  );
}
