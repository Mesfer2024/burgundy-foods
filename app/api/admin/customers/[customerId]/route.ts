import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { buildCustomerData, type CustomerPayload } from "@/lib/customerPayload";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session;
}

export async function GET(_request: Request, { params }: { params: Promise<{ customerId: string }> }) {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });
  const { customerId } = await params;
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) return new NextResponse(null, { status: 404 });
  return NextResponse.json(customer);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ customerId: string }> }) {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });
  const { customerId } = await params;
  const body = (await request.json()) as CustomerPayload;
  const data = buildCustomerData(body);
  if (!data.name || !data.city || !data.phone) {
    return NextResponse.json({ error: "اسم العميل والمدينة ورقم الجوال مطلوبة." }, { status: 400 });
  }

  const customer = await prisma.customer.update({
    where: { id: customerId },
    data,
  });
  return NextResponse.json(customer);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ customerId: string }> }) {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });
  const { customerId } = await params;
  await prisma.customer.delete({ where: { id: customerId } });
  return NextResponse.json({ success: true });
}
