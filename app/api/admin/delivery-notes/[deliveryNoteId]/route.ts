import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { buildDeliveryHeader, normalizeDeliveryLines, validateDeliveryLine, type DeliveryNoteHeaderPayload } from "@/lib/orderPayloads";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session;
}

export async function GET(_request: Request, { params }: { params: Promise<{ deliveryNoteId: string }> }) {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });
  const { deliveryNoteId } = await params;
  const note = await prisma.deliveryNote.findUnique({
    where: { id: deliveryNoteId },
    include: { customer: true, salesOrder: true, lines: { include: { product: { select: { id: true, nameAr: true, nameEn: true } } } } },
  });
  if (!note) return new NextResponse(null, { status: 404 });
  return NextResponse.json(note);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ deliveryNoteId: string }> }) {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });
  const { deliveryNoteId } = await params;
  const body = (await request.json()) as DeliveryNoteHeaderPayload & { lines?: unknown };
  const header = buildDeliveryHeader(body);
  if (!header.salesOrderId || !header.customerId) {
    return NextResponse.json({ error: "أمر البيع والعميل مطلوبان." }, { status: 400 });
  }
  const lines = normalizeDeliveryLines((body as { lines?: unknown }).lines);
  if (lines.length === 0) return NextResponse.json({ error: "أضف بنداً واحداً على الأقل." }, { status: 400 });
  for (let i = 0; i < lines.length; i++) {
    const err = validateDeliveryLine(lines[i]);
    if (err) return NextResponse.json({ error: `السطر ${i + 1}: ${err}` }, { status: 400 });
  }

  const actor = session.user.email ?? null;
  const note = await prisma.$transaction(async (tx) => {
    await tx.deliveryNoteLine.deleteMany({ where: { deliveryNoteId } });
    return tx.deliveryNote.update({
      where: { id: deliveryNoteId },
      data: {
        salesOrderId: header.salesOrderId,
        customerId: header.customerId,
        warehouseName: header.warehouseName,
        deliveryDate: header.deliveryDate,
        driverName: header.driverName,
        vehiclePlate: header.vehiclePlate,
        deliveryStatus: header.deliveryStatus,
        receivedBy: header.receivedBy,
        notes: header.notes,
        updatedBy: actor,
        lines: { create: lines },
      },
      include: { customer: true, salesOrder: true, lines: true },
    });
  });
  return NextResponse.json(note);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ deliveryNoteId: string }> }) {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });
  const { deliveryNoteId } = await params;
  const linkedInvoices = await prisma.invoice.count({ where: { deliveryNoteId } });
  if (linkedInvoices > 0) {
    const note = await prisma.deliveryNote.update({
      where: { id: deliveryNoteId },
      data: { deliveryStatus: "cancelled", updatedBy: session.user.email ?? null },
    });
    return NextResponse.json({ archived: true, deliveryNote: note });
  }
  await prisma.deliveryNote.delete({ where: { id: deliveryNoteId } });
  return NextResponse.json({ success: true });
}
