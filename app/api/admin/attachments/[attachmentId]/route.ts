import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session;
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ attachmentId: string }> }) {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });
  const { attachmentId } = await params;
  await prisma.orderAttachment.delete({ where: { id: attachmentId } });
  return NextResponse.json({ success: true });
}
