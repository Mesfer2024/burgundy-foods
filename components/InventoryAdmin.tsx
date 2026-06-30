"use client";

import { useMemo, useState } from "react";
import { Boxes, Pencil, Plus, Save, Trash2, X } from "lucide-react";

type Product = {
  id: string;
  nameAr: string;
  packsPerCarton: number | null;
};

type InventoryBatch = {
  id: string;
  productId: string;
  shipmentNumber: string;
  arrivalDate?: string | Date | null;
  supplier?: string | null;
  cartonQty: number;
  packQty: number;
  productionDate?: string | Date | null;
  expiryDate?: string | Date | null;
  batchNumber?: string | null;
  warehouse?: string | null;
  product: Product;
};

type InventoryForm = {
  productId: string;
  shipmentNumber: string;
  arrivalDate: string;
  supplier: string;
  cartonQty: number;
  packQty: number;
  productionDate: string;
  expiryDate: string;
  batchNumber: string;
  warehouse: string;
};

function toInputDate(value?: string | Date | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function formatDate(value?: string | Date | null) {
  if (!value) return "غير محدد";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "غير محدد";
  return date.toLocaleDateString("ar-SA");
}

function createInitialForm(productId = ""): InventoryForm {
  return {
    productId,
    shipmentNumber: "",
    arrivalDate: "",
    supplier: "",
    cartonQty: 0,
    packQty: 0,
    productionDate: "",
    expiryDate: "",
    batchNumber: "",
    warehouse: "مستودع الرياض",
  };
}

export default function InventoryAdmin({
  initialBatches,
  products,
}: {
  initialBatches: InventoryBatch[];
  products: Product[];
}) {
  const [batches, setBatches] = useState<InventoryBatch[]>(initialBatches);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<InventoryForm>(createInitialForm(products[0]?.id));
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const totals = useMemo(
    () =>
      batches.reduce(
        (summary, batch) => ({
          cartons: summary.cartons + batch.cartonQty,
          packs: summary.packs + batch.packQty,
          lowStock: summary.lowStock + (batch.cartonQty < 20 ? 1 : 0),
        }),
        { cartons: 0, packs: 0, lowStock: 0 },
      ),
    [batches],
  );

  function resetForm() {
    setEditingId(null);
    setForm(createInitialForm(products[0]?.id));
    setStatus(null);
  }

  function handleProductChange(productId: string) {
    const product = products.find((item) => item.id === productId);
    setForm((current) => ({
      ...current,
      productId,
      packQty: current.cartonQty * (product?.packsPerCarton ?? 0),
    }));
  }

  function handleCartonChange(cartonQty: number) {
    const product = products.find((item) => item.id === form.productId);
    setForm((current) => ({
      ...current,
      cartonQty,
      packQty: cartonQty * (product?.packsPerCarton ?? 0),
    }));
  }

  function handleEdit(batch: InventoryBatch) {
    setEditingId(batch.id);
    setStatus(null);
    setForm({
      productId: batch.productId,
      shipmentNumber: batch.shipmentNumber,
      arrivalDate: toInputDate(batch.arrivalDate),
      supplier: batch.supplier ?? "",
      cartonQty: batch.cartonQty,
      packQty: batch.packQty,
      productionDate: toInputDate(batch.productionDate),
      expiryDate: toInputDate(batch.expiryDate),
      batchNumber: batch.batchNumber ?? "",
      warehouse: batch.warehouse ?? "",
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.productId || !form.shipmentNumber) {
      setStatus("اختر المنتج وأدخل رقم الشحنة.");
      return;
    }

    setSaving(true);
    setStatus(null);
    const response = await fetch(editingId ? `/api/admin/inventory/${editingId}` : "/api/admin/inventory", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (response.ok) {
      const batch = (await response.json()) as InventoryBatch;
      if (editingId) {
        setBatches((current) => current.map((item) => (item.id === batch.id ? batch : item)));
        setStatus("تم تحديث الشحنة بنجاح.");
      } else {
        setBatches((current) => [batch, ...current]);
        setStatus("تم تسجيل الشحنة بنجاح.");
      }
      setEditingId(null);
      setForm(createInitialForm(products[0]?.id));
    } else {
      setStatus("تعذر حفظ بيانات المخزون.");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("هل تريد حذف هذه الشحنة من المخزون؟")) return;
    const response = await fetch(`/api/admin/inventory/${id}`, { method: "DELETE" });
    if (response.ok) {
      setBatches((current) => current.filter((batch) => batch.id !== id));
      setStatus("تم حذف الشحنة.");
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="metric-card p-5">
          <p className="text-sm text-muted">إجمالي الكراتين</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{totals.cartons}</p>
        </div>
        <div className="metric-card p-5">
          <p className="text-sm text-muted">إجمالي العبوات</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{totals.packs}</p>
        </div>
        <div className="metric-card p-5">
          <p className="text-sm text-muted">شحنات منخفضة</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{totals.lowStock}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="data-card space-y-6 p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">تسجيل شحنة مخزون</h2>
            <p className="mt-2 text-sm text-muted">أضف الشحنات والكميات وتواريخ الإنتاج والانتهاء لكل منتج.</p>
          </div>
          {editingId ? (
            <button type="button" onClick={resetForm} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-foreground transition hover:bg-background">
              <X className="h-4 w-4" aria-hidden="true" />
              إلغاء التعديل
            </button>
          ) : null}
        </div>

        {products.length === 0 ? (
          <p className="rounded-3xl border border-border bg-background p-4 text-sm text-muted">
            أضف المنتجات أولاً قبل تسجيل المخزون.
          </p>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-2">
          <label className="space-y-2 text-sm text-foreground">
            المنتج
            <select
              value={form.productId}
              onChange={(event) => handleProductChange(event.target.value)}
              disabled={products.length === 0}
              className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
            >
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.nameAr}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm text-foreground">
            رقم الشحنة
            <input
              value={form.shipmentNumber}
              onChange={(event) => setForm({ ...form, shipmentNumber: event.target.value })}
              required
              className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
            />
          </label>
          <label className="space-y-2 text-sm text-foreground">
            المورد
            <input
              value={form.supplier}
              onChange={(event) => setForm({ ...form, supplier: event.target.value })}
              className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
            />
          </label>
          <label className="space-y-2 text-sm text-foreground">
            المستودع
            <input
              value={form.warehouse}
              onChange={(event) => setForm({ ...form, warehouse: event.target.value })}
              className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
            />
          </label>
          <label className="space-y-2 text-sm text-foreground">
            عدد الكراتين
            <input
              type="number"
              min={0}
              value={form.cartonQty}
              onChange={(event) => handleCartonChange(Number(event.target.value))}
              className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
            />
          </label>
          <label className="space-y-2 text-sm text-foreground">
            عدد العبوات
            <input
              type="number"
              min={0}
              value={form.packQty}
              onChange={(event) => setForm({ ...form, packQty: Number(event.target.value) })}
              className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
            />
          </label>
          <label className="space-y-2 text-sm text-foreground">
            رقم التشغيلة
            <input
              value={form.batchNumber}
              onChange={(event) => setForm({ ...form, batchNumber: event.target.value })}
              className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
            />
          </label>
          <label className="space-y-2 text-sm text-foreground">
            تاريخ الوصول
            <input
              type="date"
              value={form.arrivalDate}
              onChange={(event) => setForm({ ...form, arrivalDate: event.target.value })}
              className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
            />
          </label>
          <label className="space-y-2 text-sm text-foreground">
            تاريخ الإنتاج
            <input
              type="date"
              value={form.productionDate}
              onChange={(event) => setForm({ ...form, productionDate: event.target.value })}
              className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
            />
          </label>
          <label className="space-y-2 text-sm text-foreground">
            تاريخ الانتهاء
            <input
              type="date"
              value={form.expiryDate}
              onChange={(event) => setForm({ ...form, expiryDate: event.target.value })}
              className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
            />
          </label>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="submit"
            disabled={saving || products.length === 0}
            className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
          >
            {editingId ? <Save className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
            {saving ? "جاري الحفظ..." : editingId ? "تحديث الشحنة" : "إضافة الشحنة"}
          </button>
          {status ? <p className="text-sm text-muted">{status}</p> : null}
        </div>
      </form>

      <section className="data-card p-8">
        <h2 className="text-2xl font-semibold text-foreground">الشحنات الحالية</h2>
        <div className="mt-6 space-y-4">
          {batches.length === 0 ? (
            <p className="text-sm text-muted">لا توجد بيانات شحنات.</p>
          ) : (
            batches.map((batch) => (
              <div key={batch.id} className="rounded-lg border border-border bg-background p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <p className="inline-flex items-center gap-2 font-semibold text-foreground">
                      <Boxes className="h-4 w-4 text-primary" aria-hidden="true" />
                      {batch.product?.nameAr || "منتج"}
                    </p>
                    <p className="text-sm text-muted">رقم الشحنة: {batch.shipmentNumber}</p>
                    <p className="text-sm text-muted">المورد: {batch.supplier || "غير محدد"} | المستودع: {batch.warehouse || "غير محدد"}</p>
                    <p className="text-sm text-muted">
                      إنتاج: {formatDate(batch.productionDate)} | انتهاء: {formatDate(batch.expiryDate)}
                    </p>
                  </div>
                  <div className="grid gap-2 text-sm text-muted sm:min-w-56">
                    <p>الوصول: {formatDate(batch.arrivalDate)}</p>
                    <p>الكمية: {batch.cartonQty} كراتين / {batch.packQty} عبوات</p>
                    <p>التشغيلة: {batch.batchNumber || "غير محدد"}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => handleEdit(batch)} className="inline-flex items-center gap-2 rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10">
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                    تعديل
                  </button>
                  <button type="button" onClick={() => handleDelete(batch.id)} className="inline-flex items-center gap-2 rounded-full border border-red-400 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50">
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    حذف
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
