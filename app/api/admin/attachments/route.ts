import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { buildAttachment, type AttachmentPayload } from "@/lib/orderPayloads";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session;
}

export async function GET(request: Request) {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });
  const url = new URL(request.url);
  const relatedType = url.searchParams.get("relatedType");
  const relatedId = url.searchParams.get("relatedId");
  const where = relatedType && relatedId ? { relatedType, relatedId } : undefined;
  const attachments = await prisma.orderAttachment.findMany({ where, orderBy: { uploadedAt: "desc" } });
  return NextResponse.json(attachments);
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });
  const body = (await request.json()) as AttachmentPayload;
  const data = buildAttachment(body);
  if (!data.relatedId || !data.fileName || !data.fileUrl) {
    return NextResponse.json({ error: "الرابط والاسم والكيان المرتبط مطلوبة." }, { status: 400 });
  }
  const attachment = await prisma.orderAttachment.create({
    data: { ...data, uploadedBy: session.user.email ?? null },
  });
  return NextResponse.json(attachment);
}
