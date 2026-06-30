export type ProductPayload = {
  sku?: unknown;
  internalSku?: unknown;
  supplierSku?: unknown;
  barcode?: unknown;
  nameAr?: unknown;
  nameEn?: unknown;
  type?: unknown;
  weight?: unknown;
  unitWeightGrams?: unknown;
  packSize?: unknown;
  packsPerCarton?: unknown;
  unitsPerCarton?: unknown;
  cartonsPerPallet?: unknown;
  palletsPerContainer?: unknown;
  cartonsPerContainer?: unknown;
  minimumOrderQuantity?: unknown;
  originCountry?: unknown;
  imageUrl?: unknown;
  cartonPurchase?: unknown;
  cartonSale?: unknown;
  shippingCost?: unknown;
  customsCost?: unknown;
  active?: unknown;
  isVerified?: unknown;
  supplierId?: unknown;
};

function optionalText(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function requiredText(value: unknown, fallback = "") {
  if (typeof value !== "string") return fallback;
  return value.trim();
}

function optionalInt(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const rounded = Math.round(parsed);
  return rounded > 0 ? rounded : null;
}

function numberValue(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function buildProductData(body: ProductPayload) {
  const cartonPurchase = numberValue(body.cartonPurchase);
  const cartonSale = numberValue(body.cartonSale);
  const shippingCost = numberValue(body.shippingCost);
  const customsCost = numberValue(body.customsCost);
  const totalCost = cartonPurchase + shippingCost + customsCost;
  const marginPercent = totalCost > 0 ? Math.max(0, ((cartonSale - totalCost) / totalCost) * 100) : 0;

  return {
    sku: optionalText(body.sku),
    internalSku: optionalText(body.internalSku),
    supplierSku: optionalText(body.supplierSku),
    barcode: optionalText(body.barcode),
    nameAr: requiredText(body.nameAr),
    nameEn: requiredText(body.nameEn),
    type: requiredText(body.type, "Spaghetti"),
    weight: optionalText(body.weight),
    unitWeightGrams: optionalInt(body.unitWeightGrams),
    packSize: optionalText(body.packSize),
    packsPerCarton: optionalInt(body.packsPerCarton),
    unitsPerCarton: optionalInt(body.unitsPerCarton),
    cartonsPerPallet: optionalInt(body.cartonsPerPallet),
    palletsPerContainer: optionalInt(body.palletsPerContainer),
    cartonsPerContainer: optionalInt(body.cartonsPerContainer),
    minimumOrderQuantity: optionalInt(body.minimumOrderQuantity),
    originCountry: optionalText(body.originCountry),
    imageUrl: optionalText(body.imageUrl),
    cartonPurchase,
    cartonSale,
    shippingCost,
    customsCost,
    totalCost,
    marginPercent,
    active: typeof body.active === "boolean" ? body.active : true,
    isVerified: typeof body.isVerified === "boolean" ? body.isVerified : false,
    supplierId: optionalText(body.supplierId),
  };
}
