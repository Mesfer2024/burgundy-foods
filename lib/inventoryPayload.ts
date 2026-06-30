export type InventoryPayload = {
  productId?: unknown;
  shipmentNumber?: unknown;
  arrivalDate?: unknown;
  supplier?: unknown;
  cartonQty?: unknown;
  packQty?: unknown;
  productionDate?: unknown;
  expiryDate?: unknown;
  batchNumber?: unknown;
  warehouse?: unknown;
};

function optionalText(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function requiredText(value: unknown) {
  return optionalText(value) ?? "";
}

function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0;
}

function dateValue(value: unknown) {
  if (typeof value !== "string" || !value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function buildInventoryData(body: InventoryPayload) {
  return {
    productId: requiredText(body.productId),
    shipmentNumber: requiredText(body.shipmentNumber),
    arrivalDate: dateValue(body.arrivalDate),
    supplier: optionalText(body.supplier),
    cartonQty: numberValue(body.cartonQty),
    packQty: numberValue(body.packQty),
    productionDate: dateValue(body.productionDate),
    expiryDate: dateValue(body.expiryDate),
    batchNumber: optionalText(body.batchNumber),
    warehouse: optionalText(body.warehouse),
  };
}
