import { PolicyPage } from "@/components/PolicyPage";

export default function PrivacyPage() {
  return (
    <PolicyPage title="Privacy Policy">
      <p>Vaporis Boutique collects account, delivery, and order information needed to process purchases and customer support requests.</p>
      <p>Payment is currently collected upon delivery. Vaporis Boutique does not store card numbers on the website.</p>
      <p>When Supabase is connected, user data should be protected with row-level security and limited admin access.</p>
    </PolicyPage>
  );
}
