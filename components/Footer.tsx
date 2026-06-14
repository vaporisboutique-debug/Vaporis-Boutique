"use client";

import Link from "next/link";
import { Facebook, Instagram, Mail, Music2 } from "lucide-react";
import { deliveryNotice, socialAccounts } from "@/lib/data";
import { useSiteSettings } from "@/lib/useSiteSettings";
import { Logo } from "./Logo";

export function Footer() {
  const settings = useSiteSettings();
  const email = settings.email || socialAccounts.email;
  const handle = socialAccounts.handle;

  return (
    <footer className="mt-20 border-t border-ink/10 bg-paper text-ink">
      <div className="container-pad grid gap-10 py-12 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <div className="inline-block bg-paper p-3">
            <Logo compact />
          </div>
          <p className="mt-5 max-w-sm border border-ink/10 bg-porcelain px-4 py-3 text-sm leading-6 text-ink/68">{deliveryNotice}</p>
          {settings.footerText ? <p className="mt-5 max-w-sm text-sm leading-6 text-ink/62">{settings.footerText}</p> : null}
        </div>
        <div className="text-sm">
          <p className="mb-4 font-serif text-2xl">Care</p>
          <div className="grid gap-3 text-ink/68">
            <Link href="/terms">Terms and Conditions</Link>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/cookies">Cookie Policy</Link>
            <a href={`mailto:${email}`}>Contact</a>
          </div>
        </div>
        <div className="text-sm">
          <p className="mb-4 font-serif text-2xl">Social</p>
          <div className="mb-5 flex gap-3">
            <a className="grid size-10 place-items-center rounded-full border border-ink/15" href={settings.instagram || socialAccounts.instagram} aria-label="Instagram"><Instagram size={18} /></a>
            <a className="grid size-10 place-items-center rounded-full border border-ink/15" href={settings.tiktok || socialAccounts.tiktok} aria-label="TikTok"><Music2 size={18} /></a>
            <a className="grid size-10 place-items-center rounded-full border border-ink/15" href={settings.facebook || socialAccounts.facebook} aria-label="Facebook"><Facebook size={18} /></a>
            <a className="grid size-10 place-items-center rounded-full border border-ink/15" href={settings.x || socialAccounts.x} aria-label="X">X</a>
          </div>
          <p className="text-ink/68">@{handle}</p>
          <p className="mt-2 text-ink/68">{email}</p>
        </div>
      </div>
    </footer>
  );
}
