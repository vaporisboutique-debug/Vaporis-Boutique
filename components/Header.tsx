import Link from "next/link";
import { LockKeyhole, UserRound } from "lucide-react";
import { CartHeaderLink } from "./CartHeaderLink";
import { HeaderSearch } from "./HeaderSearch";
import { Logo } from "./Logo";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/account", label: "Account" }
];

export function Header() {
  return (
    <header className="bg-paper">
      <div className="container-pad flex justify-center py-4 sm:py-5">
        <Logo />
      </div>
      <nav className="editorial-rule container-pad flex min-h-14 flex-col gap-3 py-3 text-[0.72rem] uppercase tracking-[0.22em] text-ink lg:flex-row lg:items-center lg:justify-between">
        <div className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-rosewood">
              {item.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-5 md:hidden">
          <Link href="/products">Shop</Link>
          <Link href="/account">Account</Link>
        </div>
        <HeaderSearch />
        <div className="flex items-center gap-3">
          <Link href="/login" className="grid size-9 place-items-center rounded-full border border-ink/15 transition hover:border-rosewood" aria-label="Login">
            <LockKeyhole size={17} strokeWidth={1.6} />
          </Link>
          <Link href="/account" className="grid size-9 place-items-center rounded-full border border-ink/15 transition hover:border-rosewood" aria-label="Account">
            <UserRound size={17} strokeWidth={1.6} />
          </Link>
          <CartHeaderLink />
        </div>
      </nav>
    </header>
  );
}
