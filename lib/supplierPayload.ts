export type SupplierPayload = {
  nameAr?: unknown;
  nameEn?: unknown;
  type?: unknown;
  country?: unknown;
  city?: unknown;
  contactName?: unknown;
  phone?: unknown;
  email?: unknown;
  address?: unknown;
  taxNumber?: unknown;
  notes?: unknown;
  active?: unknown;
};

function optionalText(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function requiredText(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

export function buildSupplierData(body: SupplierPayload) {
  return {
    nameAr: requiredText(body.nameAr),
    nameEn: optionalText(body.nameEn),
    type: optionalText(body.type),
    country: optionalText(body.country),
    city: optionalText(body.city),
    contactName: optionalText(body.contactName),
    phone: optionalText(body.phone),
    email: optionalText(body.email),
    address: optionalText(body.address),
    taxNumber: optionalText(body.taxNumber),
    notes: optionalText(body.notes),
    active: typeof body.active === "boolean" ? body.active : true,
  };
}
