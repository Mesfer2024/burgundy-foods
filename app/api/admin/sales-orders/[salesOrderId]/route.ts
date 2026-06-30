import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { buildSalesOrderHeader, normalizeSalesOrderLines, validateSalesOrderLine, type SalesOrderHeaderPayload } from "@/lib/orderPayloads";
import { computeHeaderTotals, getEffectiveVatRate, lineTotalBeforeVat } from "@/lib/orderMath";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session;
}

export async function GET(_request: Request, { params }: { params: Promise<{ salesOrderId: string }> }) {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });
  const { salesOrderId } = await params;
  const order = await prisma.salesOrder.findUnique({
    where: { id: salesOrderId },
    include: {
      customer: true,
      quotation: { select: { id: true, quotationNumber: true } },
      lines: { include: { product: { select: { id: true, nameAr: true, nameEn: true } } } },
      deliveryNotes: { include: { lines: true } },
      invoices: { include: { lines: true, payments: true } },
    },
  });
  if (!order) return new NextResponse(null, { status: 404 });
  return NextResponse.json(order);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ salesOrderId: string }> }) {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });
  const { salesOrderId } = await params;
  const body = (await request.json()) as SalesOrderHeaderPayload & { lines?: unknown };
  const header = buildSalesOrderHeader(body);
  if (!header.customerId) return NextResponse.json({ error: "العميل مطلوب." }, { status: 400 });
  const lines = normalizeSalesOrderLines((body as { lines?: unknown }).lines);
  if (lines.length === 0) return NextResponse.json({ error: "أضف بنداً واحداً على الأقل." }, { status: 400 });
  for (let i = 0; i < lines.length; i++) {
    const err = validateSalesOrderLine(lines[i]);
    if (err) return NextResponse.json({ error: `السطر ${i + 1}: ${err}` }, { status: 400 });
  }

  const vatRate = await getEffectiveVatRate(header.vatRateRequested);
  const totals = computeHeaderTotals({
    lines: lines.map((line) => ({ quantity: line.quantity, unitPriceBeforeVat: line.unitPriceBeforeVat, discountAmount: 0 })),
    headerDiscountAmount: header.headerDiscountAmount,
    vatRate,
  });
  const actor = session.user.email ?? null;

  const order = await prisma.$transaction(async (tx) => {
    await tx.salesOrderLine.deleteMany({ where: { salesOrderId } });
    return tx.salesOrder.update({
      where: { id: salesOrderId },
      data: {
        customerId: header.customerId,
        quotationId: header.quotationId,
        orderDate: header.orderDate,
        expectedDeliveryDate: header.expectedDeliveryDate,
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
  });
  return NextResponse.json(order);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ salesOrderId: string }> }) {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });
  const { salesOrderId } = await params;
  const linked = await Promise.all([
    prisma.deliveryNote.count({ where: { salesOrderId } }),
    prisma.invoice.count({ where: { salesOrderId } }),
  ]);
  if (linked.some((n) => n > 0)) {
    const order = await prisma.salesOrder.update({
      where: { id: salesOrderId },
      data: { status: "cancelled", updatedBy: session.user.email ?? null },
    });
    return NextResponse.json({ archived: true, salesOrder: order });
  }
  await prisma.salesOrder.delete({ where: { id: salesOrderId } });
  return NextResponse.json({ success: true });
}
