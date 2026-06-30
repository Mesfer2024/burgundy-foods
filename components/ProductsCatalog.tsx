"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Bookmark,
  ClipboardList,
  Heart,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  PackageCheck,
  PackageSearch,
  Scale,
  Send,
  Wheat,
} from "lucide-react";
import { useLocaleTheme } from "@/components/LocaleThemeProvider";
import {
  getProductGroup,
  getProductShowcase,
  getProductShowcaseAlt,
  productGroupImage,
  productGroupLabel,
  productGroupOrder,
  productShowcase,
  type ProductGroupKey,
} from "@/lib/productImages";

type Product = {
  id: string;
  nameAr: string;
  nameEn: string;
  type: string;
  weight: string | null;
  originCountry: string | null;
  imageUrl: string | null;
  isVerified: boolean;
};

function getProductImage(product: Product) {
  if (product.imageUrl?.startsWith("/") && product.imageUrl.includes("burgundy")) {
    return product.imageUrl;
  }

  return getProductShowcase(product.type, product.nameEn || product.nameAr);
}

function groupProducts(products: Product[]): Record<ProductGroupKey, Product[]> {
  const buckets: Record<ProductGroupKey, Product[]> = {
    short: [],
    classic: [],
    long: [],
    wholeWheat: [],
    other: [],
  };
  for (const product of products) {
    const key = getProductGroup(product.type, product.nameEn || product.nameAr);
    buckets[key].push(product);
  }
  return buckets;
}

export default function ProductsCatalog({ products }: { products: Product[] }) {
  const { text, isArabic } = useLocaleTheme();
  const page = text.products;
  const locale: "ar" | "en" = isArabic ? "ar" : "en";
  const grouped = groupProducts(products);
  const visibleGroups = productGroupOrder.filter((key) => grouped[key].length > 0);

  return (
    <section className="space-y-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_0.72fr] lg:items-end">
        <div className="space-y-4">
          <p className="brand-kicker">{page.kicker}</p>
          <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">{page.title}</h1>
          <p className="max-w-2xl text-lg leading-8 text-muted">{page.lead}</p>
        </div>
        <div className="gold-panel p-5">
          <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-foreground">
            <PackageCheck className="h-5 w-5 text-primary" aria-hidden="true" />
            {page.howTitle}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">{page.howLead}</p>
          <Link href="/quote" className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark">
            <ClipboardList className="h-4 w-4" aria-hidden="true" />
            {page.quoteCta}
          </Link>
        </div>
      </div>

      <div className="data-card relative overflow-hidden">
        <div className="relative aspect-[16/9] w-full sm:aspect-[21/9]">
          <Image
            src={productShowcase.collectionBrochure}
            alt={isArabic
              ? "تشكيلة Burgundy Foods الكاملة من الباستا: سباغيتي، فيتوتشيني، بيني، ريغاتوني، كوع، شعيرية، فوسيلي، الحبة الكاملة"
              : "Burgundy Foods full pasta collection: Spaghetti, Fettuccini, Penne, Rigatoni, Elbow, Vermicelli, Fusilli, Whole Wheat"}
            fill
            priority
            sizes="(min-width: 1024px) 80vw, 100vw"
            className="object-contain object-center"
          />
        </div>
      </div>

      {products.length === 0 ? (
        <div className="data-card p-8 text-center text-muted">{page.empty}</div>
      ) : (
        visibleGroups.map((groupKey) => {
          const groupItems = grouped[groupKey];
          const groupLabel = productGroupLabel[groupKey][locale];
          const bannerImage = productGroupImage[groupKey];
          const bannerAlt = isArabic
            ? `${groupLabel} من Burgundy Foods`
            : `Burgundy Foods ${groupLabel}`;

          return (
            <section key={groupKey} aria-labelledby={`group-${groupKey}`} className="space-y-5">
              <div className="data-card overflow-hidden">
                <div className="grid gap-4 md:grid-cols-[1fr_0.85fr] md:items-center">
                  <div className="space-y-2 p-6">
                    <p className="brand-kicker">{productGroupLabel[groupKey].en}</p>
                    <h2 id={`group-${groupKey}`} className="text-2xl font-semibold text-foreground sm:text-3xl">
                      {groupLabel}
                    </h2>
                    <p className="text-sm text-muted">
                      {isArabic
                        ? `${groupItems.length} منتج ضمن هذه التشكيلة`
                        : `${groupItems.length} ${groupItems.length === 1 ? "product" : "products"} in this collection`}
                    </p>
                  </div>
                  <div className="relative aspect-[4/3] w-full md:aspect-[5/3]">
                    <Image
                      src={bannerImage}
                      alt={bannerAlt}
                      fill
                      sizes="(min-width: 1024px) 40vw, 100vw"
                      className="object-contain object-center"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {groupItems.map((product) => {
                  const displayName = isArabic ? product.nameAr : product.nameEn || product.nameAr;
                  const secondaryName = isArabic ? product.nameEn : product.nameAr;
                  const productImage = getProductImage(product);
                  const productAlt = getProductShowcaseAlt(product.type, displayName, locale);

                  return (
                    <article key={product.id} className="data-card insta-product-card transition hover:-translate-y-1 hover:shadow-[var(--shadow)]">
                      <div className="insta-product-top">
                        <span className="social-handle">
                          <span className="social-handle-mark relative">
                            <Image src="/burgundy-logo.png" alt="" fill sizes="26px" className="object-cover" />
                          </span>
                          @burgundyfoods
                        </span>
                        <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
                      </div>

                      <div className="insta-product-media">
                        <Image
                          src={productImage}
                          alt={productAlt}
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="object-contain object-center"
                        />
                        <span className="product-badge absolute left-4 top-4 inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold">
                          <Wheat className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
                          High Protein 15g
                        </span>
                      </div>
                      <div className="space-y-4 p-6">
                        <div className="flex items-center justify-between">
                          <div className="insta-product-actions">
                            <Heart className="h-5 w-5" aria-hidden="true" />
                            <MessageCircle className="h-5 w-5" aria-hidden="true" />
                            <Send className="h-5 w-5" aria-hidden="true" />
                          </div>
                          <Bookmark className="h-5 w-5 text-primary" aria-hidden="true" />
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-xl font-semibold text-foreground">{displayName}</h3>
                            <p className="text-sm text-muted">{secondaryName}</p>
                          </div>
                          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                            {product.type}
                          </span>
                        </div>
                        <div className="grid gap-2 text-sm text-muted">
                          {product.isVerified && product.weight ? (
                            <p className="inline-flex items-center gap-2">
                              <Scale className="h-4 w-4 text-primary" aria-hidden="true" />
                              {page.weight}: {product.weight}
                            </p>
                          ) : null}
                          {product.isVerified && product.originCountry ? (
                            <p className="inline-flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
                              {page.origin}: {product.originCountry}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex flex-col gap-3 border-t border-border pt-4">
                          <Link href={`/quote?product=${product.id}`} className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-primary-dark">
                            <PackageSearch className="h-4 w-4" aria-hidden="true" />
                            {page.order}
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })
      )}
    </section>
  );
}
