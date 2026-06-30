"use client";

import { useMemo, useState } from "react";
import { Plus, Save, Trash2, X } from "lucide-react";

type Customer = { id: string; name: string; companyName: string | null };
type Product = { id: string; nameAr: string; nameEn: string };
type SalesOrderOption = { id: string; salesOrderNumber: string; customerId: string };
type DeliveryNoteOption = { id: string; deliveryNoteNumber: string };

type InvoiceLine = {
  productId: string;
  quantity: number;
  quantityType: string;
  unitPriceBeforeVat: number;
  notes: string;
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customer: Customer;
  salesOrder: { id: string; salesOrderNumber: string } | null;
  deliveryNote: { id: string; deliveryNoteNumber: string } | null;
  invoiceDate: string | Date;
  dueDate: string | Date | null;
  status: string;
  discountAmount: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  notes: string | null;
  lines: (InvoiceLine & { id: string })[];
  payments: { id: string; amount: number; paymentDate: string | Date }[];
};

const QTY_TYPES = ["unit", "carton", "pallet", "container"] as const;
const QTY_TYPE_LABEL_AR: Record<(typeof QTY_TYPES)[number], string> = {
  unit: "وحدة",
  carton: "كرتون",
  pallet: "طبلية",
  container: "كونتينر",
};
const STATUSES = ["draft", "issued", "partially_paid", "paid", "cancelled"] as const;

const emptyLine = (): InvoiceLine => ({
  productId: "",
  quantity: 1,
  quantityType: "carton",
  unitPriceBeforeVat: 0,
  notes: "",
});

function formatDate(value: string | Date | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "" : date.toISOString().slice(0, 10);
}

function lineTotal(line: InvoiceLine): number {
  return Math.max(0, line.quantity * line.unitPriceBeforeVat);
}

function validateLine(line: InvoiceLine): string | null {
  if (!line.productId) return "المنتج مطلوب";
  if (!Number.isInteger(line.quantity) || line.quantity < 1) {
    return "يجب أن تكون الكمية رقماً صحيحاً أكبر من صفر";
  }
  if (!(line.unitPriceBeforeVat > 0)) return "سعر الوحدة يجب أن يكون أكبر من صفر";
  return null;
}

