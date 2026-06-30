"use client";

import { useMemo, useState } from "react";
import { ArrowRightLeft, Plus, Save, Trash2, X } from "lucide-react";

type Customer = { id: string; name: string; companyName: string | null };
type Product = { id: string; nameAr: string; nameEn: string };

type QuotationLine = {
  productId: string;
  quantity: number;
  quantityType: string;
  unitPriceBeforeVat: number;
  discountAmount: number;
  notes: string | null;
};

type Quotation = {
  id: string;
  quotationNumber: string;
  customerId: string;
  customer: Customer;
  issueDate: string | Date;
  expiryDate: string | Date | null;
  status: string;
  notes: string | null;
  subtotalBeforeVat: number;
  discountAmount: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  lines: (QuotationLine & { id: string })[];
};

const QTY_TYPES = ["unit", "carton", "pallet", "container"] as const;
const QTY_TYPE_LABEL_AR: Record<(typeof QTY_TYPES)[number], string> = {
  unit: "وحدة",
  carton: "كرتون",
  pallet: "طبلية",
  container: "كونتينر",
};
const STATUSES = ["draft", "sent", "accepted", "rejected", "expired"] as const;

const emptyLine = (): QuotationLine => ({
  productId: "",
  quantity: 1,
  quantityType: "carton",
  unitPriceBeforeVat: 0,
  discountAmount: 0,
  notes: "",
});

function formatDate(value: string | Date | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "";
  return date.toISOString().slice(0, 10);
}

function lineTotal(line: QuotationLine): number {
  return Math.max(0, line.quantity * line.unitPriceBeforeVat - line.discountAmount);
}

function validateLine(line: QuotationLine): string | null {
  if (!line.productId) return "المنتج مطلوب";
  if (!Number.isInteger(line.quantity) || line.quantity < 1) {
    return "يجب أن تكون الكمية رقماً صحيحاً أكبر من صفر";
  }
  if (!(line.unitPriceBeforeVat > 0)) return "سعر الوحدة يجب أن يكون أكبر من صفر";
  if (line.discountAmount < 0) return "الخصم لا يمكن أن يكون سالباً";
  return null;
}

