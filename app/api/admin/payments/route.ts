import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { buildPaymentReceipt, type PaymentReceiptPayload } from "@/lib/orderPayloads";
import { round2 } from "@/lib/orderMath";
import { nextSequenceNumber } from "@/lib/sequenceNumber";

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

export async function GET() {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });
  const payments = await prisma.paymentReceipt.findMany({
    orderBy: { paymentDate: "desc" },
    include: {
      customer: { select: { id: true, name: true, companyName: true } },
      invoice: { select: { id: true, invoiceNumber: true, totalAmount: true, balanceDue: true } },
    },
  });
  return NextResponse.json(payments);
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session) return new NextResponse(null, { status: 401 });
  const body = (await request.json()) as PaymentReceiptPayload;
  const data = buildPaymentReceipt(body);
  if (!data.customerId) return NextResponse.json({ error: "العميل مطلوب." }, { status: 400 });
  if (data.amount <= 0) return NextResponse.json({ error: "المبلغ يجب أن يكون أكبر من صفر." }, { status: 400 });

  const receiptNumber = await nextSequenceNumber("paymentReceipt");
  const actor = session.user.email ?? null;

  const payment = await prisma.paymentReceipt.create({
    data: {
      receiptNumber,
      invoiceId: data.invoiceId,
      customerId: data.customerId,
      paymentDate: data.paymentDate,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      bankAccount: data.bankAccount,
      referenceNumber: data.referenceNumber,
      notes: data.notes,
      createdBy: actor,
      updatedBy: actor,
    },
    include: { customer: true, invoice: true },
  });

  if (data.invoiceId) {
    await recomputeInvoiceBalance(data.invoiceId, actor);
  }

  return NextResponse.json(payment);
}
