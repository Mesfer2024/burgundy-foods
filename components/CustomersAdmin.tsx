"use client";

import { useState } from "react";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";

type Customer = {
  id: string;
  name: string;
  companyName?: string | null;
  type: string;
  city: string;
  taxNumber?: string | null;
  tradeLicense?: string | null;
  phone: string;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
};

const initialForm = {
  name: "",
  companyName: "",
  type: "بقالة",
  city: "",
  taxNumber: "",
  tradeLicense: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
};

export default function CustomersAdmin({ initialCustomers }: { initialCustomers: Customer[] }) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  function resetForm(clearStatus = true) {
    setForm(initialForm);
    setEditingId(null);
    if (clearStatus) setStatus(null);
  }

  function handleEdit(customer: Customer) {
    setEditingId(customer.id);
    setStatus(null);
    setForm({
      name: customer.name,
      companyName: customer.companyName ?? "",
      type: customer.type,
      city: customer.city,
      taxNumber: customer.taxNumber ?? "",
      tradeLicense: customer.tradeLicense ?? "",
      phone: customer.phone,
      email: customer.email ?? "",
      address: customer.address ?? "",
      notes: customer.notes ?? "",
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus(null);
    const response = await fetch(editingId ? `/api/admin/customers/${editingId}` : "/api/admin/customers", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (response.ok) {
      const customer = await response.json();
      if (editingId) {
        setCustomers((current) => current.map((item) => (item.id === customer.id ? customer : item)));
        setStatus("تم تحديث بيانات العميل بنجاح.");
      } else {
        setCustomers((current) => [customer, ...current]);
        setStatus("تم إضافة العميل بنجاح.");
      }
      setForm(initialForm);
      setEditingId(null);
    } else {
      setStatus("حدث خطأ أثناء حفظ بيانات العميل.");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("هل تريد حذف هذا العميل؟ سيتم حذف طلباته المرتبطة أيضاً.")) return;
    const response = await fetch(`/api/admin/customers/${id}`, { method: "DELETE" });
    if (response.ok) {
      setCustomers((current) => current.filter((customer) => customer.id !== id));
      setStatus("تم حذف العميل.");
      if (editingId === id) resetForm(false);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="data-card space-y-6 p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">إضافة / تعديل عميل</h2>
            <p className="mt-2 text-sm text-muted">أنشئ سجل عميل جديد أو عدل بيانات العملاء الحاليين.</p>
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
            اسم العميل
            <input
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
            />
          </label>
          <label className="space-y-2 text-sm text-foreground">
            اسم المنشأة
            <input
              value={form.companyName}
              onChange={(event) => setForm({ ...form, companyName: event.target.value })}
              className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
            />
          </label>
          <label className="space-y-2 text-sm text-foreground">
            نوع العميل
            <select
              value={form.type}
              onChange={(event) => setForm({ ...form, type: event.target.value })}
              className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
            >
              {[
                "بقالة",
                "سوبرماركت",
                "موزع",
                "مطعم",
                "فرد",
              ].map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm text-foreground">
            المدينة
            <input
              required
              value={form.city}
              onChange={(event) => setForm({ ...form, city: event.target.value })}
              className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
            />
          </label>
          <label className="space-y-2 text-sm text-foreground">
            رقم الجوال
            <input
              required
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
            />
          </label>
          <label className="space-y-2 text-sm text-foreground">
            البريد الإلكتروني
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
            />
          </label>
          <label className="space-y-2 text-sm text-foreground">
            الرقم الضريبي
            <input
              value={form.taxNumber}
              onChange={(event) => setForm({ ...form, taxNumber: event.target.value })}
              className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
            />
          </label>
          <label className="space-y-2 text-sm text-foreground">
            السجل التجاري
            <input
              value={form.tradeLicense}
              onChange={(event) => setForm({ ...form, tradeLicense: event.target.value })}
              className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
            />
          </label>
          <label className="space-y-2 text-sm text-foreground sm:col-span-2">
            العنوان
            <input
              value={form.address}
              onChange={(event) => setForm({ ...form, address: event.target.value })}
              className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
            />
          </label>
          <label className="space-y-2 text-sm text-foreground sm:col-span-2">
            ملاحظات
            <textarea
              rows={3}
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
            />
          </label>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
          >
            {editingId ? <Save className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
            {saving ? "جاري الحفظ..." : editingId ? "تحديث العميل" : "إضافة عميل"}
          </button>
          {status ? <p className="text-sm text-muted">{status}</p> : null}
        </div>
      </form>

      <div className="data-card p-8">
        <h2 className="text-2xl font-semibold text-foreground">قائمة العملاء</h2>
        <div className="mt-6 space-y-4">
          {customers.length === 0 ? (
            <p className="text-sm text-muted">لا يوجد عملاء بعد.</p>
          ) : (
            customers.map((customer) => (
              <div key={customer.id} className="rounded-lg border border-border bg-background p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{customer.name}</p>
                    <p className="text-sm text-muted">{customer.companyName || "عميل فرد"} — {customer.type}</p>
                    <p className="text-sm">{customer.phone} | {customer.city}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => handleEdit(customer)} className="inline-flex items-center gap-2 rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10">
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                      تعديل
                    </button>
                    <button type="button" onClick={() => handleDelete(customer.id)} className="inline-flex items-center gap-2 rounded-full border border-red-400 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50">
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
