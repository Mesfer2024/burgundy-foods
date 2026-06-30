import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const orderStatuses = ["NEW", "REVIEW", "APPROVED", "READY", "DELIVERED", "CANCELLED"] as const;

type OrderStatusValue = (typeof orderStatuses)[number];
type OrderItemPayload = {
  productId?: unknown;
  quantity?: unknown;
};
type OrderPayload = {
  customerId?: unknown;
  status?: unknown;
  notes?: unknown;
  items?: unknown;
};

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session;
}

function textValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown) {
  const text = textValue(value);
  return text.length > 0 ? text : null;
}

function normalizeStatus(value: unknown): OrderStatusValue {
  return orderStatuses.includes(value as OrderStatusValue) ? (value as OrderStatusValue) : "NEW";
}

function normalizeItems(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item: OrderItemPayload) => ({
      productId: textValue(item.productId),
      quantity: Math.max(0, Math.round(Number(item.quantity) || 0)),
    }))
    .filter((item) => item.productId && item.quantity > 0);
}

export async function GET() {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { customer: true, items: { include: { product: true } } },
  });
  return NextResponse.json(orders);
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });
  const body = (await request.json()) as OrderPayload;
  const customerId = textValue(body.customerId);
  const requestedItems = normalizeItems(body.items);

  if (!customerId || requestedItems.length === 0) {
    return NextResponse.json({ error: "اختر عميلاً ومنتجاً واحداً على الأقل." }, { status: 400 });
  }

  const productIds = requestedItems.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, active: true },
    select: { id: true, cartonSale: true },
  });
  const priceByProductId = new Map(products.map((product) => [product.id, product.cartonSale]));
  const orderItems = requestedItems
    .map((item) => {
      const unitPrice = priceByProductId.get(item.productId);
      if (unitPrice === undefined) return null;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        totalPrice: item.quantity * unitPrice,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (orderItems.length === 0) {
    return NextResponse.json({ error: "المنتجات المختارة غير متاحة." }, { status: 400 });
  }

  const totalAmount = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const order = await prisma.order.create({
    data: {
      customer: { connect: { id: customerId } },
      status: normalizeStatus(body.status),
      totalAmount,
      notes: optionalText(body.notes),
      items: {
        create: orderItems.map((item) => ({
          product: { connect: { id: item.productId } },
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        })),
      },
    },
    include: { customer: true, items: { include: { product: true } } },
  });
  return NextResponse.json(order);
}
