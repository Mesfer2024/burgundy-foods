"use client";

import Image from "next/image";
import { Mail, MapPin, MessageSquareText, Phone } from "lucide-react";
import ContactForm from "@/components/ContactForm";
import { useLocaleTheme } from "@/components/LocaleThemeProvider";
import { company } from "@/lib/copy";

type ContactSettings = {
  phone?: string | null;
  email?: string | null;
  address?: string | null;
};

export default function ContactPageContent({ settings }: { settings: ContactSettings | null }) {
  const { text, isArabic } = useLocaleTheme();
  const contact = text.contact;
  const fallbackAddress = isArabic ? company.cityAr : company.cityEn;

  return (
    <section className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-6">
        <div className="data-card p-8">
          <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.25em] text-primary">
            <MessageSquareText className="h-4 w-4" aria-hidden="true" />
            {contact.kicker}
          </p>
          <h1 className="mt-4 text-3xl font-semibold leading-tight text-foreground sm:text-4xl">{contact.title}</h1>
          <p className="mt-4 text-lg leading-8 text-muted">{contact.lead}</p>
          <div className="mt-8 space-y-4 rounded-lg border border-border bg-background p-5">
            <div>
              <p className="inline-flex items-center gap-2 text-sm text-muted">
                <Phone className="h-4 w-4 text-primary" aria-hidden="true" />
                {contact.whatsapp}
              </p>
              <p dir="ltr" className="text-base font-semibold text-foreground">{settings?.phone || "+966 53 301 2014"}</p>
              <p className="mt-1 text-xs text-muted">{isArabic ? "للاستفسارات التجارية وطلبات التوريد." : "For business inquiries and supply requests."}</p>
            </div>
            <div>
              <p className="inline-flex items-center gap-2 text-sm text-muted">
                <Mail className="h-4 w-4 text-primary" aria-hidden="true" />
                {contact.email}
              </p>
              <p dir="ltr" className="text-base font-semibold text-foreground">{settings?.email || company.email}</p>
            </div>
            <div>
              <p className="inline-flex items-center gap-2 text-sm text-muted">
                <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
                {contact.address}
              </p>
              <p className="text-base font-semibold text-foreground">{settings?.address || fallbackAddress}</p>
            </div>
          </div>
        </div>
        <div className="data-card p-5 text-sm text-muted">
          <p className="font-semibold text-foreground">{company.legalNameEn}</p>
          <p className="mt-1">{isArabic ? company.activityAr : company.activityEn}</p>
          <p className="mt-1">{isArabic ? company.cityAr : company.cityEn}</p>
          <p dir="ltr" className="mt-3 text-xs">National Number: {company.nationalNumber}</p>
          <p dir="ltr" className="text-xs">{company.website}</p>
        </div>
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-[rgba(214,173,70,0.45)] shadow-[var(--shadow)]">
          <Image
            src="/burgundy-hero-pasta-dishes.png"
            alt="Burgundy Foods premium pasta dishes"
            fill
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="object-cover object-center"
          />
        </div>
      </div>
      <div>
        <ContactForm />
      </div>
    </section>
  );
}
