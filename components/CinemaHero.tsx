"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ClipboardList, PackageSearch } from "lucide-react";
import { useLocaleTheme } from "@/components/LocaleThemeProvider";
import { useCinemaReveal } from "@/components/useCinemaReveal";

const HERO_IMAGE = "/burgundy-hero-pasta-dishes.png";

// Pre-positioned floating gold particles. Inline positions so no JS allocation per frame
// and no hydration mismatch (deterministic positions, no Math.random in render).
const PARTICLES = [
  { left: "8%",  size: 5,  delay: 0,    duration: 18 },
  { left: "18%", size: 3,  delay: 4,    duration: 22 },
  { left: "27%", size: 7,  delay: 2,    duration: 16 },
  { left: "36%", size: 2,  delay: 7,    duration: 20 },
  { left: "44%", size: 4,  delay: 1,    duration: 24 },
  { left: "55%", size: 6,  delay: 5,    duration: 19 },
  { left: "63%", size: 3,  delay: 8,    duration: 23 },
  { left: "72%", size: 5,  delay: 3,    duration: 17 },
  { left: "82%", size: 2,  delay: 6,    duration: 21 },
  { left: "92%", size: 4,  delay: 9,    duration: 25 },
];

export default function CinemaHero() {
  const { text, isArabic } = useLocaleTheme();
  const home = text.home;
  const ArrowIcon = isArabic ? ArrowLeft : ArrowRight;
  const ref = useCinemaReveal<HTMLElement>();

  // Cinematic 3-line headline arrangement (legal name, tagline, narrative)
  const headlineLine1 = isArabic ? "مؤسسة Burgundy Foods" : "Burgundy Foods Establishment";
  const headlineLine2 = isArabic ? "تجارة وتوزيع المنتجات الغذائية" : "Food Trading & Distribution";
  const lead = isArabic
    ? "منتجات مكرونة عالية الجودة لقطاع الجملة والتجزئة وخدمات الأغذية"
    : "Premium pasta products for wholesale, retail, and food service";
  const scrollHint = isArabic ? "تابع التمرير لاستكشاف التشكيلات" : "Scroll to explore our collections";

  return (
    <section ref={ref} className="cinema-stage relative isolate min-h-[88svh] overflow-hidden border-b border-black/40">
      {/* Gold hairline at the very top */}
      <div className="absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-[rgba(214,173,70,0.7)] to-transparent" aria-hidden="true" />

      {/* Floating gold particles */}
      <div className="cinema-particles" aria-hidden="true">
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            style={{
              left: p.left,
              bottom: "-20px",
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto grid min-h-[88svh] max-w-7xl items-center gap-10 px-6 py-16 lg:grid-cols-[0.95fr_1.05fr] lg:px-10 lg:py-24">
        <div className={`max-w-3xl ${isArabic ? "text-right" : "text-left"}`}>
          <p className="brand-kicker cinema-reveal" style={{ transitionDelay: "0ms" }}>
            {home.kicker}
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight text-white sm:text-6xl lg:text-7xl">
            <span className="cinema-reveal block" style={{ transitionDelay: "120ms" }}>
              {headlineLine1}
            </span>
            <span
              className="cinema-reveal mt-2 block text-[var(--accent)]"
              style={{ transitionDelay: "260ms" }}
            >
              {headlineLine2}
            </span>
          </h1>
          <p className="cinema-reveal mt-6 max-w-2xl text-lg leading-8 text-white/82" style={{ transitionDelay: "420ms" }}>
            {lead}
          </p>

          <div className="cinema-reveal mt-9 flex flex-col gap-3 sm:flex-row" style={{ transitionDelay: "580ms" }}>
            <Link
              href="/quote"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-white shadow-[var(--shadow)] transition hover:bg-primary-dark"
            >
              <ClipboardList className="h-4 w-4" aria-hidden="true" />
              {home.primary}
            </Link>
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[rgba(214,173,70,0.7)] px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <PackageSearch className="h-4 w-4" aria-hidden="true" />
              {home.secondary}
              <ArrowIcon className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div
          className="cinema-reveal cinema-frame relative aspect-[4/5] w-full sm:aspect-[16/10] lg:aspect-[5/6]"
          style={{ transitionDelay: "320ms" }}
        >
          <div className="cinema-img">
            <Image
              src={HERO_IMAGE}
              alt="Burgundy Foods premium pasta dishes"
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover object-center"
            />
          </div>
        </div>
      </div>

      <div className="cinema-reveal pointer-events-none absolute inset-x-0 bottom-6 z-10 flex flex-col items-center gap-2 text-xs text-white/55" style={{ transitionDelay: "740ms" }}>
        <span>{scrollHint}</span>
        <span className="cinema-scroll-dot" aria-hidden="true" />
      </div>
    </section>
  );
}
