"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, ClipboardList, PackageSearch } from "lucide-react";
import { useLocaleTheme } from "@/components/LocaleThemeProvider";
import { useCinemaReveal } from "@/components/useCinemaReveal";

export default function CinemaCta() {
  const { isArabic } = useLocaleTheme();
  const ArrowIcon = isArabic ? ArrowLeft : ArrowRight;
  const ref = useCinemaReveal<HTMLElement>();

  const kicker = isArabic ? "ابدأ التوريد" : "Start sourcing";
  const title = isArabic
    ? "جاهزون لخدمة طلبات شركتك."
    : "Ready to fulfill your company's orders.";
  const lead = isArabic
    ? "اطلب عرض سعر بكميات الجملة، وسيتواصل معك فريق المبيعات لمراجعة المنتجات والأسعار والتوفر."
    : "Request a wholesale quote and our sales team will follow up with product availability and pricing.";

  const primary = isArabic ? "اطلب عرض سعر" : "Request a Quote";
  const secondary = isArabic ? "تصفح المنتجات" : "Browse Products";

  return (
    <section ref={ref} className="cinema-band relative overflow-hidden">
      <div className="relative mx-auto max-w-5xl px-6 py-24 text-center lg:py-32">
        <p className="brand-kicker cinema-reveal">{kicker}</p>
        <h2 className="cinema-reveal mx-auto mt-5 max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-6xl" style={{ transitionDelay: "120ms" }}>
          {title}
        </h2>
        <p className="cinema-reveal mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/72" style={{ transitionDelay: "260ms" }}>
          {lead}
        </p>

        <div className="cinema-reveal mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row" style={{ transitionDelay: "420ms" }}>
          <Link
            href="/quote"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-sm font-semibold text-white shadow-[var(--shadow)] transition hover:bg-primary-dark"
          >
            <ClipboardList className="h-4 w-4" aria-hidden="true" />
            {primary}
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[rgba(214,173,70,0.6)] px-8 py-4 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <PackageSearch className="h-4 w-4" aria-hidden="true" />
            {secondary}
            <ArrowIcon className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
