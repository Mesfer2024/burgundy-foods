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

export async function GET() {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });
  const suppliers = await prisma.supplier.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(suppliers);
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });
  const body = (await request.json()) as SupplierPayload;
  const data = buildSupplierData(body);
  if (!data.nameAr) {
    return NextResponse.json({ error: "اسم المورد بالعربية مطلوب." }, { status: 400 });
  }

  const supplier = await prisma.supplier.create({
    data: { ...data, createdBy: session.user.email ?? null, updatedBy: session.user.email ?? null },
  });
  return NextResponse.json(supplier);
}
