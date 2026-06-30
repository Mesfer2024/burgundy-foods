import prisma from "@/lib/prisma";

type CounterModel = "quotation" | "salesOrder" | "deliveryNote" | "invoice" | "paymentReceipt";

const PREFIX: Record<CounterModel, string> = {
  quotation: "Q",
  salesOrder: "SO",
  deliveryNote: "DN",
  invoice: "INV",
  paymentReceipt: "RCPT",
};

const FIELD: Record<CounterModel, string> = {
  quotation: "quotationNumber",
  salesOrder: "salesOrderNumber",
  deliveryNote: "deliveryNoteNumber",
  invoice: "invoiceNumber",
  paymentReceipt: "receiptNumber",
};

// Generate the next serial in the form PREFIX-YYYY-0001, scoped per calendar year.
// Reads the highest existing serial for the year, increments, and pads to 4 digits.
// Race-condition note: this is a single-writer back-office app. If concurrent writes
// become a concern, wrap callers in a transaction with retry on unique violation.
export async function nextSequenceNumber(model: CounterModel, now: Date = new Date()): Promise<string> {
  const year = now.getUTCFullYear();
  const prefix = `${PREFIX[model]}-${year}-`;

  // SQLite-safe: query rows starting with this year's prefix, take highest by suffix
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const delegate = (prisma as any)[model];
  const latest = await delegate.findMany({
    where: { [FIELD[model]]: { startsWith: prefix } },
    orderBy: { [FIELD[model]]: "desc" },
    take: 1,
    select: { [FIELD[model]]: true },
  });

  let next = 1;
  if (latest.length > 0) {
    const value: string = latest[0][FIELD[model]];
    const tail = value.slice(prefix.length);
    const parsed = Number.parseInt(tail, 10);
    if (Number.isFinite(parsed)) next = parsed + 1;
  }

  return `${prefix}${String(next).padStart(4, "0")}`;
}
