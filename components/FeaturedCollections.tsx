"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, PackageSearch } from "lucide-react";
import { useLocaleTheme } from "@/components/LocaleThemeProvider";
import {
  productGroupImage,
  productGroupLabel,
  productGroupOrder,
} from "@/lib/productImages";

export default function FeaturedCollections() {
  const { isArabic } = useLocaleTheme();
  const ArrowIcon = isArabic ? ArrowLeft : ArrowRight;

  const kicker = isArabic ? "تشكيلاتنا" : "Our collections";
  const title = isArabic
    ? "تشكيلات Burgundy Foods من الباستا"
    : "Burgundy Foods pasta collections";
  const lead = isArabic
    ? "أربع تشكيلات منتقاة بعناية لخدمة قطاع التجزئة والجملة وقطاع الأغذية في المملكة."
    : "Four curated collections crafted for retail, wholesale, and food service distribution across Saudi Arabia.";
  const cta = isArabic ? "تصفح المنتجات" : "Browse products";
  const groupCta = isArabic ? "اطلع على المنتجات" : "See products";

  const groups = productGroupOrder.filter((key) => key !== "other");

  return (
    <section className="app-band">
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="brand-kicker">{kicker}</p>
            <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">{title}</h2>
            <p className="text-lg leading-8 text-muted">{lead}</p>
          </div>
          <Link
            href="/products"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-primary px-5 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10"
          >
            <PackageSearch className="h-4 w-4" aria-hidden="true" />
            {cta}
            <ArrowIcon className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {groups.map((groupKey) => {
            const labelAr = productGroupLabel[groupKey].ar;
            const labelEn = productGroupLabel[groupKey].en;
            const labelText = isArabic ? labelAr : labelEn;
            const altText = isArabic
              ? `${labelAr} من Burgundy Foods`
              : `Burgundy Foods ${labelEn}`;

            return (
              <Link
                key={groupKey}
                href="/products"
                aria-label={`${labelText} — ${groupCta}`}
                className="group data-card overflow-hidden transition hover:-translate-y-1 hover:shadow-[var(--shadow)]"
              >
                <div className="relative aspect-square w-full bg-background">
                  <Image
                    src={productGroupImage[groupKey]}
                    alt={altText}
                    fill
                    sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 100vw"
                    className="object-contain object-center p-3"
                  />
                </div>
                <div className="space-y-2 p-5">
                  <p className="brand-kicker">{labelEn}</p>
                  <p className="text-lg font-semibold text-foreground">{labelText}</p>
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                    {groupCta}
                    <ArrowIcon className="h-4 w-4" aria-hidden="true" />
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
