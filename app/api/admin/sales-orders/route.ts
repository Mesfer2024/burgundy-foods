import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { buildSalesOrderHeader, normalizeSalesOrderLines, validateSalesOrderLine, type SalesOrderHeaderPayload } from "@/lib/orderPayloads";
import { computeHeaderTotals, getEffectiveVatRate, lineTotalBeforeVat } from "@/lib/orderMath";
import { nextSequenceNumber } from "@/lib/sequenceNumber";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session;
}

export async function GET() {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });
  const orders = await prisma.salesOrder.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { id: true, name: true, companyName: true } },
      quotation: { select: { id: true, quotationNumber: true } },
      lines: true,
    },
  });
  return NextResponse.json(orders);
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });
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
  const salesOrderNumber = await nextSequenceNumber("salesOrder");
  const actor = session.user.email ?? null;

  const order = await prisma.salesOrder.create({
    data: {
      salesOrderNumber,
      quotationId: header.quotationId,
      customerId: header.customerId,
      orderDate: header.orderDate,
      expectedDeliveryDate: header.expectedDeliveryDate,
      status: header.status,
      notes: header.notes,
      subtotalBeforeVat: totals.subtotalBeforeVat,
      discountAmount: totals.discountAmount,
      vatRate: totals.vatRate,
      vatAmount: totals.vatAmount,
      totalAmount: totals.totalAmount,
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
  return NextResponse.json(order);
}
