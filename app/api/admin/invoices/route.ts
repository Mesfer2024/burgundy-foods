import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { buildInvoiceHeader, normalizeInvoiceLines, type InvoiceHeaderPayload } from "@/lib/orderPayloads";
import { computeHeaderTotals, getEffectiveVatRate, lineTotalBeforeVat, round2 } from "@/lib/orderMath";
import { nextSequenceNumber } from "@/lib/sequenceNumber";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session;
}

export async function GET() {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });
  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { id: true, name: true, companyName: true } },
      salesOrder: { select: { id: true, salesOrderNumber: true } },
      deliveryNote: { select: { id: true, deliveryNoteNumber: true } },
      lines: true,
      payments: { select: { id: true, amount: true, paymentDate: true, paymentMethod: true } },
    },
  });
  return NextResponse.json(invoices);
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });
  const body = (await request.json()) as InvoiceHeaderPayload & { lines?: unknown };
  const header = buildInvoiceHeader(body);
  if (!header.customerId) return NextResponse.json({ error: "العميل مطلوب." }, { status: 400 });
  const lines = normalizeInvoiceLines((body as { lines?: unknown }).lines);
  if (lines.length === 0) return NextResponse.json({ error: "أضف بنداً واحداً على الأقل." }, { status: 400 });

  const vatRate = await getEffectiveVatRate(header.vatRateRequested);
  const totals = computeHeaderTotals({
    lines: lines.map((line) => ({ quantity: line.quantity, unitPriceBeforeVat: line.unitPriceBeforeVat, discountAmount: 0 })),
    headerDiscountAmount: header.headerDiscountAmount,
    vatRate,
  });
  const invoiceNumber = await nextSequenceNumber("invoice");
  const actor = session.user.email ?? null;
  const balanceDue = round2(totals.totalAmount);

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      salesOrderId: header.salesOrderId,
      deliveryNoteId: header.deliveryNoteId,
      customerId: header.customerId,
      invoiceDate: header.invoiceDate,
      dueDate: header.dueDate,
      status: header.status,
      subtotalBeforeVat: totals.subtotalBeforeVat,
      discountAmount: totals.discountAmount,
      vatRate: totals.vatRate,
      vatAmount: totals.vatAmount,
      totalAmount: totals.totalAmount,
      amountPaid: 0,
      balanceDue,
      notes: header.notes,
      createdBy: actor,
      updatedBy: actor,
      lines: {
        create: lines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
          quantityType: line.quantityType,
          unitPriceBeforeVat: line.unitPriceBeforeVat,
          lineTotalBeforeVat: lineTotalBeforeVat({
            quantity: line.quantity,
            unitPriceBeforeVat: line.unitPriceBeforeVat,
            discountAmount: 0,
          }),
          notes: line.notes,
        })),
      },
    },
    include: { customer: true, lines: true },
  });
  return NextResponse.json(invoice);
}
