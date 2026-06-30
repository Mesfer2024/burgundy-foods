import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const orderStatuses = ["NEW", "REVIEW", "APPROVED", "READY", "DELIVERED", "CANCELLED"] as const;

type OrderStatusValue = (typeof orderStatuses)[number];
type OrderUpdatePayload = {
  status?: unknown;
  notes?: unknown;
};

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session;
}

function normalizeStatus(value: unknown): OrderStatusValue | null {
  return orderStatuses.includes(value as OrderStatusValue) ? (value as OrderStatusValue) : null;
}

function optionalText(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function GET(_request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });
  const { orderId } = await params;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { customer: true, items: { include: { product: true } } },
  });
  if (!order) return new NextResponse(null, { status: 404 });
  return NextResponse.json(order);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });
  const { orderId } = await params;
  const body = (await request.json()) as OrderUpdatePayload;
  const status = normalizeStatus(body.status);
  const notes = optionalText(body.notes);

  if (!status && notes === undefined) {
    return NextResponse.json({ error: "لا توجد بيانات صالحة للتحديث." }, { status: 400 });
  }

  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      ...(status ? { status } : {}),
      ...(notes !== undefined ? { notes } : {}),
    },
    include: { customer: true, items: { include: { product: true } } },
  });
  return NextResponse.json(order);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });
  const { orderId } = await params;
  await prisma.order.delete({ where: { id: orderId } });
  return NextResponse.json({ success: true });
}
