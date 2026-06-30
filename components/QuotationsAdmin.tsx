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
const STATUSES = ["draft", "sent", "accepted", "rejected", "expired"] as const;

const emptyLine = (): QuotationLine => ({
  productId: "",
  quantity: 0,
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
    const subtotal = lines.reduce((sum, line) => sum + Math.max(0, line.quantity * line.unitPriceBeforeVat - line.discountAmount), 0);
    const taxable = Math.max(0, subtotal - headerDiscount);
    const rate = vatRate === "" ? 0 : vatRate;
    const vatAmount = taxable * (rate / 100);
    return { subtotal, vatAmount, total: taxable + vatAmount };
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
    setLines(quotation.lines.map((l) => ({
      productId: l.productId,
      quantity: l.quantity,
      quantityType: l.quantityType,
      unitPriceBeforeVat: l.unitPriceBeforeVat,
      discountAmount: l.discountAmount,
      notes: l.notes ?? "",
    })));
    setStatus(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus(null);
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
        lines: lines.filter((l) => l.productId && l.quantity > 0),
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
      <form onSubmit={handleSubmit} className="data-card space-y-6 p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">{editingId ? "تعديل عرض السعر" : "إنشاء عرض سعر"}</h2>
            <p className="mt-2 text-sm text-muted">الرقم التسلسلي يُولّد تلقائياً بصيغة Q-YYYY-0001.</p>
          </div>
          {editingId ? (
            <button type="button" onClick={() => { resetForm(); setStatus(null); }} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm">
              <X className="h-4 w-4" aria-hidden="true" />
              إلغاء
            </button>
          ) : null}
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <label className="space-y-2 text-sm text-foreground">
            العميل
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required className="w-full rounded-3xl border border-border bg-background px-4 py-3">
              <option value="">— اختر العميل —</option>
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
            تاريخ الإصدار
            <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} required className="w-full rounded-3xl border border-border bg-background px-4 py-3" />
          </label>
          <label className="space-y-2 text-sm text-foreground">
            تاريخ انتهاء الصلاحية
            <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="w-full rounded-3xl border border-border bg-background px-4 py-3" />
          </label>
          <label className="space-y-2 text-sm text-foreground">
            خصم على الإجمالي (ر.س)
            <input type="number" min="0" step="0.01" value={headerDiscount} onChange={(e) => setHeaderDiscount(Number(e.target.value))} className="w-full rounded-3xl border border-border bg-background px-4 py-3" />
          </label>
          <label className="space-y-2 text-sm text-foreground">
            نسبة الضريبة (٪) — اتركها فارغة لاستخدام الإعداد الافتراضي
            <input type="number" min="0" step="0.01" value={vatRate} onChange={(e) => setVatRate(e.target.value === "" ? "" : Number(e.target.value))} className="w-full rounded-3xl border border-border bg-background px-4 py-3" />
          </label>
          <label className="space-y-2 text-sm text-foreground lg:col-span-2">
            ملاحظات
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full rounded-3xl border border-border bg-background px-4 py-3" />
          </label>
        </div>

        <div className="space-y-3 border-t border-border pt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">بنود عرض السعر</h3>
            <button type="button" onClick={() => setLines((current) => [...current, emptyLine()])} className="inline-flex items-center gap-2 rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary">
              <Plus className="h-4 w-4" aria-hidden="true" />
              إضافة بند
            </button>
          </div>
          <div className="grid gap-3">
            {lines.map((line, index) => (
              <div key={index} className="rounded-lg border border-border bg-background p-4">
                <div className="grid gap-3 lg:grid-cols-12">
                  <select value={line.productId} onChange={(e) => setLines((current) => current.map((l, i) => i === index ? { ...l, productId: e.target.value } : l))} required className="lg:col-span-4 rounded-xl border border-border bg-background px-3 py-2 text-sm">
                    <option value="">— المنتج —</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.nameAr}</option>)}
                  </select>
                  <input type="number" min="0" step="0.01" placeholder="الكمية" value={line.quantity} onChange={(e) => setLines((current) => current.map((l, i) => i === index ? { ...l, quantity: Number(e.target.value) } : l))} className="lg:col-span-2 rounded-xl border border-border bg-background px-3 py-2 text-sm" />
                  <select value={line.quantityType} onChange={(e) => setLines((current) => current.map((l, i) => i === index ? { ...l, quantityType: e.target.value } : l))} className="lg:col-span-1 rounded-xl border border-border bg-background px-3 py-2 text-sm">
                    {QTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input type="number" min="0" step="0.01" placeholder="سعر الوحدة قبل الضريبة" value={line.unitPriceBeforeVat} onChange={(e) => setLines((current) => current.map((l, i) => i === index ? { ...l, unitPriceBeforeVat: Number(e.target.value) } : l))} className="lg:col-span-2 rounded-xl border border-border bg-background px-3 py-2 text-sm" />
                  <input type="number" min="0" step="0.01" placeholder="خصم البند" value={line.discountAmount} onChange={(e) => setLines((current) => current.map((l, i) => i === index ? { ...l, discountAmount: Number(e.target.value) } : l))} className="lg:col-span-2 rounded-xl border border-border bg-background px-3 py-2 text-sm" />
                  <button type="button" onClick={() => setLines((current) => current.filter((_, i) => i !== index))} className="lg:col-span-1 inline-flex items-center justify-center rounded-xl border border-red-400 px-2 py-2 text-red-600">
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-2 rounded-lg border border-border bg-background p-4 text-sm text-foreground sm:grid-cols-3">
          <p>الإجمالي قبل الخصم والضريبة: <strong>{totals.subtotal.toFixed(2)} ر.س</strong></p>
          <p>الضريبة المحسوبة: <strong>{totals.vatAmount.toFixed(2)} ر.س</strong></p>
          <p>الإجمالي المتوقع: <strong>{totals.total.toFixed(2)} ر.س</strong></p>
          <p className="text-xs text-muted sm:col-span-3">القيم النهائية تُحسب على الخادم وفقاً لإعداد VAT في إعدادات الشركة.</p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button type="submit" disabled={saving} className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white disabled:opacity-70">
            <Save className="h-4 w-4" aria-hidden="true" />
            {saving ? "جاري الحفظ..." : editingId ? "تحديث العرض" : "حفظ العرض"}
          </button>
          {status ? <p className="text-sm text-muted">{status}</p> : null}
        </div>
      </form>

      <div className="data-card p-8">
        <h2 className="text-2xl font-semibold text-foreground">عروض الأسعار</h2>
        <div className="mt-6 grid gap-3">
          {quotations.length === 0 ? <p className="text-sm text-muted">لا توجد عروض بعد.</p> : (
            quotations.map((q) => (
              <div key={q.id} className="rounded-lg border border-border bg-background p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">{q.quotationNumber} — {q.customer.companyName || q.customer.name}</p>
                    <p className="text-xs text-muted">{formatDate(q.issueDate)} • {q.lines.length} بند • الإجمالي {q.totalAmount.toFixed(2)} ر.س</p>
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{q.status}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => handleEdit(q)} className="rounded-full border border-primary px-3 py-1.5 text-xs font-semibold text-primary">تعديل</button>
                    <button type="button" disabled={converting === q.id} onClick={() => handleConvert(q.id)} className="inline-flex items-center gap-1 rounded-full border border-emerald-500 px-3 py-1.5 text-xs font-semibold text-emerald-700 disabled:opacity-60">
                      <ArrowRightLeft className="h-3.5 w-3.5" aria-hidden="true" />
                      {converting === q.id ? "..." : "تحويل لأمر بيع"}
                    </button>
                    <button type="button" onClick={() => handleDelete(q.id)} className="rounded-full border border-red-400 px-3 py-1.5 text-xs font-semibold text-red-600">حذف</button>
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
