import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { buildDeliveryHeader, normalizeDeliveryLines, validateDeliveryLine, type DeliveryNoteHeaderPayload } from "@/lib/orderPayloads";
import { nextSequenceNumber } from "@/lib/sequenceNumber";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session;
}

export async function GET() {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });
  const notes = await prisma.deliveryNote.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { id: true, name: true, companyName: true } },
      salesOrder: { select: { id: true, salesOrderNumber: true } },
      lines: true,
    },
  });
  return NextResponse.json(notes);
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });
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

  const deliveryNoteNumber = await nextSequenceNumber("deliveryNote");
  const actor = session.user.email ?? null;

  const note = await prisma.deliveryNote.create({
    data: {
      deliveryNoteNumber,
      salesOrderId: header.salesOrderId,
      customerId: header.customerId,
      warehouseName: header.warehouseName,
      deliveryDate: header.deliveryDate,
      driverName: header.driverName,
      vehiclePlate: header.vehiclePlate,
      deliveryStatus: header.deliveryStatus,
      receivedBy: header.receivedBy,
      notes: header.notes,
      createdBy: actor,
      updatedBy: actor,
      lines: { create: lines },
    },
    include: { customer: true, salesOrder: true, lines: true },
  });
  return NextResponse.json(note);
}
