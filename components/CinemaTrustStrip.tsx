"use client";

import { Building2, PackageCheck, ShieldCheck, Truck } from "lucide-react";
import { useLocaleTheme } from "@/components/LocaleThemeProvider";
import { useCinemaReveal } from "@/components/useCinemaReveal";

export default function CinemaTrustStrip() {
  const { isArabic } = useLocaleTheme();
  const ref = useCinemaReveal<HTMLElement>();

  const pillars: { Icon: typeof Building2; ar: string; en: string }[] = [
    { Icon: Building2,    ar: "مقرنا الرياض",              en: "Based in Riyadh" },
    { Icon: Truck,        ar: "توريد للجملة والتجزئة",     en: "Wholesale & retail supply" },
    { Icon: ShieldCheck,  ar: "منتجات غذائية عالية الجودة", en: "Premium food products" },
    { Icon: PackageCheck, ar: "جاهزون لطلبات الشركات",     en: "Ready for B2B orders" },
  ];

  return (
    <section
      ref={ref}
      aria-label={isArabic ? "ثقة العملاء" : "Trust pillars"}
      className="border-y border-white/8 bg-[#0a0708]"
    >
      <div className="mx-auto grid max-w-7xl gap-px bg-white/8 px-0 sm:grid-cols-2 lg:grid-cols-4">
        {pillars.map(({ Icon, ar, en }, i) => (
          <div
            key={en}
            className="cinema-reveal flex items-center gap-4 bg-[#0a0708] px-6 py-6"
            style={{ transitionDelay: `${i * 90}ms` }}
          >
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[rgba(214,173,70,0.45)] bg-[#0f0d0c] text-[var(--accent)]">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold text-white/85">{isArabic ? ar : en}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
