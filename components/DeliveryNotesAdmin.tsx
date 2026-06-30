"use client";

import { useState } from "react";
import { Plus, Save, Trash2, X } from "lucide-react";

type Customer = { id: string; name: string; companyName: string | null };
type Product = { id: string; nameAr: string; nameEn: string };
type SalesOrderOption = { id: string; salesOrderNumber: string; customerId: string };

type DeliveryLine = {
  productId: string;
  quantity: number;
  quantityType: string;
  batchNumber: string;
  expiryDate: string;
  notes: string;
};

type DeliveryNote = {
  id: string;
  deliveryNoteNumber: string;
  salesOrderId: string;
  salesOrder: { id: string; salesOrderNumber: string } | null;
  customer: Customer;
  customerId: string;
  warehouseName: string | null;
  deliveryDate: string | Date;
  driverName: string | null;
  vehiclePlate: string | null;
  deliveryStatus: string;
  receivedBy: string | null;
  notes: string | null;
  lines: (Omit<DeliveryLine, "expiryDate"> & { id: string; expiryDate: string | Date | null })[];
};

const QTY_TYPES = ["unit", "carton", "pallet", "container"];
const STATUSES = ["pending", "dispatched", "delivered", "returned", "cancelled"];

const emptyLine = (): DeliveryLine => ({
  productId: "", quantity: 0, quantityType: "carton", batchNumber: "", expiryDate: "", notes: "",
});

function formatDate(value: string | Date | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "" : date.toISOString().slice(0, 10);
}

