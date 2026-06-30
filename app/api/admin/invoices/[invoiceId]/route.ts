import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { buildInvoiceHeader, normalizeInvoiceLines, validateInvoiceLine, type InvoiceHeaderPayload } from "@/lib/orderPayloads";
import { computeHeaderTotals, getEffectiveVatRate, lineTotalBeforeVat, round2 } from "@/lib/orderMath";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session;
}

export async function GET(_request: Request, { params }: { params: Promise<{ invoiceId: string }> }) {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });
  const { invoiceId } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      customer: true,
      salesOrder: true,
      deliveryNote: true,
      lines: { include: { product: { select: { id: true, nameAr: true, nameEn: true } } } },
      payments: true,
    },
  });
  if (!invoice) return new NextResponse(null, { status: 404 });
  return NextResponse.json(invoice);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ invoiceId: string }> }) {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });
  const { invoiceId } = await params;
  const body = (await request.json()) as InvoiceHeaderPayload & { lines?: unknown };
  const header = buildInvoiceHeader(body);
  if (!header.customerId) return NextResponse.json({ error: "العميل مطلوب." }, { status: 400 });
  const lines = normalizeInvoiceLines((body as { lines?: unknown }).lines);
  if (lines.length === 0) return NextResponse.json({ error: "أضف بنداً واحداً على الأقل." }, { status: 400 });
  for (let i = 0; i < lines.length; i++) {
    const err = validateInvoiceLine(lines[i]);
    if (err) return NextResponse.json({ error: `السطر ${i + 1}: ${err}` }, { status: 400 });
  }

  const vatRate = await getEffectiveVatRate(header.vatRateRequested);
  const totals = computeHeaderTotals({
    lines: lines.map((line) => ({ quantity: line.quantity, unitPriceBeforeVat: line.unitPriceBeforeVat, discountAmount: 0 })),
    headerDiscountAmount: header.headerDiscountAmount,
    vatRate,
  });

  // Preserve existing amountPaid so editing the header keeps payment history consistent.
  const existing = await prisma.invoice.findUnique({ where: { id: invoiceId }, select: { amountPaid: true } });
  const amountPaid = existing?.amountPaid ?? 0;
  const balanceDue = round2(Math.max(0, totals.totalAmount - amountPaid));
  const actor = session.user.email ?? null;
  const computedStatus = balanceDue <= 0 && totals.totalAmount > 0 ? "paid" : amountPaid > 0 ? "partially_paid" : header.status;

  const invoice = await prisma.$transaction(async (tx) => {
    await tx.invoiceLine.deleteMany({ where: { invoiceId } });
    return tx.invoice.update({
      where: { id: invoiceId },
      data: {
        customerId: header.customerId,
        salesOrderId: header.salesOrderId,
        deliveryNoteId: header.deliveryNoteId,
        invoiceDate: header.invoiceDate,
        dueDate: header.dueDate,
        status: computedStatus,
        subtotalBeforeVat: totals.subtotalBeforeVat,
        discountAmount: totals.discountAmount,
        vatRate: totals.vatRate,
        vatAmount: totals.vatAmount,
        totalAmount: totals.totalAmount,
        balanceDue,
        notes: header.notes,
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
      include: { customer: true, lines: true, payments: true },
    });
  });
  return NextResponse.json(invoice);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ invoiceId: string }> }) {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });
  const { invoiceId } = await params;
  const linkedPayments = await prisma.paymentReceipt.count({ where: { invoiceId } });
  if (linkedPayments > 0) {
    const invoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: "cancelled", updatedBy: session.user.email ?? null },
    });
    return NextResponse.json({ archived: true, invoice });
  }
  await prisma.invoice.delete({ where: { id: invoiceId } });
  return NextResponse.json({ success: true });
}
