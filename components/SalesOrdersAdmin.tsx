"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ExternalLink, Plus, Save, Trash2, X } from "lucide-react";

type Customer = { id: string; name: string; companyName: string | null };
type Product = { id: string; nameAr: string; nameEn: string };

type SalesOrderLine = {
  productId: string;
  quantity: number;
  quantityType: string;
  unitPriceBeforeVat: number;
  notes: string | null;
};

type SalesOrder = {
  id: string;
  salesOrderNumber: string;
  customerId: string;
  customer: Customer;
  quotation: { id: string; quotationNumber: string } | null;
  orderDate: string | Date;
  expectedDeliveryDate: string | Date | null;
  status: string;
  notes: string | null;
  discountAmount: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  lines: (SalesOrderLine & { id: string })[];
};

const QTY_TYPES = ["unit", "carton", "pallet", "container"];
const STATUSES = ["draft", "confirmed", "preparing", "delivered", "cancelled"];

const emptyLine = (): SalesOrderLine => ({ productId: "", quantity: 0, quantityType: "carton", unitPriceBeforeVat: 0, notes: "" });

function formatDate(value: string | Date | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "" : date.toISOString().slice(0, 10);
}

export default function SalesOrdersAdmin({
  initialOrders,
  customers,
  products,
}: {
  initialOrders: SalesOrder[];
  customers: Customer[];
  products: Product[];
}) {
  const [orders, setOrders] = useState<SalesOrder[]>(initialOrders);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState("");
  const [orderDate, setOrderDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [statusValue, setStatusValue] = useState("draft");
  const [headerDiscount, setHeaderDiscount] = useState(0);
  const [vatRate, setVatRate] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<SalesOrderLine[]>([emptyLine()]);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const totals = useMemo(() => {
    const subtotal = lines.reduce((sum, l) => sum + Math.max(0, l.quantity * l.unitPriceBeforeVat), 0);
    const taxable = Math.max(0, subtotal - headerDiscount);
    const rate = vatRate === "" ? 0 : vatRate;
    return { subtotal, vat: taxable * (rate / 100), total: taxable + taxable * (rate / 100) };
  }, [lines, headerDiscount, vatRate]);

  function resetForm() {
    setEditingId(null);
    setCustomerId("");
    setOrderDate(new Date().toISOString().slice(0, 10));
    setExpectedDeliveryDate("");
    setStatusValue("draft");
    setHeaderDiscount(0);
    setVatRate("");
    setNotes("");
    setLines([emptyLine()]);
  }

  function handleEdit(order: SalesOrder) {
    setEditingId(order.id);
    setCustomerId(order.customerId);
    setOrderDate(formatDate(order.orderDate));
    setExpectedDeliveryDate(formatDate(order.expectedDeliveryDate));
    setStatusValue(order.status);
    setHeaderDiscount(order.discountAmount);
    setVatRate(order.vatRate || "");
    setNotes(order.notes ?? "");
    setLines(order.lines.map((l) => ({
      productId: l.productId, quantity: l.quantity, quantityType: l.quantityType,
      unitPriceBeforeVat: l.unitPriceBeforeVat, notes: l.notes ?? "",
    })));
    setStatus(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setStatus(null);
    const url = editingId ? `/api/admin/sales-orders/${editingId}` : "/api/admin/sales-orders";
    const method = editingId ? "PATCH" : "POST";
    const response = await fetch(url, {
      method, headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId, orderDate,
        expectedDeliveryDate: expectedDeliveryDate || null,
        status: statusValue, discountAmount: headerDiscount,
        vatRate: vatRate === "" ? null : vatRate, notes,
        lines: lines.filter((l) => l.productId && l.quantity > 0),
      }),
    });
    if (response.ok) {
      const data = await response.json();
      if (editingId) setOrders((c) => c.map((o) => o.id === data.id ? data : o));
      else setOrders((c) => [data, ...c]);
      setStatus(`تم حفظ ${data.salesOrderNumber}.`);
      resetForm();
    } else {
      const err = await response.json().catch(() => null);
      setStatus(err?.error ?? "تعذر حفظ أمر البيع.");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("حذف هذا الأمر؟ إذا كان مرتبطاً بفواتير أو سندات تسليم سيُلغى بدلاً من حذفه.")) return;
    const response = await fetch(`/api/admin/sales-orders/${id}`, { method: "DELETE" });
    if (!response.ok) { setStatus("تعذر حذف أمر البيع."); return; }
    const data = await response.json();
    if (data.archived && data.salesOrder) {
      setOrders((c) => c.map((o) => o.id === id ? { ...o, ...data.salesOrder } : o));
      setStatus("تم تعيين الأمر كملغى.");
    } else {
      setOrders((c) => c.filter((o) => o.id !== id));
      setStatus("تم حذف الأمر.");
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="data-card space-y-6 p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">{editingId ? "تعديل أمر البيع" : "إنشاء أمر بيع"}</h2>
            <p className="mt-2 text-sm text-muted">رقم تسلسلي تلقائي SO-YYYY-0001.</p>
          </div>
          {editingId ? (
            <button type="button" onClick={() => { resetForm(); setStatus(null); }} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm">
              <X className="h-4 w-4" aria-hidden="true" />إلغاء
            </button>
          ) : null}
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <label className="space-y-2 text-sm text-foreground">العميل
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required className="w-full rounded-3xl border border-border bg-background px-4 py-3">
              <option value="">— اختر العميل —</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.companyName ? `${c.companyName} — ${c.name}` : c.name}</option>)}
            </select>
          </label>
          <label className="space-y-2 text-sm text-foreground">الحالة
            <select value={statusValue} onChange={(e) => setStatusValue(e.target.value)} className="w-full rounded-3xl border border-border bg-background px-4 py-3">
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="space-y-2 text-sm text-foreground">تاريخ الأمر
            <input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} required className="w-full rounded-3xl border border-border bg-background px-4 py-3" />
          </label>
          <label className="space-y-2 text-sm text-foreground">تاريخ التسليم المتوقع
            <input type="date" value={expectedDeliveryDate} onChange={(e) => setExpectedDeliveryDate(e.target.value)} className="w-full rounded-3xl border border-border bg-background px-4 py-3" />
          </label>
          <label className="space-y-2 text-sm text-foreground">خصم على الإجمالي (ر.س)
            <input type="number" min="0" step="0.01" value={headerDiscount} onChange={(e) => setHeaderDiscount(Number(e.target.value))} className="w-full rounded-3xl border border-border bg-background px-4 py-3" />
          </label>
          <label className="space-y-2 text-sm text-foreground">نسبة الضريبة (٪)
            <input type="number" min="0" step="0.01" value={vatRate} onChange={(e) => setVatRate(e.target.value === "" ? "" : Number(e.target.value))} className="w-full rounded-3xl border border-border bg-background px-4 py-3" />
          </label>
          <label className="space-y-2 text-sm text-foreground lg:col-span-2">ملاحظات
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full rounded-3xl border border-border bg-background px-4 py-3" />
          </label>
        </div>

        <div className="space-y-3 border-t border-border pt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">بنود الأمر</h3>
            <button type="button" onClick={() => setLines((c) => [...c, emptyLine()])} className="inline-flex items-center gap-2 rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary">
              <Plus className="h-4 w-4" aria-hidden="true" />إضافة بند
            </button>
          </div>
          {lines.map((line, index) => (
            <div key={index} className="rounded-lg border border-border bg-background p-4">
              <div className="grid gap-3 lg:grid-cols-12">
                <select value={line.productId} onChange={(e) => setLines((c) => c.map((l, i) => i === index ? { ...l, productId: e.target.value } : l))} required className="lg:col-span-5 rounded-xl border border-border bg-background px-3 py-2 text-sm">
                  <option value="">— المنتج —</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.nameAr}</option>)}
                </select>
                <input type="number" min="0" step="0.01" placeholder="الكمية" value={line.quantity} onChange={(e) => setLines((c) => c.map((l, i) => i === index ? { ...l, quantity: Number(e.target.value) } : l))} className="lg:col-span-2 rounded-xl border border-border bg-background px-3 py-2 text-sm" />
                <select value={line.quantityType} onChange={(e) => setLines((c) => c.map((l, i) => i === index ? { ...l, quantityType: e.target.value } : l))} className="lg:col-span-1 rounded-xl border border-border bg-background px-3 py-2 text-sm">
                  {QTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <input type="number" min="0" step="0.01" placeholder="سعر الوحدة" value={line.unitPriceBeforeVat} onChange={(e) => setLines((c) => c.map((l, i) => i === index ? { ...l, unitPriceBeforeVat: Number(e.target.value) } : l))} className="lg:col-span-3 rounded-xl border border-border bg-background px-3 py-2 text-sm" />
                <button type="button" onClick={() => setLines((c) => c.filter((_, i) => i !== index))} className="lg:col-span-1 inline-flex items-center justify-center rounded-xl border border-red-400 px-2 py-2 text-red-600">
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-2 rounded-lg border border-border bg-background p-4 text-sm sm:grid-cols-3">
          <p>الإجمالي قبل الضريبة: <strong>{totals.subtotal.toFixed(2)} ر.س</strong></p>
          <p>الضريبة: <strong>{totals.vat.toFixed(2)} ر.س</strong></p>
          <p>الإجمالي: <strong>{totals.total.toFixed(2)} ر.س</strong></p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button type="submit" disabled={saving} className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white disabled:opacity-70">
            <Save className="h-4 w-4" aria-hidden="true" />
            {saving ? "جاري الحفظ..." : editingId ? "تحديث" : "حفظ"}
          </button>
          {status ? <p className="text-sm text-muted">{status}</p> : null}
        </div>
      </form>

      <div className="data-card p-8">
        <h2 className="text-2xl font-semibold text-foreground">أوامر البيع</h2>
        <div className="mt-6 grid gap-3">
          {orders.length === 0 ? <p className="text-sm text-muted">لا توجد أوامر بعد.</p> : (
            orders.map((o) => (
              <div key={o.id} className="rounded-lg border border-border bg-background p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">{o.salesOrderNumber} — {o.customer.companyName || o.customer.name}</p>
                    <p className="text-xs text-muted">{formatDate(o.orderDate)} • {o.lines.length} بند • الإجمالي {o.totalAmount.toFixed(2)} ر.س</p>
                    {o.quotation ? <p className="text-xs text-muted">مرجع عرض السعر: {o.quotation.quotationNumber}</p> : null}
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{o.status}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/dashboard/sales-orders/${o.id}`} className="inline-flex items-center gap-1 rounded-full border border-emerald-500 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      الجدول الزمني
                    </Link>
                    <button type="button" onClick={() => handleEdit(o)} className="rounded-full border border-primary px-3 py-1.5 text-xs font-semibold text-primary">تعديل</button>
                    <button type="button" onClick={() => handleDelete(o.id)} className="rounded-full border border-red-400 px-3 py-1.5 text-xs font-semibold text-red-600">حذف</button>
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
