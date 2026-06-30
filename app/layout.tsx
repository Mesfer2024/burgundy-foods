import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const cairo = Cairo({
  variable: "--font-primary",
  subsets: ["arabic", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.burgundy-foods.com"),
  title: {
    default: "Burgundy Foods | Food Trading & Distribution",
    template: "%s | Burgundy Foods",
  },
  description:
    "مؤسسة برغندي للأغذية: شركة سعودية لتجارة وتوزيع المواد الغذائية من الرياض، توفر منتجات غذائية فاخرة لقطاع الجملة والتجزئة.",
  openGraph: {
    title: "Burgundy Foods | Food Trading & Distribution",
    description:
      "Burgundy Foods Establishment — Saudi food trading and distribution from Riyadh.",
    url: "https://www.burgundy-foods.com",
    siteName: "Burgundy Foods",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" data-scroll-behavior="smooth" className={`${cairo.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
