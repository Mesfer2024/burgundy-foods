import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { buildSupplierData, type SupplierPayload } from "@/lib/supplierPayload";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session;
}

export async function GET(_request: Request, { params }: { params: Promise<{ supplierId: string }> }) {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });
  const { supplierId } = await params;
  const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
  if (!supplier) return new NextResponse(null, { status: 404 });
  return NextResponse.json(supplier);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ supplierId: string }> }) {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });
  const { supplierId } = await params;
  const body = (await request.json()) as SupplierPayload;
  const data = buildSupplierData(body);
  if (!data.nameAr) {
    return NextResponse.json({ error: "اسم المورد بالعربية مطلوب." }, { status: 400 });
  }

  const supplier = await prisma.supplier.update({
    where: { id: supplierId },
    data: { ...data, updatedBy: session.user.email ?? null },
  });
  return NextResponse.json(supplier);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ supplierId: string }> }) {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });
  const { supplierId } = await params;
  const linkedProducts = await prisma.product.count({ where: { supplierId } });
  if (linkedProducts > 0) {
    const supplier = await prisma.supplier.update({
      where: { id: supplierId },
      data: { active: false, updatedBy: session.user.email ?? null },
    });
    return NextResponse.json({ archived: true, supplier });
  }
  await prisma.supplier.delete({ where: { id: supplierId } });
  return NextResponse.json({ success: true });
}
