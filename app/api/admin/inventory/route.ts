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

export async function GET() {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });

  const batches = await prisma.inventoryBatch.findMany({
    orderBy: { createdAt: "desc" },
    include: { product: true },
  });
  return NextResponse.json(batches);
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });

  const body = (await request.json()) as InventoryPayload;
  const data = buildInventoryData(body);
  if (!data.productId || !data.shipmentNumber) {
    return NextResponse.json({ error: "المنتج ورقم الشحنة مطلوبان." }, { status: 400 });
  }

  const batch = await prisma.inventoryBatch.create({
    data,
    include: { product: true },
  });
  return NextResponse.json(batch);
}