export default function InvoicesAdmin({
  initialInvoices,
  customers,
  products,
  salesOrders,
  deliveryNotes,
}: {
  initialInvoices: Invoice[];
  customers: Customer[];
  products: Product[];
  salesOrders: SalesOrderOption[];
  deliveryNotes: DeliveryNoteOption[];
}) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState("");
  const [salesOrderId, setSalesOrderId] = useState("");
  const [deliveryNoteId, setDeliveryNoteId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [statusValue, setStatusValue] = useState("draft");
  const [headerDiscount, setHeaderDiscount] = useState(0);
  const [vatRate, setVatRate] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<InvoiceLine[]>([emptyLine()]);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const totals = useMemo(() => {
    const subtotal = lines.reduce((s, l) => s + lineTotal(l), 0);
    const taxable = Math.max(0, subtotal - headerDiscount);
    const rate = vatRate === "" ? 0 : vatRate;
    const vatAmount = taxable * (rate / 100);
    return {
      subtotalBeforeDiscount: subtotal,
      discount: headerDiscount,
      vat: vatAmount,
      total: taxable + vatAmount,
    };
  }, [lines, headerDiscount, vatRate]);

  function resetForm() {
    setEditingId(null);
    setCustomerId("");
    setSalesOrderId("");
    setDeliveryNoteId("");
    setInvoiceDate(new Date().toISOString().slice(0, 10));
    setDueDate("");
    setStatusValue("draft");
    setHeaderDiscount(0);
    setVatRate("");
    setNotes("");
    setLines([emptyLine()]);
  }

  function handleEdit(invoice: Invoice) {
    setEditingId(invoice.id);
    setCustomerId(invoice.customerId);
    setSalesOrderId(invoice.salesOrder?.id ?? "");
    setDeliveryNoteId(invoice.deliveryNote?.id ?? "");
    setInvoiceDate(formatDate(invoice.invoiceDate));
    setDueDate(formatDate(invoice.dueDate));
    setStatusValue(invoice.status);
    setHeaderDiscount(invoice.discountAmount);
    setVatRate(invoice.vatRate || "");
    setNotes(invoice.notes ?? "");
    setLines(
      invoice.lines.map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
        quantityType: l.quantityType,
        unitPriceBeforeVat: l.unitPriceBeforeVat,
        notes: l.notes ?? "",
      })),
    );
    setStatus(null);
  }

  function updateLine(index: number, patch: Partial<InvoiceLine>) {
    setLines((current) => current.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  function removeLine(index: number) {
    setLines((current) => (current.length === 1 ? current : current.filter((_, i) => i !== index)));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    if (!customerId) {
      setStatus("اختر العميل قبل الحفظ.");
      return;
    }
    if (headerDiscount < 0) {
      setStatus("الخصم لا يمكن أن يكون سالباً.");
      return;
    }
    for (let i = 0; i < lines.length; i++) {
      const err = validateLine(lines[i]);
      if (err) {
        setStatus(`السطر ${i + 1}: ${err}`);
        return;
      }
    }

    setSaving(true);
    const url = editingId ? `/api/admin/invoices/${editingId}` : "/api/admin/invoices";
    const method = editingId ? "PATCH" : "POST";
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId,
        salesOrderId: salesOrderId || null,
        deliveryNoteId: deliveryNoteId || null,
        invoiceDate,
        dueDate: dueDate || null,
        status: statusValue,
        discountAmount: headerDiscount,
        vatRate: vatRate === "" ? null : vatRate,
        notes,
        lines,
      }),
    });
    if (response.ok) {
      const data = await response.json();
      if (editingId) setInvoices((c) => c.map((i) => (i.id === data.id ? data : i)));
      else setInvoices((c) => [data, ...c]);
      setStatus(`تم حفظ ${data.invoiceNumber}.`);
      resetForm();
    } else {
      const err = await response.json().catch(() => null);
      setStatus(err?.error ?? "تعذر حفظ الفاتورة.");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("حذف الفاتورة؟")) return;
    const response = await fetch(`/api/admin/invoices/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setStatus("تعذر حذف الفاتورة.");
      return;
    }
    const data = await response.json();
    if (data.archived && data.invoice) {
      setInvoices((c) => c.map((i) => (i.id === id ? { ...i, ...data.invoice } : i)));
      setStatus("تم تعيين الفاتورة كملغاة.");
    } else {
      setInvoices((c) => c.filter((i) => i.id !== id));
      setStatus("تم حذف الفاتورة.");
    }
  }

  function handleSalesOrderChange(value: string) {
    setSalesOrderId(value);
    const order = salesOrders.find((o) => o.id === value);
    if (order) setCustomerId(order.customerId);
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="data-card space-y-6 p-8" noValidate>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">{editingId ? "تعديل فاتورة" : "إنشاء فاتورة"}</h2>
            <p className="mt-2 text-sm text-muted">
              رقم تسلسلي تلقائي <span dir="ltr">INV-YYYY-0001</span>. سجل داخلي — ليس فاتورة ZATCA معتمدة بعد. الكميات يجب أن تكون أعداداً صحيحة موجبة.
            </p>
          </div>
          {editingId ? (
            <button
              type="button"
              onClick={() => {
                resetForm();
                setStatus(null);
              }}
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm"
            >
              <X className="h-4 w-4" />إلغاء
            </button>
          ) : null}
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <label className="space-y-2 text-sm text-foreground">
            العميل
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required className="w-full rounded-3xl border border-border bg-background px-4 py-3">
              <option value="">— اختر —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.companyName ? `${c.companyName} — ${c.name}` : c.name}</option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm text-foreground">
            الحالة
            <select value={statusValue} onChange={(e) => setStatusValue(e.target.value)} className="w-full rounded-3xl border border-border bg-background px-4 py-3">
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="space-y-2 text-sm text-foreground">
            أمر بيع مرتبط
            <select value={salesOrderId} onChange={(e) => handleSalesOrderChange(e.target.value)} className="w-full rounded-3xl border border-border bg-background px-4 py-3">
              <option value="">— لا يوجد —</option>
              {salesOrders.map((o) => <option key={o.id} value={o.id}>{o.salesOrderNumber}</option>)}
            </select>
          </label>
          <label className="space-y-2 text-sm text-foreground">
            سند تسليم مرتبط
            <select value={deliveryNoteId} onChange={(e) => setDeliveryNoteId(e.target.value)} className="w-full rounded-3xl border border-border bg-background px-4 py-3">
              <option value="">— لا يوجد —</option>
              {deliveryNotes.map((d) => <option key={d.id} value={d.id}>{d.deliveryNoteNumber}</option>)}
            </select>
          </label>
          <label className="space-y-2 text-sm text-foreground">
            تاريخ الفاتورة
            <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} required className="w-full rounded-3xl border border-border bg-background px-4 py-3" />
          </label>
          <label className="space-y-2 text-sm text-foreground">
            تاريخ الاستحقاق
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full rounded-3xl border border-border bg-background px-4 py-3" />
          </label>
          <label className="space-y-2 text-sm text-foreground">
            خصم على الإجمالي (ر.س)
            <input type="number" min="0" step="0.01" value={headerDiscount} onChange={(e) => setHeaderDiscount(Number(e.target.value))} className="w-full rounded-3xl border border-border bg-background px-4 py-3" />
          </label>
          <label className="space-y-2 text-sm text-foreground">
            نسبة الضريبة (٪)
            <input type="number" min="0" step="0.01" value={vatRate} onChange={(e) => setVatRate(e.target.value === "" ? "" : Number(e.target.value))} className="w-full rounded-3xl border border-border bg-background px-4 py-3" />
          </label>
          <label className="space-y-2 text-sm text-foreground lg:col-span-2">
            ملاحظات
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full rounded-3xl border border-border bg-background px-4 py-3" />
          </label>
        </div>

        <div className="space-y-4 border-t border-border pt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">بنود الفاتورة</h3>
            <button type="button" onClick={() => setLines((c) => [...c, emptyLine()])} className="inline-flex items-center gap-2 rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary">
              <Plus className="h-4 w-4" />إضافة بند
            </button>
          </div>

          {lines.map((line, index) => {
            const total = lineTotal(line);
            return (
              <fieldset key={index} className="rounded-lg border border-border bg-background p-4">
                <legend className="px-2 text-xs font-semibold text-primary">السطر {index + 1}</legend>
                <div className="grid gap-4 lg:grid-cols-[2.4fr_0.9fr_0.7fr_1.4fr_0.9fr_auto]">
                  <label className="flex flex-col gap-1 text-xs font-medium text-foreground">
                    المنتج
                    <select value={line.productId} onChange={(e) => updateLine(index, { productId: e.target.value })} required className="rounded-xl border border-border bg-background px-3 py-2 text-sm">
                      <option value="">— اختر —</option>
                      {products.map((p) => <option key={p.id} value={p.id}>{p.nameAr}</option>)}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1 text-xs font-medium text-foreground">
                    نوع الكمية
                    <select value={line.quantityType} onChange={(e) => updateLine(index, { quantityType: e.target.value })} className="rounded-xl border border-border bg-background px-3 py-2 text-sm">
                      {QTY_TYPES.map((t) => <option key={t} value={t}>{QTY_TYPE_LABEL_AR[t]}</option>)}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1 text-xs font-medium text-foreground">
                    الكمية
                    <input
                      type="number"
                      min={1}
                      step={1}
                      inputMode="numeric"
                      required
                      value={line.quantity}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const parsed = raw === "" ? 0 : Math.floor(Number(raw));
                        updateLine(index, { quantity: Number.isFinite(parsed) ? parsed : 0 });
                      }}
                      className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-xs font-medium text-foreground">
                    سعر الوحدة قبل الضريبة
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={line.unitPriceBeforeVat}
                      onChange={(e) => updateLine(index, { unitPriceBeforeVat: Number(e.target.value) })}
                      className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
                    />
                  </label>

                  <div className="flex flex-col gap-1 text-xs font-medium text-foreground">
                    إجمالي البند
                    <div dir="ltr" className="rounded-xl border border-border bg-muted/10 px-3 py-2 text-end text-sm">
                      {total.toFixed(2)}
                    </div>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeLine(index)}
                      disabled={lines.length === 1}
                      aria-label="حذف البند"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-400 text-red-600 disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </fieldset>
            );
          })}
        </div>

        <div className="grid gap-2 rounded-lg border border-border bg-background p-4 text-sm text-foreground sm:grid-cols-2 lg:grid-cols-4">
          <p>الإجمالي قبل الخصم والضريبة: <strong dir="ltr">{totals.subtotalBeforeDiscount.toFixed(2)} ر.س</strong></p>
          <p>الخصم: <strong dir="ltr">{totals.discount.toFixed(2)} ر.س</strong></p>
          <p>الضريبة: <strong dir="ltr">{totals.vat.toFixed(2)} ر.س</strong></p>
          <p>الإجمالي النهائي: <strong dir="ltr">{totals.total.toFixed(2)} ر.س</strong></p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button type="submit" disabled={saving} className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white disabled:opacity-70">
            <Save className="h-4 w-4" />{saving ? "جاري الحفظ..." : editingId ? "تحديث" : "حفظ"}
          </button>
          {status ? <p className="text-sm text-muted">{status}</p> : null}
        </div>
      </form>

      <div className="data-card p-8">
        <h2 className="text-2xl font-semibold text-foreground">الفواتير</h2>
        <div className="mt-6 grid gap-3">
          {invoices.length === 0 ? (
            <p className="text-sm text-muted">لا توجد فواتير بعد.</p>
          ) : (
            invoices.map((inv) => (
              <div key={inv.id} className="rounded-lg border border-border bg-background p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">
                      <span dir="ltr" className="inline-block">{inv.invoiceNumber}</span>
                      <span className="mx-2 text-muted">—</span>
                      {inv.customer.companyName || inv.customer.name}
                    </p>
                    <p className="text-xs text-muted">
                      <span dir="ltr">{formatDate(inv.invoiceDate)}</span> • الإجمالي{" "}
                      <span dir="ltr">{inv.totalAmount.toFixed(2)} ر.س</span> • مدفوع{" "}
                      <span dir="ltr">{inv.amountPaid.toFixed(2)}</span> • متبقٍ{" "}
                      <strong dir="ltr">{inv.balanceDue.toFixed(2)} ر.س</strong>
                    </p>
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{inv.status}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => handleEdit(inv)} className="rounded-full border border-primary px-3 py-1.5 text-xs font-semibold text-primary">تعديل</button>
                    <button type="button" onClick={() => handleDelete(inv.id)} className="rounded-full border border-red-400 px-3 py-1.5 text-xs font-semibold text-red-600">حذف</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
