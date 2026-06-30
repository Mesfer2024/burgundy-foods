import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { buildQuotationHeader, normalizeQuotationLines, validateQuotationLine, type QuotationHeaderPayload } from "@/lib/orderPayloads";
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
  const quotations = await prisma.quotation.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { id: true, name: true, companyName: true } },
      lines: true,
    },
  });
  return NextResponse.json(quotations);
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });

  const body = (await request.json()) as QuotationHeaderPayload & { lines?: unknown };
  const header = buildQuotationHeader(body);
  if (!header.customerId) {
    return NextResponse.json({ error: "العميل مطلوب." }, { status: 400 });
  }
  const lines = normalizeQuotationLines((body as { lines?: unknown }).lines);
  if (lines.length === 0) {
    return NextResponse.json({ error: "أضف بنداً واحداً على الأقل." }, { status: 400 });
  }
  for (let i = 0; i < lines.length; i++) {
    const err = validateQuotationLine(lines[i]);
    if (err) return NextResponse.json({ error: `السطر ${i + 1}: ${err}` }, { status: 400 });
  }

  const vatRate = await getEffectiveVatRate(header.vatRateRequested);
  const totals = computeHeaderTotals({ lines, headerDiscountAmount: header.headerDiscountAmount, vatRate });
  const quotationNumber = await nextSequenceNumber("quotation");
  const actor = session.user.email ?? null;

  const quotation = await prisma.quotation.create({
    data: {
      quotationNumber,
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
      createdBy: actor,
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
  return NextResponse.json(quotation);
}
