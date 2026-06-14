import { ChangePasswordForm } from "@/components/ChangePasswordForm";

export default function ChangePasswordPage() {
  return (
    <section className="container-pad mx-auto max-w-3xl py-14">
      <p className="text-xs uppercase tracking-[0.28em] text-brass">Account</p>
      <h1 className="mt-4 font-serif text-6xl">Change Password</h1>
      <ChangePasswordForm />
    </section>
  );
}
