import { normalizeQuantityType } from "@/lib/orderMath";

function optionalText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function requiredText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function numberValue(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function optionalDate(value: unknown): Date | null {
  if (typeof value !== "string" || value.trim().length === 0) return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date;
}

function requiredDate(value: unknown, fallback = new Date()): Date {
  if (typeof value !== "string" || value.trim().length === 0) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? fallback : date;
}

// ---------- Line item normalisation ----------

export type LinePayload = {
  productId?: unknown;
  quantity?: unknown;
  quantityType?: unknown;
  unitPriceBeforeVat?: unknown;
  discountAmount?: unknown;
  notes?: unknown;
  batchNumber?: unknown;
  expiryDate?: unknown;
};

export type NormalizedQuotationLine = {
  productId: string;
  quantity: number;
  quantityType: ReturnType<typeof normalizeQuantityType>;
  unitPriceBeforeVat: number;
  discountAmount: number;
  notes: string | null;
};

export type NormalizedSalesOrderLine = {
  productId: string;
  quantity: number;
  quantityType: ReturnType<typeof normalizeQuantityType>;
  unitPriceBeforeVat: number;
  notes: string | null;
};

export type NormalizedDeliveryLine = {
  productId: string;
  quantity: number;
  quantityType: ReturnType<typeof normalizeQuantityType>;
  batchNumber: string | null;
  expiryDate: Date | null;
  notes: string | null;
};

export type NormalizedInvoiceLine = NormalizedSalesOrderLine;

export function normalizeQuotationLines(lines: unknown): NormalizedQuotationLine[] {
  if (!Array.isArray(lines)) return [];
  return lines
    .map((raw): NormalizedQuotationLine | null => {
      const line = raw as LinePayload;
      const productId = optionalText(line.productId);
      if (!productId) return null;
      return {
        productId,
        quantity: Math.max(0, numberValue(line.quantity)),
        quantityType: normalizeQuantityType(line.quantityType),
        unitPriceBeforeVat: Math.max(0, numberValue(line.unitPriceBeforeVat)),
        discountAmount: Math.max(0, numberValue(line.discountAmount)),
        notes: optionalText(line.notes),
      };
    })
    .filter((line): line is NormalizedQuotationLine => line !== null);
}

export function normalizeSalesOrderLines(lines: unknown): NormalizedSalesOrderLine[] {
  if (!Array.isArray(lines)) return [];
  return lines
    .map((raw): NormalizedSalesOrderLine | null => {
      const line = raw as LinePayload;
      const productId = optionalText(line.productId);
      if (!productId) return null;
      return {
        productId,
        quantity: Math.max(0, numberValue(line.quantity)),
        quantityType: normalizeQuantityType(line.quantityType),
        unitPriceBeforeVat: Math.max(0, numberValue(line.unitPriceBeforeVat)),
        notes: optionalText(line.notes),
      };
    })
    .filter((line): line is NormalizedSalesOrderLine => line !== null);
}

export function normalizeDeliveryLines(lines: unknown): NormalizedDeliveryLine[] {
  if (!Array.isArray(lines)) return [];
  return lines
    .map((raw): NormalizedDeliveryLine | null => {
      const line = raw as LinePayload;
      const productId = optionalText(line.productId);
      if (!productId) return null;
      return {
        productId,
        quantity: Math.max(0, numberValue(line.quantity)),
        quantityType: normalizeQuantityType(line.quantityType),
        batchNumber: optionalText(line.batchNumber),
        expiryDate: optionalDate(line.expiryDate),
        notes: optionalText(line.notes),
      };
    })
    .filter((line): line is NormalizedDeliveryLine => line !== null);
}

export function normalizeInvoiceLines(lines: unknown): NormalizedInvoiceLine[] {
  return normalizeSalesOrderLines(lines);
}

// ---------- Header payloads ----------

const QUOTATION_STATUS = new Set(["draft", "sent", "accepted", "rejected", "expired"]);
const SALES_ORDER_STATUS = new Set(["draft", "confirmed", "preparing", "delivered", "cancelled"]);
const DELIVERY_STATUS = new Set(["pending", "dispatched", "delivered", "returned", "cancelled"]);
const INVOICE_STATUS = new Set(["draft", "issued", "partially_paid", "paid", "cancelled"]);
const PAYMENT_METHOD = new Set(["bank_transfer", "cash", "mada", "other"]);
const ATTACHMENT_TYPES = new Set(["quotation", "sales_order", "delivery_note", "invoice", "payment"]);

function status<T extends string>(value: unknown, allowed: Set<string>, fallback: T): T {
  if (typeof value !== "string") return fallback;
  return (allowed.has(value) ? (value as T) : fallback) as T;
}

export type QuotationHeaderPayload = {
  customerId?: unknown;
  issueDate?: unknown;
  expiryDate?: unknown;
  status?: unknown;
  notes?: unknown;
  discountAmount?: unknown;
  vatRate?: unknown;
};

export function buildQuotationHeader(body: QuotationHeaderPayload) {
  return {
    customerId: requiredText(body.customerId),
    issueDate: requiredDate(body.issueDate),
    expiryDate: optionalDate(body.expiryDate),
    status: status<"draft" | "sent" | "accepted" | "rejected" | "expired">(body.status, QUOTATION_STATUS, "draft"),
    notes: optionalText(body.notes),
    headerDiscountAmount: Math.max(0, numberValue(body.discountAmount)),
    vatRateRequested: body.vatRate === null || body.vatRate === undefined || body.vatRate === "" ? null : numberValue(body.vatRate),
  };
}

export type SalesOrderHeaderPayload = {
  customerId?: unknown;
  quotationId?: unknown;
  orderDate?: unknown;
  expectedDeliveryDate?: unknown;
  status?: unknown;
  notes?: unknown;
  discountAmount?: unknown;
  vatRate?: unknown;
};

export function buildSalesOrderHeader(body: SalesOrderHeaderPayload) {
  return {
    customerId: requiredText(body.customerId),
    quotationId: optionalText(body.quotationId),
    orderDate: requiredDate(body.orderDate),
    expectedDeliveryDate: optionalDate(body.expectedDeliveryDate),
    status: status<"draft" | "confirmed" | "preparing" | "delivered" | "cancelled">(body.status, SALES_ORDER_STATUS, "draft"),
    notes: optionalText(body.notes),
    headerDiscountAmount: Math.max(0, numberValue(body.discountAmount)),
    vatRateRequested: body.vatRate === null || body.vatRate === undefined || body.vatRate === "" ? null : numberValue(body.vatRate),
  };
}

export type DeliveryNoteHeaderPayload = {
  salesOrderId?: unknown;
  customerId?: unknown;
  warehouseName?: unknown;
  deliveryDate?: unknown;
  driverName?: unknown;
  vehiclePlate?: unknown;
  deliveryStatus?: unknown;
  receivedBy?: unknown;
  notes?: unknown;
};

export function buildDeliveryHeader(body: DeliveryNoteHeaderPayload) {
  return {
    salesOrderId: requiredText(body.salesOrderId),
    customerId: requiredText(body.customerId),
    warehouseName: optionalText(body.warehouseName),
    deliveryDate: requiredDate(body.deliveryDate),
    driverName: optionalText(body.driverName),
    vehiclePlate: optionalText(body.vehiclePlate),
    deliveryStatus: status<"pending" | "dispatched" | "delivered" | "returned" | "cancelled">(body.deliveryStatus, DELIVERY_STATUS, "pending"),
    receivedBy: optionalText(body.receivedBy),
    notes: optionalText(body.notes),
  };
}

export type InvoiceHeaderPayload = {
  customerId?: unknown;
  salesOrderId?: unknown;
  deliveryNoteId?: unknown;
  invoiceDate?: unknown;
  dueDate?: unknown;
  status?: unknown;
  notes?: unknown;
  discountAmount?: unknown;
  vatRate?: unknown;
};

export function buildInvoiceHeader(body: InvoiceHeaderPayload) {
  return {
    customerId: requiredText(body.customerId),
    salesOrderId: optionalText(body.salesOrderId),
    deliveryNoteId: optionalText(body.deliveryNoteId),
    invoiceDate: requiredDate(body.invoiceDate),
    dueDate: optionalDate(body.dueDate),
    status: status<"draft" | "issued" | "partially_paid" | "paid" | "cancelled">(body.status, INVOICE_STATUS, "draft"),
    notes: optionalText(body.notes),
    headerDiscountAmount: Math.max(0, numberValue(body.discountAmount)),
    vatRateRequested: body.vatRate === null || body.vatRate === undefined || body.vatRate === "" ? null : numberValue(body.vatRate),
  };
}

export type PaymentReceiptPayload = {
  invoiceId?: unknown;
  customerId?: unknown;
  paymentDate?: unknown;
  amount?: unknown;
  paymentMethod?: unknown;
  bankAccount?: unknown;
  referenceNumber?: unknown;
  notes?: unknown;
};

export function buildPaymentReceipt(body: PaymentReceiptPayload) {
  return {
    invoiceId: optionalText(body.invoiceId),
    customerId: requiredText(body.customerId),
    paymentDate: requiredDate(body.paymentDate),
    amount: Math.max(0, numberValue(body.amount)),
    paymentMethod: status<"bank_transfer" | "cash" | "mada" | "other">(body.paymentMethod, PAYMENT_METHOD, "bank_transfer"),
    bankAccount: optionalText(body.bankAccount),
    referenceNumber: optionalText(body.referenceNumber),
    notes: optionalText(body.notes),
  };
}

export type AttachmentPayload = {
  relatedType?: unknown;
  relatedId?: unknown;
  fileName?: unknown;
  fileUrl?: unknown;
  fileType?: unknown;
  notes?: unknown;
};

export function buildAttachment(body: AttachmentPayload) {
  return {
    relatedType: status<"quotation" | "sales_order" | "delivery_note" | "invoice" | "payment">(body.relatedType, ATTACHMENT_TYPES, "quotation"),
    relatedId: requiredText(body.relatedId),
    fileName: requiredText(body.fileName),
    fileUrl: requiredText(body.fileUrl),
    fileType: optionalText(body.fileType),
    notes: optionalText(body.notes),
  };
}
