export const productShowcase = {
  vermicelliSpiralFusilli: "/burgundy-product-vermicelli-spiral-fusilli.png",
  spaghettiFettucciniTagliatelli: "/burgundy-product-spaghetti-fettuccini-tagliatelli.png",
  elbowRigatoni: "/burgundy-product-elbow-rigatoni.png",
  penneElbowNo24: "/burgundy-product-penne-elbow-no24.png",
  wholeWheatPenneFusilli: "/burgundy-product-whole-wheat-penne-fusilli.png",
  collectionBrochure: "/burgundy-pasta-collection-brochure.png",
} as const;

export type ProductGroupKey = "short" | "classic" | "long" | "wholeWheat" | "other";

export const productGroupImage: Record<ProductGroupKey, string> = {
  short: productShowcase.elbowRigatoni,
  classic: productShowcase.vermicelliSpiralFusilli,
  long: productShowcase.spaghettiFettucciniTagliatelli,
  wholeWheat: productShowcase.wholeWheatPenneFusilli,
  other: productShowcase.collectionBrochure,
};

export const productGroupLabel: Record<ProductGroupKey, { ar: string; en: string }> = {
  short: { ar: "تشكيلة المكرونة القصيرة", en: "Short Pasta Collection" },
  classic: { ar: "التشكيلة الكلاسيكية", en: "Classic Pasta Collection" },
  long: { ar: "تشكيلة المكرونة الطويلة", en: "Long Pasta Collection" },
  wholeWheat: { ar: "تشكيلة الحبة الكاملة", en: "Whole Wheat Collection" },
  other: { ar: "منتجات أخرى", en: "Other Products" },
};

export const productGroupOrder: ProductGroupKey[] = ["short", "classic", "long", "wholeWheat", "other"];

const WHOLE_WHEAT_HINTS = ["whole wheat", "wholewheat", "whole-wheat", "الحبة الكاملة", "قمح كامل", "حبة كاملة"];
const LONG_TYPES = new Set([
  "spaghetti", "spaghetti no. 1", "spaghetti no. 5", "spaghetti no.1", "spaghetti no.5",
  "fettuccini", "fettuccine", "tagliatelli", "tagliatelle", "linguine",
  "سباغيتي", "سباجيتي", "فيتوتشيني", "تالياتيلي", "تاليا تيلي", "لينجويني",
]);
const CLASSIC_TYPES = new Set([
  "vermicelli", "spiral", "spirals", "fusilli", "rotini",
  "شعيرية", "سبايرل", "لولبي", "فوسيلي", "روتيني",
]);
const SHORT_TYPES = new Set([
  "penne", "elbow", "elbows", "elbow no. 24", "elbow no.24", "macaroni",
  "rigatoni", "rigatoni long", "rigatoni short",
  "بيني", "كوع", "أكواع", "كوع رقم 24", "أكواع رقم 24", "ريغاتوني", "ريغاتوني طويل", "ريغاتوني قصير",
]);

function normalize(input: string | undefined | null) {
  return (input ?? "").trim().toLowerCase();
}

function matchesWholeWheat(type: string, name: string | undefined) {
  const haystack = `${type} ${name ?? ""}`.toLowerCase();
  return WHOLE_WHEAT_HINTS.some((hint) => haystack.includes(hint));
}

export function getProductGroup(type: string | undefined | null, name?: string | undefined | null): ProductGroupKey {
  const value = normalize(type);
  if (!value && !name) return "other";
  if (matchesWholeWheat(value, name ?? undefined)) return "wholeWheat";
  if (LONG_TYPES.has(value)) return "long";
  if (CLASSIC_TYPES.has(value)) return "classic";
  if (SHORT_TYPES.has(value)) return "short";
  return "other";
}

export function getProductShowcase(type: string | undefined | null, name?: string | undefined | null): string {
  return productGroupImage[getProductGroup(type, name)];
}

export function getProductShowcaseAlt(
  type: string | undefined | null,
  productName?: string,
  locale: "ar" | "en" = "en",
): string {
  const group = getProductGroup(type, productName);
  const subject = productName?.trim() || type?.trim() || (locale === "ar" ? "باستا Burgundy Foods" : "Burgundy Foods pasta");
  const label = productGroupLabel[group][locale];
  return locale === "ar" ? `${subject} — ${label} من Burgundy Foods` : `${subject} — Burgundy Foods ${label}`;
}
