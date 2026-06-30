import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { buildQuotationHeader, normalizeQuotationLines, type QuotationHeaderPayload } from "@/lib/orderPayloads";
import { computeHeaderTotals, getEffectiveVatRate, lineTotalBeforeVat } from "@/lib/orderMath";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session;
}

export async function GET(_request: Request, { params }: { params: Promise<{ quotationId: string }> }) {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });
  const { quotationId } = await params;
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: { customer: true, lines: { include: { product: { select: { id: true, nameAr: true, nameEn: true } } } } },
  });
  if (!quotation) return new NextResponse(null, { status: 404 });
  return NextResponse.json(quotation);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ quotationId: string }> }) {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });
  const { quotationId } = await params;
  const body = (await request.json()) as QuotationHeaderPayload & { lines?: unknown };
  const header = buildQuotationHeader(body);
  if (!header.customerId) {
    return NextResponse.json({ error: "العميل مطلوب." }, { status: 400 });
  }
  const lines = normalizeQuotationLines((body as { lines?: unknown }).lines);
  if (lines.length === 0) {
    return NextResponse.json({ error: "أضف بنداً واحداً على الأقل." }, { status: 400 });
  }

  const vatRate = await getEffectiveVatRate(header.vatRateRequested);
  const totals = computeHeaderTotals({ lines, headerDiscountAmount: header.headerDiscountAmount, vatRate });
  const actor = session.user.email ?? null;

  const quotation = await prisma.$transaction(async (tx) => {
    await tx.quotationLine.deleteMany({ where: { quotationId } });
    return tx.quotation.update({
      where: { id: quotationId },
      data: {
        customerId: header.customerId,
        issueDate: header.issueDate,
        expiryDate: header.expiryDate,
        status: header.status,
        notes: header.notes,
        subtotalBeforeVat: totals.subtotalBeforeVat,
        discountAmount: totals.discountAmount,
        vatRate: totals.vatRate,
        vatAmount: totals.vatAmount,
        totalAmount: totals.totalAmount,
        updatedBy: actor,
        lines: {
          create: lines.map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
            quantityType: line.quantityType,
            unitPriceBeforeVat: line.unitPriceBeforeVat,
            discountAmount: line.discountAmount,
            lineTotalBeforeVat: lineTotalBeforeVat(line),
            notes: line.notes,
          })),
        },
      },
      include: { customer: true, lines: true },
    });
  });

  return NextResponse.json(quotation);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ quotationId: string }> }) {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });
  const { quotationId } = await params;
  const linkedSalesOrders = await prisma.salesOrder.count({ where: { quotationId } });
  if (linkedSalesOrders > 0) {
    const quotation = await prisma.quotation.update({
      where: { id: quotationId },
      data: { status: "expired", updatedBy: session.user.email ?? null },
    });
    return NextResponse.json({ archived: true, quotation });
  }
  await prisma.quotation.delete({ where: { id: quotationId } });
  return NextResponse.json({ success: true });
}
