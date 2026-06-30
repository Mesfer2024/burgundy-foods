import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { buildInventoryData, type InventoryPayload } from "@/lib/inventoryPayload";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session;
}

export async function GET(_request: Request, { params }: { params: Promise<{ batchId: string }> }) {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });
  const { batchId } = await params;
  const batch = await prisma.inventoryBatch.findUnique({
    where: { id: batchId },
    include: { product: true },
  });
  if (!batch) return new NextResponse(null, { status: 404 });
  return NextResponse.json(batch);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ batchId: string }> }) {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });
  const { batchId } = await params;
  const body = (await request.json()) as InventoryPayload;
  const data = buildInventoryData(body);
  if (!data.productId || !data.shipmentNumber) {
    return NextResponse.json({ error: "المنتج ورقم الشحنة مطلوبان." }, { status: 400 });
  }

  const batch = await prisma.inventoryBatch.update({
    where: { id: batchId },
    data,
    include: { product: true },
  });
  return NextResponse.json(batch);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ batchId: string }> }) {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });
  const { batchId } = await params;
  await prisma.inventoryBatch.delete({ where: { id: batchId } });
  return NextResponse.json({ success: true });
}
