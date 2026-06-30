import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { buildProductData, type ProductPayload } from "@/lib/productPayload";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session;
}

export async function GET(request: Request, { params }: { params: Promise<{ productId: string }> }) {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });
  const resolvedParams = await params;
  const product = await prisma.product.findUnique({ where: { id: resolvedParams.productId } });
  if (!product) return new NextResponse(null, { status: 404 });
  return NextResponse.json(product);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ productId: string }> }) {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });
  const body = (await request.json()) as ProductPayload;
  const resolvedParams = await params;
  const data = buildProductData(body);
  if (!data.nameAr || !data.nameEn) {
    return NextResponse.json({ error: "اسم المنتج العربي والإنجليزي مطلوبان." }, { status: 400 });
  }

  const updated = await prisma.product.update({
    where: { id: resolvedParams.productId },
    data,
  });
  return NextResponse.json(updated);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ productId: string }> }) {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });
  const resolvedParams = await params;
  const product = await prisma.product.findUnique({
    where: { id: resolvedParams.productId },
    include: { _count: { select: { inventoryBatches: true, orderItems: true } } },
  });
  if (!product) return new NextResponse(null, { status: 404 });

  if (product._count.inventoryBatches > 0 || product._count.orderItems > 0) {
    const archived = await prisma.product.update({
      where: { id: resolvedParams.productId },
      data: { active: false },
    });
    return NextResponse.json({ success: true, archived: true, product: archived });
  }

  await prisma.product.delete({ where: { id: resolvedParams.productId } });
  return NextResponse.json({ success: true });
}
