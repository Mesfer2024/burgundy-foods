"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Boxes, ClipboardCheck, ClipboardList, Truck } from "lucide-react";
import { useLocaleTheme } from "@/components/LocaleThemeProvider";
import { useCinemaReveal } from "@/components/useCinemaReveal";

export default function CinemaWholesale() {
  const { isArabic } = useLocaleTheme();
  const ArrowIcon = isArabic ? ArrowLeft : ArrowRight;
  const ref = useCinemaReveal<HTMLElement>();

  const kicker = isArabic ? "الجملة والتوزيع" : "Wholesale & distribution";
  const title = isArabic
    ? "حلول توريد لقطاع التجزئة والجملة في المملكة"
    : "Supply solutions for the Saudi retail and wholesale market";
  const lead = isArabic
    ? "من الرياض إلى السوق السعودي بأكمله — نخدم الموزعين والسوبرماركت ومنشآت الضيافة بكميات تجارية وشروط واضحة."
    : "From Riyadh to the entire Saudi market — we supply distributors, supermarkets, and food service businesses with trade quantities under clear commercial terms.";
  const cta = isArabic ? "اطلب عرض سعر" : "Request a Quote";

  const pillars: { Icon: typeof Truck; ar: string; en: string }[] = [
    { Icon: Truck,          ar: "موزعون ومستوردون",      en: "Distributors & importers" },
    { Icon: Boxes,          ar: "سوبرماركت وبقالات",     en: "Supermarkets & groceries" },
    { Icon: ClipboardCheck, ar: "مطاعم وفنادق",          en: "Restaurants & hotels" },
  ];

  return (
    <section ref={ref} className="cinema-stage relative isolate border-t border-white/10">
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:py-28">
        <div className={`space-y-6 ${isArabic ? "text-right" : "text-left"}`}>
          <p className="brand-kicker cinema-reveal">{kicker}</p>
          <h2 className="cinema-reveal text-3xl font-semibold leading-tight text-white sm:text-5xl" style={{ transitionDelay: "120ms" }}>
            {title}
          </h2>
          <p className="cinema-reveal max-w-xl text-lg leading-8 text-white/72" style={{ transitionDelay: "260ms" }}>
            {lead}
          </p>

          <ul className="cinema-reveal grid gap-3 pt-2" style={{ transitionDelay: "400ms" }}>
            {pillars.map(({ Icon, ar, en }) => (
              <li
                key={en}
                className="inline-flex items-center gap-3 rounded-full border border-white/12 bg-white/3 px-4 py-2 text-sm font-medium text-white/85"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[rgba(214,173,70,0.5)] text-[var(--accent)]">
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                {isArabic ? ar : en}
              </li>
            ))}
          </ul>

          <div className="cinema-reveal pt-2" style={{ transitionDelay: "560ms" }}>
            <Link
              href="/quote"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-white shadow-[var(--shadow)] transition hover:bg-primary-dark"
            >
              <ClipboardList className="h-4 w-4" aria-hidden="true" />
              {cta}
              <ArrowIcon className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="cinema-reveal cinema-frame relative aspect-[4/3] w-full sm:aspect-[16/10] lg:aspect-[4/5]" style={{ transitionDelay: "200ms" }}>
          <div className="cinema-img">
            <Image
              src="/burgundy-pasta-collection-brochure.png"
              alt={isArabic ? "تشكيلة Burgundy Foods الكاملة" : "Burgundy Foods full pasta collection"}
              fill
              loading="lazy"
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-contain object-center"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
