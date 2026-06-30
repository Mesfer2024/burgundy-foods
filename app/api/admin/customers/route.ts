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

export async function GET() {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });
  const customers = await prisma.customer.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(customers);
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });
  const body = (await request.json()) as CustomerPayload;
  const data = buildCustomerData(body);
  if (!data.name || !data.city || !data.phone) {
    return NextResponse.json({ error: "اسم العميل والمدينة ورقم الجوال مطلوبة." }, { status: 400 });
  }

  const customer = await prisma.customer.create({
    data,
  });
  return NextResponse.json(customer);
}
