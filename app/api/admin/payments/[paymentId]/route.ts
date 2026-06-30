import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { buildPaymentReceipt, type PaymentReceiptPayload } from "@/lib/orderPayloads";
import { round2 } from "@/lib/orderMath";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session;
}

async function recomputeInvoiceBalance(invoiceId: string, actor: string | null) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { payments: { select: { amount: true } } },
  });
  if (!invoice) return null;
  const amountPaid = round2(invoice.payments.reduce((sum, p) => sum + (p.amount ?? 0), 0));
  const balanceDue = round2(Math.max(0, invoice.totalAmount - amountPaid));
  let status: string = invoice.status;
  if (balanceDue <= 0 && invoice.totalAmount > 0) status = "paid";
  else if (amountPaid > 0) status = "partially_paid";
  else if (status === "partially_paid" || status === "paid") status = "issued";
  return prisma.invoice.update({
    where: { id: invoiceId },
    data: { amountPaid, balanceDue, status, updatedBy: actor },
  });
}

export async function GET(_request: Request, { params }: { params: Promise<{ paymentId: string }> }) {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });
  const { paymentId } = await params;
  const payment = await prisma.paymentReceipt.findUnique({
    where: { id: paymentId },
    include: { customer: true, invoice: true },
  });
  if (!payment) return new NextResponse(null, { status: 404 });
  return NextResponse.json(payment);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ paymentId: string }> }) {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });
  const { paymentId } = await params;
  const body = (await request.json()) as PaymentReceiptPayload;
  const data = buildPaymentReceipt(body);
  if (!data.customerId) return NextResponse.json({ error: "العميل مطلوب." }, { status: 400 });
  if (data.amount <= 0) return NextResponse.json({ error: "المبلغ يجب أن يكون أكبر من صفر." }, { status: 400 });

  const actor = session.user.email ?? null;
  const previous = await prisma.paymentReceipt.findUnique({ where: { id: paymentId }, select: { invoiceId: true } });

  const payment = await prisma.paymentReceipt.update({
    where: { id: paymentId },
    data: {
      invoiceId: data.invoiceId,
      customerId: data.customerId,
      paymentDate: data.paymentDate,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      bankAccount: data.bankAccount,
      referenceNumber: data.referenceNumber,
      notes: data.notes,
      updatedBy: actor,
    },
    include: { customer: true, invoice: true },
  });

  const invoiceIds = new Set<string>();
  if (previous?.invoiceId) invoiceIds.add(previous.invoiceId);
  if (data.invoiceId) invoiceIds.add(data.invoiceId);
  for (const id of invoiceIds) await recomputeInvoiceBalance(id, actor);

  return NextResponse.json(payment);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ paymentId: string }> }) {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });
  const { paymentId } = await params;
  const payment = await prisma.paymentReceipt.findUnique({ where: { id: paymentId }, select: { invoiceId: true } });
  await prisma.paymentReceipt.delete({ where: { id: paymentId } });
  if (payment?.invoiceId) await recomputeInvoiceBalance(payment.invoiceId, session.user.email ?? null);
  return NextResponse.json({ success: true });
}
