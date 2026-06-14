"use client";

import Link from "next/link";
import { Eye, EyeOff, Trash2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { deactivateCurrentProfile, fetchCurrentProfile, updateCurrentProfile, uploadStoreImage } from "@/lib/supabaseCatalog";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import { notifyProfilesChanged } from "@/lib/useSupabaseProfiles";
import { SafeImage } from "@/components/SafeImage";

type Account = {
  firstName: string;
  surname: string;
  email: string;
  photoUrl?: string;
};

export function AccountDetails() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [accountMessage, setAccountMessage] = useState("");
  const [account, setAccount] = useState<Account>({ firstName: "", surname: "", email: "" });

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      const profile = await fetchCurrentProfile().catch(() => null);
      if (profile && active) {
        setAccount({
          firstName: profile.firstName,
          surname: profile.surname,
          email: profile.email,
          photoUrl: profile.avatarUrl
        });
      }
    }

    void loadProfile();
    return () => {
      active = false;
    };
  }, []);

  async function saveAccount(nextAccount: Account) {
    setAccount(nextAccount);
    if (isSupabaseConfigured) {
      await updateCurrentProfile({
        firstName: nextAccount.firstName,
        surname: nextAccount.surname,
        email: nextAccount.email,
        avatarUrl: nextAccount.photoUrl
      });
      notifyProfilesChanged();
    }
  }

  async function deactivateAccount() {
    setAccountMessage("");
    try {
      await deactivateCurrentProfile();
      setAccount({ firstName: "", surname: "", email: "" });
      setConfirmDelete(false);
      router.push("/login");
    } catch (error) {
      setAccountMessage(error instanceof Error ? error.message : "Unable to deactivate account.");
    }
  }

  return (
    <section className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr]">
      <div className="border border-ink/10 bg-porcelain p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-brass">Profile</p>
        <h2 className="mt-3 font-serif text-4xl">Account Details</h2>
        <div className="mt-8 flex items-center gap-4">
          <div className="relative grid size-24 place-items-center overflow-hidden rounded-full border border-ink/10 bg-paper">
            {account.photoUrl ? <SafeImage src={account.photoUrl} alt="Profile photo" fill className="object-cover" /> : <Upload size={22} />}
          </div>
          <label className="inline-flex cursor-pointer border border-ink px-4 py-3 text-xs uppercase tracking-[0.18em]">
            Upload photo
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (file) {
                  const { data } = await supabase?.auth.getSession() || { data: { session: null } };
                  const avatarUrl = data.session ? await uploadStoreImage("profile-photos", file, data.session.user.id) : "";
                  await saveAccount({ ...account, photoUrl: avatarUrl || account.photoUrl });
                }
              }}
            />
          </label>
        </div>
      </div>
      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-[0.18em] text-ink/48">First name</span>
            <input className="border border-ink/15 bg-paper px-4 py-4" value={account.firstName} onChange={(event) => saveAccount({ ...account, firstName: event.target.value })} />
          </label>
          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-[0.18em] text-ink/48">Surname</span>
            <input className="border border-ink/15 bg-paper px-4 py-4" value={account.surname} onChange={(event) => saveAccount({ ...account, surname: event.target.value })} />
          </label>
        </div>
        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.18em] text-ink/48">Email</span>
          <input className="border border-ink/15 bg-paper px-4 py-4" value={account.email} onChange={(event) => saveAccount({ ...account, email: event.target.value })} />
        </label>
        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.18em] text-ink/48">Password</span>
          <div className="flex border border-ink/15 bg-paper">
            <input className="min-w-0 flex-1 bg-transparent px-4 py-4 outline-none" type={showPassword ? "text" : "password"} value={showPassword ? "********" : "••••••••"} readOnly />
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="grid w-14 place-items-center border-l border-ink/10" aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/account/change-password" className="border border-ink px-5 py-3 text-xs uppercase tracking-[0.18em]">Change password</Link>
          <button type="button" onClick={() => setConfirmDelete(true)} className="inline-flex items-center gap-2 border border-rosewood px-5 py-3 text-xs uppercase tracking-[0.18em] text-rosewood">
            <Trash2 size={15} />
            Delete account
          </button>
        </div>
        {confirmDelete ? (
          <div className="border border-rosewood/30 bg-rosewood/5 p-5">
            <p className="text-sm text-rosewood">Confirm account deactivation? Full Auth deletion requires a secure server-side admin key, so this safely deactivates your profile and signs you out.</p>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={deactivateAccount}
                className="bg-rosewood px-4 py-3 text-xs uppercase tracking-[0.18em] text-paper"
              >
                Confirm deactivate
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)} className="border border-ink px-4 py-3 text-xs uppercase tracking-[0.18em]">Cancel</button>
            </div>
          </div>
        ) : null}
        {accountMessage ? <p className="border border-rosewood/20 bg-rosewood/5 px-4 py-3 text-sm text-rosewood">{accountMessage}</p> : null}
      </div>
    </section>
  );
}
