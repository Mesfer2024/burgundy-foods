"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, PackageSearch } from "lucide-react";
import { useLocaleTheme } from "@/components/LocaleThemeProvider";
import { useCinemaReveal } from "@/components/useCinemaReveal";
import {
  productGroupImage,
  productGroupLabel,
  productGroupOrder,
} from "@/lib/productImages";

export default function CinemaCollections() {
  const { isArabic } = useLocaleTheme();
  const ArrowIcon = isArabic ? ArrowLeft : ArrowRight;
  const ref = useCinemaReveal<HTMLElement>();

  const groups = productGroupOrder.filter((key) => key !== "other");

  const kicker = isArabic ? "تشكيلاتنا" : "Our collections";
  const title = isArabic
    ? "تشكيلات Burgundy Foods من الباستا"
    : "Burgundy Foods pasta collections";
  const lead = isArabic
    ? "أربع تشكيلات منتقاة بعناية لقطاع التجزئة والجملة وخدمات الأغذية"
    : "Four curated collections crafted for retail, wholesale, and food service distribution";
  const cta = isArabic ? "تصفح المنتجات" : "Browse products";

  return (
    <section ref={ref} className="cinema-band">
      <div className="relative mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-28">
        <div className="cinema-reveal flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="brand-kicker">{kicker}</p>
            <h2 className="text-3xl font-semibold leading-tight text-white sm:text-5xl">{title}</h2>
            <p className="text-lg leading-8 text-white/72">{lead}</p>
          </div>
          <Link
            href="/products"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-[rgba(214,173,70,0.55)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <PackageSearch className="h-4 w-4" aria-hidden="true" />
            {cta}
            <ArrowIcon className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {groups.map((groupKey, index) => {
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
                aria-label={labelText}
                className="cinema-reveal cinema-tilt group relative overflow-hidden rounded-2xl border border-white/8 bg-[#100a0c]"
                style={{ transitionDelay: `${index * 120}ms` }}
              >
                <div className="relative aspect-square w-full overflow-hidden bg-[#0a0708]">
                  {/* Soft warm glow underlay */}
                  <div
                    className="pointer-events-none absolute inset-0 z-0"
                    style={{
                      background:
                        "radial-gradient(circle at 50% 60%, rgba(214, 173, 70, 0.18), transparent 65%)",
                    }}
                    aria-hidden="true"
                  />
                  <Image
                    src={productGroupImage[groupKey]}
                    alt={altText}
                    fill
                    sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 100vw"
                    className="relative z-10 object-contain object-center p-4 transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  {/* Bottom vignette for type contrast */}
                  <div
                    className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-1/2"
                    style={{
                      background:
                        "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)",
                    }}
                    aria-hidden="true"
                  />
                </div>
                <div className="relative z-20 space-y-1 p-5 text-white">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
                    {labelEn}
                  </p>
                  <p className="text-lg font-semibold">{labelText}</p>
                  <p className="inline-flex items-center gap-2 pt-2 text-sm font-medium text-white/72 transition group-hover:text-[var(--accent)]">
                    {cta}
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
