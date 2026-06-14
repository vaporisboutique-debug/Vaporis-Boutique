import { AdminLoginForm } from "@/components/AdminLoginForm";

export default function AdminLoginPage() {
  return (
    <section className="container-pad mx-auto grid max-w-6xl gap-10 py-14 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="photo-grain min-h-[560px] border border-ink/10 bg-[linear-gradient(145deg,#ffffff,#faf9f6_52%,#d9cfbc)]" />
      <div className="flex flex-col justify-center">
        <p className="text-xs uppercase tracking-[0.28em] text-brass">Supabase admin access</p>
        <h1 className="mt-4 font-serif text-6xl">Admin Login</h1>
        <p className="mt-5 text-sm leading-7 text-ink/62">This route is separate from the public customer website.</p>
        <AdminLoginForm />
      </div>
    </section>
  );
}
