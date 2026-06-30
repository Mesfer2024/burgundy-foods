"use client";

import Image from "next/image";
import { Building2, CheckCircle2, ClipboardList, PackageCheck } from "lucide-react";
import { useLocaleTheme } from "@/components/LocaleThemeProvider";
import { productShowcase } from "@/lib/productImages";

export default function QuotePageContent() {
  const { text, isArabic } = useLocaleTheme();
  const quote = text.quote;
  const guideIcons = [PackageCheck, ClipboardList, Building2, CheckCircle2];

  return (
    <section className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="data-card p-8">
        <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.25em] text-primary">
          <ClipboardList className="h-4 w-4" aria-hidden="true" />
          {quote.kicker}
        </p>
        <h1 className="mt-4 text-4xl font-semibold text-foreground">{quote.title}</h1>
        <p className="mt-4 text-lg leading-8 text-muted">{quote.lead}</p>
      </div>
      <div className="space-y-6">
        <div className="data-card p-8">
          <div className="space-y-4">
            <p className="font-semibold text-foreground">{quote.serviceTitle}</p>
            <p className="text-sm leading-6 text-muted">{quote.serviceLead}</p>
            <div className="grid gap-3">
              {quote.guide.map((step, index) => {
                const Icon = guideIcons[index] ?? CheckCircle2;
                return (
                  <div key={step} className="rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground">
                    <span className="inline-flex items-center gap-2 font-semibold text-primary">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {index + 1}.
                    </span>{" "}
                    {step}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="data-card overflow-hidden">
          <div className="relative aspect-[4/3] w-full bg-background">
            <Image
              src={productShowcase.collectionBrochure}
              alt={isArabic
                ? "تشكيلة Burgundy Foods الكاملة من الباستا"
                : "Burgundy Foods full pasta collection"}
              fill
              sizes="(min-width: 1024px) 30vw, 100vw"
              className="object-contain object-center p-3"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
