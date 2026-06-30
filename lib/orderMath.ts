import prisma from "@/lib/prisma";

export type QuantityType = "unit" | "carton" | "pallet" | "container";

export const QUANTITY_TYPES: QuantityType[] = ["unit", "carton", "pallet", "container"];

export const QUANTITY_TYPE_LABEL: Record<QuantityType, { ar: string; en: string }> = {
  unit: { ar: "وحدة", en: "Unit" },
  carton: { ar: "كرتون", en: "Carton" },
  pallet: { ar: "طبلية", en: "Pallet" },
  container: { ar: "حاوية", en: "Container" },
};

export function normalizeQuantityType(value: unknown): QuantityType {
  if (typeof value === "string" && (QUANTITY_TYPES as string[]).includes(value)) {
    return value as QuantityType;
  }
  return "carton";
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export type LineInput = {
  unitPriceBeforeVat?: number;
  quantity?: number;
  discountAmount?: number;
};

export function lineTotalBeforeVat(line: LineInput): number {
  const qty = Number(line.quantity ?? 0);
  const price = Number(line.unitPriceBeforeVat ?? 0);
  const discount = Number(line.discountAmount ?? 0);
  return round2(Math.max(0, qty * price - discount));
}

export type HeaderTotalsInput = {
  lines: LineInput[];
  headerDiscountAmount?: number;
  vatRate?: number;
};

export type HeaderTotals = {
  subtotalBeforeVat: number;
  discountAmount: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
};

export function computeHeaderTotals(input: HeaderTotalsInput): HeaderTotals {
  const linesTotal = input.lines.reduce((sum, line) => sum + lineTotalBeforeVat(line), 0);
  const subtotal = round2(linesTotal);
  const discount = round2(Math.max(0, Number(input.headerDiscountAmount ?? 0)));
  const taxable = round2(Math.max(0, subtotal - discount));
  const vatRate = round2(Math.max(0, Number(input.vatRate ?? 0)));
  const vatAmount = round2(taxable * (vatRate / 100));
  const totalAmount = round2(taxable + vatAmount);
  return { subtotalBeforeVat: subtotal, discountAmount: discount, vatRate, vatAmount, totalAmount };
}

// Look up the effective VAT rate to apply on a new document.
// Returns 0 if VAT is not enabled at the company level.
export async function getEffectiveVatRate(overrideRate?: number | null): Promise<number> {
  const settings = await prisma.companySetting.findFirst({ orderBy: { id: "asc" } });
  if (!settings?.vatEnabled) return 0;
  if (overrideRate !== null && overrideRate !== undefined && Number.isFinite(Number(overrideRate))) {
    return Math.max(0, Number(overrideRate));
  }
  return settings.defaultVatRate ?? 0;
}
