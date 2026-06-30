"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import {
  Home,
  Info,
  LayoutDashboard,
  Languages,
  LogIn,
  LogOut,
  Mail,
  Moon,
  PackageSearch,
  Sun,
  ClipboardList,
} from "lucide-react";
import { useLocaleTheme } from "@/components/LocaleThemeProvider";

type NavSession = {
  user?: {
    email?: string | null;
    name?: string | null;
  };
} | null;

export default function TopNav() {
  const [session, setSession] = useState<NavSession>(null);
  const { text, theme, toggleLocale, toggleTheme } = useLocaleTheme();
  const pathname = usePathname();
  const nav = text.nav;
  const navLinks = [
    { href: "/", label: nav.home, Icon: Home },
    { href: "/about", label: nav.about, Icon: Info },
    { href: "/products", label: nav.products, Icon: PackageSearch },
    { href: "/quote", label: nav.quote, Icon: ClipboardList },
    { href: "/contact", label: nav.contact, Icon: Mail },
  ];

  useEffect(() => {
    let isMounted = true;

    fetch("/api/auth/session", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: NavSession) => {
        if (isMounted && data?.user) {
          setSession(data);
        }
      })
      .catch(() => {
        if (isMounted) {
          setSession(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/92 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-10">
        <Link href="/" className="inline-flex w-fit items-center gap-3 text-foreground sm:gap-4">
          <span className="brand-logo-disc relative h-11 w-11 shrink-0 overflow-hidden rounded-full sm:h-12 sm:w-12 lg:h-14 lg:w-14">
            <Image
              src="/burgundy-logo.png"
              alt="Burgundy Foods"
              fill
              priority
              sizes="(min-width: 1024px) 56px, (min-width: 640px) 48px, 44px"
              className="object-cover"
            />
          </span>
          <span className="leading-tight">
            <span className="block whitespace-nowrap text-base font-semibold sm:text-lg">{nav.brand}</span>
            <span className="block whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.18em] text-muted sm:text-xs">{nav.factory}</span>
          </span>
        </Link>
        <nav aria-label="Primary" className="flex max-w-full items-center gap-2 overflow-x-auto pb-1 text-sm font-medium text-muted lg:flex-wrap lg:justify-end lg:overflow-visible lg:pb-0">
          {navLinks.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? "page" : undefined}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 transition hover:bg-primary/10 hover:text-primary ${
                pathname === href ? "bg-primary/10 text-primary" : ""
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </Link>
          ))}
          <button
            type="button"
            onClick={toggleLocale}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-white px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-background"
            aria-label="Switch language"
          >
            <Languages className="h-4 w-4" aria-hidden="true" />
            {nav.language}
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-white px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-background"
            aria-label="Toggle color theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
            {theme === "dark" ? nav.themeLight : nav.themeDark}
          </button>
          {session?.user ? (
            <>
              <Link href="/dashboard" className="inline-flex items-center gap-1.5 rounded-full border border-primary px-4 py-2 text-primary transition hover:bg-primary/10">
                <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                {nav.dashboard}
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 transition hover:bg-background"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                {nav.signOut}
              </button>
            </>
          ) : (
            <Link href="/auth/signin" className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-white transition hover:bg-primary-dark">
              <LogIn className="h-4 w-4" aria-hidden="true" />
              {nav.signIn}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
