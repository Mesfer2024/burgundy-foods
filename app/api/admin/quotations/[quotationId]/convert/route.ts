import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { nextSequenceNumber } from "@/lib/sequenceNumber";
import { computeHeaderTotals, lineTotalBeforeVat } from "@/lib/orderMath";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session;
}

// Convert a quotation into a draft SalesOrder. The new order copies header totals
// and lines (without quotation-line-specific discount; that's already baked into
// the line totals). Quotation status moves to "accepted" if it's still draft/sent.
export async function POST(_request: Request, { params }: { params: Promise<{ quotationId: string }> }) {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });
  const { quotationId } = await params;

  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: { lines: true },
  });
  if (!quotation) return NextResponse.json({ error: "عرض السعر غير موجود." }, { status: 404 });
  if (quotation.lines.length === 0) {
    return NextResponse.json({ error: "لا يمكن تحويل عرض سعر بدون بنود." }, { status: 400 });
  }

  const lines = quotation.lines.map((line) => ({
    productId: line.productId,
    quantity: line.quantity,
    quantityType: line.quantityType,
    unitPriceBeforeVat: line.unitPriceBeforeVat,
    notes: line.notes ?? null,
  }));
  // Recompute totals from the salesOrder lines so they're consistent with stored figures.
  const totals = computeHeaderTotals({
    lines: lines.map((line) => ({
      quantity: line.quantity,
      unitPriceBeforeVat: line.unitPriceBeforeVat,
      discountAmount: 0,
    })),
    headerDiscountAmount: quotation.discountAmount,
    vatRate: quotation.vatRate,
  });

  const salesOrderNumber = await nextSequenceNumber("salesOrder");
  const actor = session.user.email ?? null;

  const result = await prisma.$transaction(async (tx) => {
    const salesOrder = await tx.salesOrder.create({
      data: {
        salesOrderNumber,
        quotationId: quotation.id,
        customerId: quotation.customerId,
        orderDate: new Date(),
        status: "draft",
        subtotalBeforeVat: totals.subtotalBeforeVat,
        discountAmount: totals.discountAmount,
        vatRate: totals.vatRate,
        vatAmount: totals.vatAmount,
        totalAmount: totals.totalAmount,
        notes: quotation.notes,
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

    if (quotation.status === "draft" || quotation.status === "sent") {
      await tx.quotation.update({
        where: { id: quotation.id },
        data: { status: "accepted", updatedBy: actor },
      });
    }

    return salesOrder;
  });

  return NextResponse.json(result);
}
