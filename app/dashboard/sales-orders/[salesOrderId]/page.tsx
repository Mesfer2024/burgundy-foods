import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "—" : date.toISOString().slice(0, 10);
}

function badge(status: string) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
      {status}
    </span>
  );
}

export default async function OrderTimelinePage({ params }: { params: Promise<{ salesOrderId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/signin");
  const { salesOrderId } = await params;

  const salesOrder = await prisma.salesOrder.findUnique({
    where: { id: salesOrderId },
    include: {
      customer: true,
      quotation: { include: { lines: { include: { product: { select: { nameAr: true } } } } } },
      lines: { include: { product: { select: { nameAr: true } } } },
      deliveryNotes: {
        orderBy: { deliveryDate: "asc" },
        include: { lines: { include: { product: { select: { nameAr: true } } } } },
      },
      invoices: {
        orderBy: { invoiceDate: "asc" },
        include: {
          lines: { include: { product: { select: { nameAr: true } } } },
          payments: { orderBy: { paymentDate: "asc" } },
        },
      },
    },
  });
  if (!salesOrder) notFound();

  const relatedIds = [
    salesOrder.quotation && { type: "quotation" as const, id: salesOrder.quotation.id },
    { type: "sales_order" as const, id: salesOrder.id },
    ...salesOrder.deliveryNotes.map((n) => ({ type: "delivery_note" as const, id: n.id })),
    ...salesOrder.invoices.map((i) => ({ type: "invoice" as const, id: i.id })),
    ...salesOrder.invoices.flatMap((i) => i.payments.map((p) => ({ type: "payment" as const, id: p.id }))),
  ].filter((entry): entry is { type: "quotation" | "sales_order" | "delivery_note" | "invoice" | "payment"; id: string } => Boolean(entry));

  const attachments = relatedIds.length > 0
    ? await prisma.orderAttachment.findMany({
        where: { OR: relatedIds.map((entry) => ({ relatedType: entry.type, relatedId: entry.id })) },
        orderBy: { uploadedAt: "desc" },
      })
    : [];

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/sales-orders" className="text-xs text-muted hover:text-primary">← العودة إلى أوامر البيع</Link>
          <h1 className="mt-2 text-3xl font-semibold text-foreground">الجدول الزمني للطلب {salesOrder.salesOrderNumber}</h1>
          <p className="mt-1 text-sm text-muted">العميل: {salesOrder.customer.companyName || salesOrder.customer.name}</p>
        </div>
      </div>

      <div className="data-card space-y-6 p-8">
        {/* Quotation */}
        <div className="border-l-4 border-primary pl-4">
          <h2 className="text-lg font-semibold text-foreground">١. عرض السعر</h2>
          {salesOrder.quotation ? (
            <div className="mt-2 space-y-1 text-sm text-muted">
              <p><strong className="text-foreground">{salesOrder.quotation.quotationNumber}</strong> • {formatDate(salesOrder.quotation.issueDate)} • {badge(salesOrder.quotation.status)}</p>
              <p>الإجمالي: {salesOrder.quotation.totalAmount.toFixed(2)} ر.س • {salesOrder.quotation.lines.length} بند</p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted">لم يبدأ هذا الأمر من عرض سعر.</p>
          )}
        </div>

        {/* Sales Order */}
        <div className="border-l-4 border-emerald-500 pl-4">
          <h2 className="text-lg font-semibold text-foreground">٢. أمر البيع</h2>
          <div className="mt-2 space-y-1 text-sm text-muted">
            <p><strong className="text-foreground">{salesOrder.salesOrderNumber}</strong> • {formatDate(salesOrder.orderDate)} • {badge(salesOrder.status)}</p>
            <p>الإجمالي: {salesOrder.totalAmount.toFixed(2)} ر.س • {salesOrder.lines.length} بند • التسليم المتوقع: {formatDate(salesOrder.expectedDeliveryDate)}</p>
            <ul className="mt-2 list-inside list-disc text-xs">
              {salesOrder.lines.map((line) => (
                <li key={line.id}>{line.product.nameAr} — {line.quantity} {line.quantityType} × {line.unitPriceBeforeVat.toFixed(2)} = {line.lineTotalBeforeVat.toFixed(2)} ر.س</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Delivery Notes */}
        <div className="border-l-4 border-amber-500 pl-4">
          <h2 className="text-lg font-semibold text-foreground">٣. سندات التسليم</h2>
          {salesOrder.deliveryNotes.length === 0 ? (
            <p className="mt-2 text-sm text-muted">لم يتم إصدار سند تسليم بعد.</p>
          ) : (
            <div className="mt-2 space-y-3">
              {salesOrder.deliveryNotes.map((note) => (
                <div key={note.id} className="rounded-lg border border-border bg-background p-3 text-sm">
                  <p><strong className="text-foreground">{note.deliveryNoteNumber}</strong> • {formatDate(note.deliveryDate)} • {badge(note.deliveryStatus)}</p>
                  <p className="text-xs text-muted">المستودع: {note.warehouseName ?? "—"} • السائق: {note.driverName ?? "—"} • المركبة: {note.vehiclePlate ?? "—"}</p>
                  <ul className="mt-2 list-inside list-disc text-xs">
                    {note.lines.map((l) => (
                      <li key={l.id}>{l.product.nameAr} — {l.quantity} {l.quantityType}{l.batchNumber ? ` • دفعة ${l.batchNumber}` : ""}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Invoices */}
        <div className="border-l-4 border-sky-500 pl-4">
          <h2 className="text-lg font-semibold text-foreground">٤. الفواتير</h2>
          {salesOrder.invoices.length === 0 ? (
            <p className="mt-2 text-sm text-muted">لم يتم إصدار فاتورة بعد.</p>
          ) : (
            <div className="mt-2 space-y-3">
              {salesOrder.invoices.map((inv) => (
                <div key={inv.id} className="rounded-lg border border-border bg-background p-3 text-sm">
                  <p><strong className="text-foreground">{inv.invoiceNumber}</strong> • {formatDate(inv.invoiceDate)} • {badge(inv.status)}</p>
                  <p className="text-xs text-muted">الإجمالي: {inv.totalAmount.toFixed(2)} ر.س • مدفوع: {inv.amountPaid.toFixed(2)} • متبقٍ: <strong>{inv.balanceDue.toFixed(2)} ر.س</strong></p>
                  {/* Payments under this invoice */}
                  {inv.payments.length > 0 ? (
                    <div className="mt-2 rounded-md bg-muted/10 p-2">
                      <p className="text-xs font-semibold text-foreground">٥. المقبوضات على هذه الفاتورة</p>
                      <ul className="mt-1 list-inside list-disc text-xs">
                        {inv.payments.map((p) => (
                          <li key={p.id}>{p.receiptNumber} • {formatDate(p.paymentDate)} • {p.amount.toFixed(2)} ر.س • {p.paymentMethod}{p.referenceNumber ? ` • مرجع ${p.referenceNumber}` : ""}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attachments */}
        <div className="border-l-4 border-purple-500 pl-4">
          <h2 className="text-lg font-semibold text-foreground">٦. المرفقات</h2>
          {attachments.length === 0 ? (
            <p className="mt-2 text-sm text-muted">لم يتم رفع مرفقات بعد. الرفع يتم من قسم المرفقات (مستقبلاً).</p>
          ) : (
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
              {attachments.map((a) => (
                <li key={a.id}>
                  <a href={a.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">{a.fileName}</a>
                  <span className="text-xs text-muted"> — {a.relatedType} • {formatDate(a.uploadedAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
