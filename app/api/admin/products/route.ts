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

export async function GET() {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });
  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });
  const body = (await request.json()) as ProductPayload;
  const data = buildProductData(body);
  if (!data.nameAr || !data.nameEn) {
    return NextResponse.json({ error: "اسم المنتج العربي والإنجليزي مطلوبان." }, { status: 400 });
  }

  const product = await prisma.product.create({
    data,
  });
  return NextResponse.json(product);
}
