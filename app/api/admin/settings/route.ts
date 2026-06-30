import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session;
}

export async function GET() {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });

  const settings = await prisma.companySetting.findFirst();
  return NextResponse.json(settings || {});
}

export async function PUT(request: Request) {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });

  const body = await request.json();
  const vatEnabled = typeof body.vatEnabled === "boolean" ? body.vatEnabled : false;
  const parsedRate = Number(body.defaultVatRate);
  const defaultVatRate = Number.isFinite(parsedRate) && parsedRate >= 0 ? parsedRate : 15;
  const data = {
    nameAr: body.nameAr,
    nameEn: body.nameEn,
    phone: body.phone,
    email: body.email,
    address: body.address,
    tradeLicense: body.tradeLicense,
    taxNumber: body.taxNumber,
    logoUrl: body.logoUrl,
    brandColor: body.brandColor,
    description: body.description,
    vatEnabled,
    defaultVatRate,
  };

  const settings = await prisma.companySetting.upsert({
    where: { id: 1 },
    update: data,
    create: { id: 1, ...data },
  });
  return NextResponse.json(settings);
}