export default function QuotationsAdmin({
  initialQuotations,
  customers,
  products,
}: {
  initialQuotations: Quotation[];
  customers: Customer[];
  products: Product[];
}) {
  const [quotations, setQuotations] = useState<Quotation[]>(initialQuotations);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState("");
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [expiryDate, setExpiryDate] = useState("");
  const [statusValue, setStatusValue] = useState("draft");
  const [headerDiscount, setHeaderDiscount] = useState(0);
  const [vatRate, setVatRate] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<QuotationLine[]>([emptyLine()]);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState<string | null>(null);

  const totals = useMemo(() => {
    const subtotal = lines.reduce((sum, line) => sum + lineTotal(line), 0);
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
    setIssueDate(new Date().toISOString().slice(0, 10));
    setExpiryDate("");
    setStatusValue("draft");
    setHeaderDiscount(0);
    setVatRate("");
    setNotes("");
    setLines([emptyLine()]);
  }

  function handleEdit(quotation: Quotation) {
    setEditingId(quotation.id);
    setCustomerId(quotation.customerId);
    setIssueDate(formatDate(quotation.issueDate));
    setExpiryDate(formatDate(quotation.expiryDate));
    setStatusValue(quotation.status);
    setHeaderDiscount(quotation.discountAmount);
    setVatRate(quotation.vatRate || "");
    setNotes(quotation.notes ?? "");
    setLines(
      quotation.lines.map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
        quantityType: l.quantityType,
        unitPriceBeforeVat: l.unitPriceBeforeVat,
        discountAmount: l.discountAmount,
        notes: l.notes ?? "",
      })),
    );
    setStatus(null);
  }

  function updateLine(index: number, patch: Partial<QuotationLine>) {
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

    for (let i = 0; i < lines.length; i++) {
      const err = validateLine(lines[i]);
      if (err) {
        setStatus(`السطر ${i + 1}: ${err}`);
        return;
      }
    }

    setSaving(true);
    const url = editingId ? `/api/admin/quotations/${editingId}` : "/api/admin/quotations";
    const method = editingId ? "PATCH" : "POST";
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId,
        issueDate,
        expiryDate: expiryDate || null,
        status: statusValue,
        discountAmount: headerDiscount,
        vatRate: vatRate === "" ? null : vatRate,
        notes,
        lines,
      }),
    });
    if (response.ok) {
      const data = await response.json();
      if (editingId) {
        setQuotations((current) => current.map((q) => (q.id === data.id ? data : q)));
        setStatus(`تم تحديث ${data.quotationNumber}.`);
      } else {
        setQuotations((current) => [data, ...current]);
        setStatus(`تم حفظ ${data.quotationNumber}.`);
      }
      resetForm();
    } else {
      const err = await response.json().catch(() => null);
      setStatus(err?.error ?? "تعذر حفظ عرض السعر.");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("حذف هذا العرض؟ إذا كان مرتبطاً بأمر بيع سيُحال إلى منتهي الصلاحية.")) return;
    const response = await fetch(`/api/admin/quotations/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setStatus("تعذر حذف العرض.");
      return;
    }
    const data = await response.json();
    if (data.archived && data.quotation) {
      setQuotations((current) => current.map((q) => (q.id === id ? { ...q, ...data.quotation } : q)));
      setStatus("تم تعيين العرض كمنتهي الصلاحية بدلاً من حذفه.");
    } else {
      setQuotations((current) => current.filter((q) => q.id !== id));
      setStatus("تم حذف العرض.");
    }
  }

  async function handleConvert(id: string) {
    setConverting(id);
    const response = await fetch(`/api/admin/quotations/${id}/convert`, { method: "POST" });
    setConverting(null);
    if (!response.ok) {
      const err = await response.json().catch(() => null);
      setStatus(err?.error ?? "تعذر تحويل العرض إلى أمر بيع.");
      return;
    }
    const order = await response.json();
    setQuotations((current) =>
      current.map((q) => (q.id === id ? { ...q, status: q.status === "draft" || q.status === "sent" ? "accepted" : q.status } : q)),
    );
    setStatus(`تم إنشاء أمر البيع ${order.salesOrderNumber}.`);
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="data-card space-y-6 p-8" noValidate>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">{editingId ? "تعديل عرض السعر" : "إنشاء عرض سعر"}</h2>
            <p className="mt-2 text-sm text-muted">
              الرقم التسلسلي يُولّد تلقائياً بصيغة <span dir="ltr">Q-YYYY-0001</span>. الكميات للجملة يجب أن تكون أعداداً صحيحة موجبة (1 أو أكثر).
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
              <X className="h-4 w-4" aria-hidden="true" />
              إلغاء
            </button>
          ) : null}
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <label className="space-y-2 text-sm text-foreground">
            العميل
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              required
              className="w-full rounded-3xl border border-border bg-background px-4 py-3"
            >
              <option value="">— اختر العميل —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName ? `${c.companyName} — ${c.name}` : c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm text-foreground">
            الحالة
            <select
              value={statusValue}
              onChange={(e) => setStatusValue(e.target.value)}
              className="w-full rounded-3xl border border-border bg-background px-4 py-3"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm text-foreground">
            تاريخ الإصدار
            <input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              required
              className="w-full rounded-3xl border border-border bg-background px-4 py-3"
            />
          </label>
          <label className="space-y-2 text-sm text-foreground">
            تاريخ انتهاء الصلاحية
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full rounded-3xl border border-border bg-background px-4 py-3"
            />
          </label>
          <label className="space-y-2 text-sm text-foreground">
            خصم على الإجمالي (ر.س)
            <input
              type="number"
              min="0"
              step="0.01"
              value={headerDiscount}
              onChange={(e) => setHeaderDiscount(Number(e.target.value))}
              className="w-full rounded-3xl border border-border bg-background px-4 py-3"
            />
          </label>
          <label className="space-y-2 text-sm text-foreground">
            نسبة الضريبة (٪) — اتركها فارغة لاستخدام الإعداد الافتراضي
            <input
              type="number"
              min="0"
              step="0.01"
              value={vatRate}
              onChange={(e) => setVatRate(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full rounded-3xl border border-border bg-background px-4 py-3"
            />
          </label>
          <label className="space-y-2 text-sm text-foreground lg:col-span-2">
            ملاحظات
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-3xl border border-border bg-background px-4 py-3"
            />
          </label>
        </div>

        <div className="space-y-4 border-t border-border pt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">بنود عرض السعر</h3>
            <button
              type="button"
              onClick={() => setLines((current) => [...current, emptyLine()])}
              className="inline-flex items-center gap-2 rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              إضافة بند
            </button>
          </div>

          <div className="space-y-3">
            {lines.map((line, index) => {
              const total = lineTotal(line);
              return (
                <fieldset key={index} className="rounded-lg border border-border bg-background p-4">
                  <legend className="px-2 text-xs font-semibold text-primary">السطر {index + 1}</legend>
                  <div className="grid gap-4 lg:grid-cols-[2.4fr_0.9fr_0.7fr_1.1fr_0.9fr_0.9fr_auto]">
                    <label className="flex flex-col gap-1 text-xs font-medium text-foreground">
                      المنتج
                      <select
                        value={line.productId}
                        onChange={(e) => updateLine(index, { productId: e.target.value })}
                        required
                        className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
                      >
                        <option value="">— اختر —</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nameAr}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="flex flex-col gap-1 text-xs font-medium text-foreground">
                      نوع الكمية
                      <select
                        value={line.quantityType}
                        onChange={(e) => updateLine(index, { quantityType: e.target.value })}
                        className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
                      >
                        {QTY_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {QTY_TYPE_LABEL_AR[t]}
                          </option>
                        ))}
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
                          // Coerce to integer; empty string → 0 so the validator catches it.
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

                    <label className="flex flex-col gap-1 text-xs font-medium text-foreground">
                      خصم البند
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.discountAmount}
                        onChange={(e) => updateLine(index, { discountAmount: Number(e.target.value) })}
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
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </fieldset>
              );
            })}
          </div>
        </div>

        <div className="grid gap-2 rounded-lg border border-border bg-background p-4 text-sm text-foreground sm:grid-cols-2 lg:grid-cols-4">
          <p>
            الإجمالي قبل الخصم والضريبة:{" "}
            <strong dir="ltr">{totals.subtotalBeforeDiscount.toFixed(2)} ر.س</strong>
          </p>
          <p>
            الخصم: <strong dir="ltr">{totals.discount.toFixed(2)} ر.س</strong>
          </p>
          <p>
            الضريبة: <strong dir="ltr">{totals.vat.toFixed(2)} ر.س</strong>
          </p>
          <p>
            الإجمالي النهائي: <strong dir="ltr">{totals.total.toFixed(2)} ر.س</strong>
          </p>
          <p className="text-xs text-muted sm:col-span-2 lg:col-span-4">
            القيم النهائية تُحسب على الخادم وفقاً لإعداد VAT في إعدادات الشركة.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white disabled:opacity-70"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {saving ? "جاري الحفظ..." : editingId ? "تحديث العرض" : "حفظ العرض"}
          </button>
          {status ? <p className="text-sm text-muted">{status}</p> : null}
        </div>
      </form>

      <div className="data-card p-8">
        <h2 className="text-2xl font-semibold text-foreground">عروض الأسعار</h2>
        <div className="mt-6 grid gap-3">
          {quotations.length === 0 ? (
            <p className="text-sm text-muted">لا توجد عروض بعد.</p>
          ) : (
            quotations.map((q) => (
              <div key={q.id} className="rounded-lg border border-border bg-background p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">
                      <span dir="ltr" className="inline-block">
                        {q.quotationNumber}
                      </span>
                      <span className="mx-2 text-muted">—</span>
                      {q.customer.companyName || q.customer.name}
                    </p>
                    <p className="text-xs text-muted">
                      <span dir="ltr">{formatDate(q.issueDate)}</span> • {q.lines.length} بند • الإجمالي{" "}
                      <span dir="ltr">{q.totalAmount.toFixed(2)} ر.س</span>
                    </p>
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      {q.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(q)}
                      className="rounded-full border border-primary px-3 py-1.5 text-xs font-semibold text-primary"
                    >
                      تعديل
                    </button>
                    <button
                      type="button"
                      disabled={converting === q.id}
                      onClick={() => handleConvert(q.id)}
                      className="inline-flex items-center gap-1 rounded-full border border-emerald-500 px-3 py-1.5 text-xs font-semibold text-emerald-700 disabled:opacity-60"
                    >
                      <ArrowRightLeft className="h-3.5 w-3.5" aria-hidden="true" />
                      {converting === q.id ? "..." : "تحويل لأمر بيع"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(q.id)}
                      className="rounded-full border border-red-400 px-3 py-1.5 text-xs font-semibold text-red-600"
                    >
                      حذف
                    </button>
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
