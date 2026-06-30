import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session;
}

export async function GET(_request: Request, { params }: { params: Promise<{ salesOrderId: string }> }) {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });
  const { salesOrderId } = await params;

  const salesOrder = await prisma.salesOrder.findUnique({
    where: { id: salesOrderId },
    include: {
      customer: true,
      quotation: { include: { lines: { include: { product: { select: { id: true, nameAr: true, nameEn: true } } } } } },
      lines: { include: { product: { select: { id: true, nameAr: true, nameEn: true } } } },
      deliveryNotes: {
        orderBy: { deliveryDate: "asc" },
        include: { lines: { include: { product: { select: { id: true, nameAr: true, nameEn: true } } } } },
      },
      invoices: {
        orderBy: { invoiceDate: "asc" },
        include: {
          lines: { include: { product: { select: { id: true, nameAr: true, nameEn: true } } } },
          payments: { orderBy: { paymentDate: "asc" } },
        },
      },
    },
  });
  if (!salesOrder) return new NextResponse(null, { status: 404 });

  const relatedIds = [
    { type: "quotation" as const, id: salesOrder.quotation?.id },
    { type: "sales_order" as const, id: salesOrder.id },
    ...salesOrder.deliveryNotes.map((n) => ({ type: "delivery_note" as const, id: n.id })),
    ...salesOrder.invoices.map((i) => ({ type: "invoice" as const, id: i.id })),
    ...salesOrder.invoices.flatMap((i) => i.payments.map((p) => ({ type: "payment" as const, id: p.id }))),
  ].filter((entry): entry is { type: typeof entry.type; id: string } => Boolean(entry.id));

  const attachments = await prisma.orderAttachment.findMany({
    where: {
      OR: relatedIds.map((entry) => ({ AND: [{ relatedType: entry.type }, { relatedId: entry.id }] })),
    },
    orderBy: { uploadedAt: "desc" },
  });

  return NextResponse.json({ salesOrder, attachments });
}
