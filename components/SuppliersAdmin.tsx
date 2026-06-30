"use client";

import { useState } from "react";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";

type Supplier = {
  id: string;
  nameAr: string;
  nameEn: string | null;
  type: string | null;
  country: string | null;
  city: string | null;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  taxNumber: string | null;
  notes: string | null;
  active: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
};

const initialForm = {
  nameAr: "",
  nameEn: "",
  type: "",
  country: "",
  city: "",
  contactName: "",
  phone: "",
  email: "",
  address: "",
  taxNumber: "",
  notes: "",
  active: true,
};

const TYPE_OPTIONS = ["مصنع", "موزع", "وكيل", "تاجر جملة", "أخرى"];

export default function SuppliersAdmin({ initialSuppliers }: { initialSuppliers: Supplier[] }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function resetForm(clearStatus = true) {
    setForm(initialForm);
    setEditingId(null);
    if (clearStatus) setStatus(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus(null);
    const method = editingId ? "PATCH" : "POST";
    const url = editingId ? `/api/admin/suppliers/${editingId}` : "/api/admin/suppliers";
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (response.ok) {
      const supplier = await response.json();
      if (editingId) {
        setSuppliers((current) => current.map((item) => (item.id === supplier.id ? supplier : item)));
        setStatus("تم تحديث المورد بنجاح.");
      } else {
        setSuppliers((current) => [supplier, ...current]);
        setStatus("تمت إضافة المورد بنجاح.");
      }
      resetForm(false);
    } else {
      const error = await response.json().catch(() => null);
      setStatus(error?.error ?? "حدث خطأ أثناء حفظ المورد.");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذا المورد؟ إذا كان مرتبطاً بمنتجات سيتم تعطيله بدلاً من حذفه.")) return;
    const response = await fetch(`/api/admin/suppliers/${id}`, { method: "DELETE" });
    if (response.ok) {
      const result = await response.json();
      if (result.archived && result.supplier) {
        setSuppliers((current) => current.map((s) => (s.id === id ? result.supplier : s)));
        setStatus("المورد مرتبط بمنتجات، تم تعطيله بدلاً من حذفه.");
      } else {
        setSuppliers((current) => current.filter((s) => s.id !== id));
        setStatus("تم حذف المورد.");
      }
    } else {
      setStatus("تعذر حذف المورد.");
    }
  }

  function handleEdit(supplier: Supplier) {
    setEditingId(supplier.id);
    setForm({
      nameAr: supplier.nameAr,
      nameEn: supplier.nameEn ?? "",
      type: supplier.type ?? "",
      country: supplier.country ?? "",
      city: supplier.city ?? "",
      contactName: supplier.contactName ?? "",
      phone: supplier.phone ?? "",
      email: supplier.email ?? "",
      address: supplier.address ?? "",
      taxNumber: supplier.taxNumber ?? "",
      notes: supplier.notes ?? "",
      active: supplier.active,
    });
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="data-card space-y-6 p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">{editingId ? "تعديل مورد" : "إضافة مورد"}</h2>
            <p className="mt-2 text-sm text-muted">سجل بيانات المصنعين والموزعين والوكلاء الذين توردين منهم المنتجات.</p>
          </div>
          {editingId ? (
            <button type="button" onClick={() => resetForm()} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-foreground transition hover:bg-background">
              <X className="h-4 w-4" aria-hidden="true" />
              إلغاء التعديل
            </button>
          ) : null}
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <label className="space-y-2 text-sm text-foreground">
            اسم المورد بالعربية
            <input value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} required className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary" />
          </label>
          <label className="space-y-2 text-sm text-foreground">
            اسم المورد بالإنجليزية
            <input value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary" />
          </label>
          <label className="space-y-2 text-sm text-foreground">
            نوع المورد
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary">
              <option value="">— غير محدد —</option>
              {TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm text-foreground">
            الدولة
            <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary" />
          </label>
          <label className="space-y-2 text-sm text-foreground">
            المدينة
            <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary" />
          </label>
          <label className="space-y-2 text-sm text-foreground">
            جهة الاتصال
            <input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary" />
          </label>
          <label className="space-y-2 text-sm text-foreground">
            رقم الجوال
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary" />
          </label>
          <label className="space-y-2 text-sm text-foreground">
            البريد الإلكتروني
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary" />
          </label>
          <label className="space-y-2 text-sm text-foreground lg:col-span-2">
            العنوان
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary" />
          </label>
          <label className="space-y-2 text-sm text-foreground">
            الرقم الضريبي
            <input value={form.taxNumber} onChange={(e) => setForm({ ...form, taxNumber: e.target.value })} className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary" />
          </label>
          <label className="space-y-2 text-sm text-foreground">
            ملاحظات
            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary" />
          </label>
          <label className="flex items-center gap-3 text-sm text-foreground lg:col-span-2">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-5 w-5 rounded border border-border text-primary focus:ring-primary" />
            المورد نشط
          </label>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button type="submit" disabled={saving} className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70">
            {editingId ? <Save className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
            {saving ? "جاري الحفظ..." : editingId ? "تحديث المورد" : "إضافة المورد"}
          </button>
          {status ? <p className="text-sm text-muted">{status}</p> : null}
        </div>
      </form>

      <div className="data-card p-8">
        <h2 className="text-2xl font-semibold text-foreground">قائمة الموردين</h2>
        <div className="mt-6 grid gap-4">
          {suppliers.length === 0 ? (
            <p className="text-sm text-muted">لم يتم إضافة موردين بعد.</p>
          ) : (
            suppliers.map((supplier) => (
              <div key={supplier.id} className="rounded-lg border border-border bg-background p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">{supplier.nameAr}{supplier.nameEn ? ` — ${supplier.nameEn}` : ""}</p>
                    <p className="text-xs text-muted">
                      {[supplier.type, supplier.country, supplier.city].filter(Boolean).join(" • ") || "— لا توجد بيانات إضافية —"}
                    </p>
                    {supplier.contactName || supplier.phone || supplier.email ? (
                      <p className="text-xs text-muted">
                        {[supplier.contactName, supplier.phone, supplier.email].filter(Boolean).join(" • ")}
                      </p>
                    ) : null}
                    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${supplier.active ? "bg-primary/10 text-primary" : "bg-muted/20 text-muted"}`}>
                      {supplier.active ? "نشط" : "معطل"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => handleEdit(supplier)} className="inline-flex items-center gap-2 rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10">
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                      تعديل
                    </button>
                    <button type="button" onClick={() => handleDelete(supplier.id)} className="inline-flex items-center gap-2 rounded-full border border-red-400 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50">
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
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
