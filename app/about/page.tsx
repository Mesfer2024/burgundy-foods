"use client";

import Image from "next/image";
import Link from "next/link";
import { ClipboardList, PackageSearch, ReceiptText, ShieldCheck, Truck, Users } from "lucide-react";
import TopNav from "@/components/TopNav";
import SiteFooter from "@/components/SiteFooter";
import { useLocaleTheme } from "@/components/LocaleThemeProvider";

export default function AboutPage() {
  const { text } = useLocaleTheme();
  const about = text.about;
  const cardIcons = [ShieldCheck, Truck, Users, ReceiptText];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav />
      <main className="mx-auto max-w-6xl px-6 py-14 lg:px-10">
        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-5">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary">{about.kicker}</p>
            <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">{about.title}</h1>
            <p className="text-lg leading-8 text-muted">{about.lead}</p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href="/products" className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark">
                <PackageSearch className="h-4 w-4" aria-hidden="true" />
                {text.home.secondary}
              </Link>
              <Link href="/quote" className="inline-flex items-center justify-center gap-2 rounded-full border border-primary px-6 py-3 text-sm font-semibold text-primary transition hover:bg-primary/10">
                <ClipboardList className="h-4 w-4" aria-hidden="true" />
                {text.home.primary}
              </Link>
            </div>
          </div>
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-[rgba(214,173,70,0.45)] shadow-[var(--shadow)] sm:aspect-[16/10] lg:aspect-[5/6]">
            <Image
              src="/burgundy-hero-pasta-dishes.png"
              alt="Burgundy Foods premium pasta dishes"
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover object-center"
            />
            <div className="absolute bottom-4 left-4 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-[var(--primary-dark)] shadow-[var(--shadow-soft)]">
              100% Durum Semolina
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-5 sm:grid-cols-2">
          {about.cards.map(([title, body], index) => {
            const Icon = cardIcons[index] ?? ShieldCheck;
            return (
              <div key={title} className="data-card space-y-3 p-6">
                <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                <h2 className="text-xl font-semibold text-foreground">{title}</h2>
                <p className="text-sm leading-6 text-muted">{body}</p>
              </div>
            );
          })}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