export default function DeliveryNotesAdmin({
  initialNotes, customers, products, salesOrders,
}: {
  initialNotes: DeliveryNote[];
  customers: Customer[];
  products: Product[];
  salesOrders: SalesOrderOption[];
}) {
  const [notes, setNotes] = useState<DeliveryNote[]>(initialNotes);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [salesOrderId, setSalesOrderId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [warehouseName, setWarehouseName] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [driverName, setDriverName] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState("pending");
  const [receivedBy, setReceivedBy] = useState("");
  const [notesText, setNotesText] = useState("");
  const [lines, setLines] = useState<DeliveryLine[]>([emptyLine()]);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function resetForm() {
    setEditingId(null); setSalesOrderId(""); setCustomerId("");
    setWarehouseName(""); setDeliveryDate(new Date().toISOString().slice(0, 10));
    setDriverName(""); setVehiclePlate(""); setDeliveryStatus("pending");
    setReceivedBy(""); setNotesText(""); setLines([emptyLine()]);
  }

  function handleEdit(note: DeliveryNote) {
    setEditingId(note.id); setSalesOrderId(note.salesOrderId); setCustomerId(note.customerId);
    setWarehouseName(note.warehouseName ?? "");
    setDeliveryDate(formatDate(note.deliveryDate));
    setDriverName(note.driverName ?? ""); setVehiclePlate(note.vehiclePlate ?? "");
    setDeliveryStatus(note.deliveryStatus); setReceivedBy(note.receivedBy ?? "");
    setNotesText(note.notes ?? "");
    setLines(note.lines.map((l) => ({
      productId: l.productId, quantity: l.quantity, quantityType: l.quantityType,
      batchNumber: l.batchNumber ?? "", expiryDate: formatDate(l.expiryDate), notes: l.notes ?? "",
    })));
    setStatus(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setStatus(null);
    const url = editingId ? `/api/admin/delivery-notes/${editingId}` : "/api/admin/delivery-notes";
    const method = editingId ? "PATCH" : "POST";
    const response = await fetch(url, {
      method, headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        salesOrderId, customerId, warehouseName, deliveryDate, driverName, vehiclePlate,
        deliveryStatus, receivedBy, notes: notesText,
        lines: lines.filter((l) => l.productId && l.quantity > 0).map((l) => ({
          productId: l.productId, quantity: l.quantity, quantityType: l.quantityType,
          batchNumber: l.batchNumber, expiryDate: l.expiryDate || null, notes: l.notes,
        })),
      }),
    });
    if (response.ok) {
      const data = await response.json();
      if (editingId) setNotes((c) => c.map((n) => n.id === data.id ? data : n));
      else setNotes((c) => [data, ...c]);
      setStatus(`تم حفظ ${data.deliveryNoteNumber}.`); resetForm();
    } else {
      const err = await response.json().catch(() => null);
      setStatus(err?.error ?? "تعذر حفظ سند التسليم.");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("حذف سند التسليم؟")) return;
    const response = await fetch(`/api/admin/delivery-notes/${id}`, { method: "DELETE" });
    if (!response.ok) { setStatus("تعذر حذف السند."); return; }
    const data = await response.json();
    if (data.archived && data.deliveryNote) {
      setNotes((c) => c.map((n) => n.id === id ? { ...n, ...data.deliveryNote } : n));
      setStatus("تم تعيين السند كملغى.");
    } else {
      setNotes((c) => c.filter((n) => n.id !== id));
      setStatus("تم حذف السند.");
    }
  }

  function handleSalesOrderChange(value: string) {
    setSalesOrderId(value);
    const order = salesOrders.find((o) => o.id === value);
    if (order) setCustomerId(order.customerId);
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="data-card space-y-6 p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">{editingId ? "تعديل سند تسليم" : "إنشاء سند تسليم"}</h2>
            <p className="mt-2 text-sm text-muted">رقم تسلسلي تلقائي DN-YYYY-0001.</p>
          </div>
          {editingId ? <button type="button" onClick={() => { resetForm(); setStatus(null); }} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm"><X className="h-4 w-4" />إلغاء</button> : null}
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <label className="space-y-2 text-sm text-foreground">أمر البيع
            <select value={salesOrderId} onChange={(e) => handleSalesOrderChange(e.target.value)} required className="w-full rounded-3xl border border-border bg-background px-4 py-3">
              <option value="">— اختر —</option>
              {salesOrders.map((o) => <option key={o.id} value={o.id}>{o.salesOrderNumber}</option>)}
            </select>
          </label>
          <label className="space-y-2 text-sm text-foreground">العميل
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required className="w-full rounded-3xl border border-border bg-background px-4 py-3">
              <option value="">— اختر —</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.companyName ? `${c.companyName} — ${c.name}` : c.name}</option>)}
            </select>
          </label>
          <label className="space-y-2 text-sm text-foreground">تاريخ التسليم
            <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} required className="w-full rounded-3xl border border-border bg-background px-4 py-3" />
          </label>
          <label className="space-y-2 text-sm text-foreground">حالة التسليم
            <select value={deliveryStatus} onChange={(e) => setDeliveryStatus(e.target.value)} className="w-full rounded-3xl border border-border bg-background px-4 py-3">
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="space-y-2 text-sm text-foreground">المستودع
            <input value={warehouseName} onChange={(e) => setWarehouseName(e.target.value)} className="w-full rounded-3xl border border-border bg-background px-4 py-3" />
          </label>
          <label className="space-y-2 text-sm text-foreground">السائق
            <input value={driverName} onChange={(e) => setDriverName(e.target.value)} className="w-full rounded-3xl border border-border bg-background px-4 py-3" />
          </label>
          <label className="space-y-2 text-sm text-foreground">رقم لوحة المركبة
            <input value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value)} className="w-full rounded-3xl border border-border bg-background px-4 py-3" />
          </label>
          <label className="space-y-2 text-sm text-foreground">المستلم
            <input value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} className="w-full rounded-3xl border border-border bg-background px-4 py-3" />
          </label>
          <label className="space-y-2 text-sm text-foreground lg:col-span-2">ملاحظات
            <textarea value={notesText} onChange={(e) => setNotesText(e.target.value)} rows={2} className="w-full rounded-3xl border border-border bg-background px-4 py-3" />
          </label>
        </div>

        <div className="space-y-3 border-t border-border pt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">بنود السند</h3>
            <button type="button" onClick={() => setLines((c) => [...c, emptyLine()])} className="inline-flex items-center gap-2 rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary">
              <Plus className="h-4 w-4" />إضافة بند
            </button>
          </div>
          {lines.map((line, index) => (
            <div key={index} className="rounded-lg border border-border bg-background p-4">
              <div className="grid gap-3 lg:grid-cols-12">
                <select value={line.productId} onChange={(e) => setLines((c) => c.map((l, i) => i === index ? { ...l, productId: e.target.value } : l))} required className="lg:col-span-3 rounded-xl border border-border bg-background px-3 py-2 text-sm">
                  <option value="">— المنتج —</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.nameAr}</option>)}
                </select>
                <input type="number" min="0" step="0.01" placeholder="الكمية" value={line.quantity} onChange={(e) => setLines((c) => c.map((l, i) => i === index ? { ...l, quantity: Number(e.target.value) } : l))} className="lg:col-span-2 rounded-xl border border-border bg-background px-3 py-2 text-sm" />
                <select value={line.quantityType} onChange={(e) => setLines((c) => c.map((l, i) => i === index ? { ...l, quantityType: e.target.value } : l))} className="lg:col-span-1 rounded-xl border border-border bg-background px-3 py-2 text-sm">
                  {QTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <input placeholder="رقم الدفعة" value={line.batchNumber} onChange={(e) => setLines((c) => c.map((l, i) => i === index ? { ...l, batchNumber: e.target.value } : l))} className="lg:col-span-2 rounded-xl border border-border bg-background px-3 py-2 text-sm" />
                <input type="date" placeholder="انتهاء الصلاحية" value={line.expiryDate} onChange={(e) => setLines((c) => c.map((l, i) => i === index ? { ...l, expiryDate: e.target.value } : l))} className="lg:col-span-3 rounded-xl border border-border bg-background px-3 py-2 text-sm" />
                <button type="button" onClick={() => setLines((c) => c.filter((_, i) => i !== index))} className="lg:col-span-1 inline-flex items-center justify-center rounded-xl border border-red-400 px-2 py-2 text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button type="submit" disabled={saving} className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white disabled:opacity-70">
            <Save className="h-4 w-4" />{saving ? "جاري الحفظ..." : editingId ? "تحديث" : "حفظ"}
          </button>
          {status ? <p className="text-sm text-muted">{status}</p> : null}
        </div>
      </form>

      <div className="data-card p-8">
        <h2 className="text-2xl font-semibold text-foreground">سندات التسليم</h2>
        <div className="mt-6 grid gap-3">
          {notes.length === 0 ? <p className="text-sm text-muted">لا توجد سندات بعد.</p> : (
            notes.map((n) => (
              <div key={n.id} className="rounded-lg border border-border bg-background p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">{n.deliveryNoteNumber} — {n.customer.companyName || n.customer.name}</p>
                    <p className="text-xs text-muted">أمر البيع {n.salesOrder?.salesOrderNumber ?? "—"} • {formatDate(n.deliveryDate)} • {n.lines.length} بند</p>
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{n.deliveryStatus}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => handleEdit(n)} className="rounded-full border border-primary px-3 py-1.5 text-xs font-semibold text-primary">تعديل</button>
                    <button type="button" onClick={() => handleDelete(n.id)} className="rounded-full border border-red-400 px-3 py-1.5 text-xs font-semibold text-red-600">حذف</button>
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
