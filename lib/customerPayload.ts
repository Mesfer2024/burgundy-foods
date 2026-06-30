export type CustomerPayload = {
  name?: unknown;
  companyName?: unknown;
  type?: unknown;
  city?: unknown;
  taxNumber?: unknown;
  tradeLicense?: unknown;
  phone?: unknown;
  email?: unknown;
  address?: unknown;
  notes?: unknown;
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

export function buildCustomerData(body: CustomerPayload) {
  return {
    name: requiredText(body.name),
    companyName: optionalText(body.companyName),
    type: requiredText(body.type, "بقالة"),
    city: requiredText(body.city),
    taxNumber: optionalText(body.taxNumber),
    tradeLicense: optionalText(body.tradeLicense),
    phone: requiredText(body.phone),
    email: optionalText(body.email),
    address: optionalText(body.address),
    notes: optionalText(body.notes),
  };
}
