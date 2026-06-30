"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocaleTheme } from "@/components/LocaleThemeProvider";
import { company } from "@/lib/copy";

export default function SiteFooter() {
  const { text } = useLocaleTheme();
  const footer = text.footer;
  const year = new Date().getFullYear();

  const quickLinks = [
    { href: "/", label: text.nav.home },
    { href: "/about", label: text.nav.about },
    { href: "/products", label: text.nav.products },
    { href: "/quote", label: text.nav.quote },
    { href: "/contact", label: text.nav.contact },
  ];

  return (
    <footer className="brand-footer relative isolate overflow-hidden text-white/82">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(214,173,70,0.55)] to-transparent" aria-hidden="true" />
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-10 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr] lg:gap-16">
          <div className="space-y-5">
            <Link href="/" className="inline-flex items-center gap-4 text-white">
              <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-[rgba(214,173,70,0.55)] bg-[#0f0d0c] shadow-[0_0_0_4px_rgba(214,173,70,0.08)]">
                <Image
                  src="/burgundy-logo.png"
                  alt="Burgundy Foods"
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </span>
              <span className="leading-tight">
                <span className="block text-lg font-semibold tracking-wide">{company.brandName}</span>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
                  {footer.activity}
                </span>
              </span>
            </Link>
            <p className="max-w-md text-sm leading-7 text-white/68">{footer.description}</p>
          </div>

          <nav aria-label="Footer" className="space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
              {footer.quickLinksHeading}
            </p>
            <ul className="space-y-3 text-sm">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-block text-white/82 transition hover:text-[var(--accent)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
              {footer.contactHeading}
            </p>
            <div className="space-y-4 text-sm leading-7">
              <div>
                <p className="text-white/55">{footer.addressLabel}</p>
                <p className="text-white/90">{footer.city}</p>
              </div>
              <div>
                <p className="text-white/55">{footer.emailLabel}</p>
                <a
                  dir="ltr"
                  href={`mailto:${company.email}`}
                  className="text-white/90 transition hover:text-[var(--accent)]"
                >
                  {company.email}
                </a>
              </div>
              <div>
                <p className="text-white/55">{footer.websiteLabel}</p>
                <a
                  dir="ltr"
                  href={`https://${company.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/90 transition hover:text-[var(--accent)]"
                >
                  {company.website}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/8">
        <div className="mx-auto flex max-w-7xl flex-col-reverse gap-2 px-6 py-5 text-[11px] text-white/45 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <p>© {year} {footer.legalName}. {footer.rights}</p>
          <p dir="ltr" className="tracking-wider">
            <span className="text-white/40">{footer.nationalNumberLabel}:</span>{" "}
            <span className="text-white/65">{company.nationalNumber}</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
