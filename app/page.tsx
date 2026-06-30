"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Boxes,
  ClipboardCheck,
  ClipboardList,
  PackageSearch,
  ShieldCheck,
  Truck,
  Users,
  Wheat,
} from "lucide-react";
import TopNav from "@/components/TopNav";
import FeaturedCollections from "@/components/FeaturedCollections";
import SiteFooter from "@/components/SiteFooter";
import { useLocaleTheme } from "@/components/LocaleThemeProvider";

const HERO_IMAGE = "/burgundy-hero-pasta-dishes.png";
const HERO_ALT = "Burgundy Foods premium pasta dishes";

export default function Home() {
  const { text, isArabic } = useLocaleTheme();
  const home = text.home;
  const ArrowIcon = isArabic ? ArrowLeft : ArrowRight;
  const badgeIcons = [Wheat, Award, ShieldCheck];
  const highlightIcons = [PackageSearch, Wheat, Truck];
  const orderIcons = [PackageSearch, Boxes, Users, ClipboardCheck];
  const areaIcons = [PackageSearch, Users, ClipboardList, Boxes];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav />
      <main>
        <section className="brand-shell relative isolate overflow-hidden border-b border-black/30">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(214,173,70,0.7)] to-transparent" />
          <div className="mx-auto grid min-h-[72svh] max-w-7xl gap-10 px-6 py-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:px-10 lg:py-16">
            <div className={`max-w-3xl ${isArabic ? "text-right" : "text-left"}`}>
              <p className="brand-kicker">{home.kicker}</p>
              <h1 className="mt-5 text-5xl font-semibold leading-tight text-white sm:text-7xl">{home.title}</h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/82">{home.lead}</p>

              <div className="mt-7 flex flex-wrap gap-3">
                {home.badges.map((badge, index) => {
                  const Icon = badgeIcons[index] ?? Award;
                  return (
                    <span key={badge} className="product-badge inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold">
                      <Icon className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
                      {badge}
                    </span>
                  );
                })}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/quote" className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow)] transition hover:bg-primary-dark">
                  <ClipboardList className="h-4 w-4" aria-hidden="true" />
                  {home.primary}
                </Link>
                <Link href="/products" className="inline-flex items-center justify-center gap-2 rounded-full border border-[rgba(214,173,70,0.7)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                  <PackageSearch className="h-4 w-4" aria-hidden="true" />
                  {home.secondary}
                  <ArrowIcon className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>

            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-[rgba(214,173,70,0.45)] shadow-[var(--shadow)] sm:aspect-[16/10] lg:aspect-[5/6]">
              <Image
                src={HERO_IMAGE}
                alt={HERO_ALT}
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover object-center"
              />
            </div>
          </div>
        </section>

        <FeaturedCollections />

        <section className="app-band">
          <div className="mx-auto grid max-w-7xl gap-4 px-6 py-8 lg:grid-cols-3 lg:px-10">
            {home.highlights.map(([label, value], index) => {
              const Icon = highlightIcons[index] ?? ClipboardCheck;
              return (
                <article key={label} className="data-card p-6">
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <p className="text-sm font-semibold text-primary">{label}</p>
                  <p className="mt-3 text-lg font-semibold leading-7 text-foreground">{value}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
          <div className="gold-panel space-y-4 p-7">
            <p className="brand-kicker">{home.orderKicker}</p>
            <h2 className="text-3xl font-semibold text-foreground">{home.orderTitle}</h2>
            <p className="text-lg leading-8 text-muted">{home.orderLead}</p>
            <Link href="/products" className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark">
              <PackageSearch className="h-4 w-4" aria-hidden="true" />
              {home.secondary}
              <ArrowIcon className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {home.orderSteps.map((step, index) => {
              const Icon = orderIcons[index] ?? ClipboardCheck;
              return (
                <div key={step} className="data-card p-5">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-primary">{String(index + 1).padStart(2, "0")}</p>
                    <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                  <p className="mt-2 text-xl font-semibold text-foreground">{step}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="app-band">
          <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[1fr_1.15fr] lg:px-10">
            <div className="space-y-4">
              <p className="brand-kicker">{home.platformKicker}</p>
              <h2 className="text-3xl font-semibold text-foreground">{home.platformTitle}</h2>
              <p className="text-lg leading-8 text-muted">{home.platformLead}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {home.areas.map((area, index) => {
                const Icon = areaIcons[index] ?? ClipboardCheck;
                return (
                  <div key={area} className="data-card p-5">
                    <Icon className="mb-4 h-5 w-5 text-primary" aria-hidden="true" />
                    <p className="text-sm text-muted">{home.adminLabel}</p>
                    <p className="mt-2 text-xl font-semibold text-foreground">{area}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
