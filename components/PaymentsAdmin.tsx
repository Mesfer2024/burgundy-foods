"use client";

import { useState } from "react";
import { Save, X } from "lucide-react";

type Customer = { id: string; name: string; companyName: string | null };
type InvoiceOption = { id: string; invoiceNumber: string; customerId: string; totalAmount: number; balanceDue: number };

type Payment = {
  id: string;
  receiptNumber: string;
  customerId: string;
  customer: Customer;
  invoice: { id: string; invoiceNumber: string; totalAmount: number; balanceDue: number } | null;
  paymentDate: string | Date;
  amount: number;
  paymentMethod: string;
  bankAccount: string | null;
  referenceNumber: string | null;
  notes: string | null;
};

const METHODS = ["bank_transfer", "cash", "mada", "other"];

function formatDate(value: string | Date | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "" : date.toISOString().slice(0, 10);
}

export default function PaymentsAdmin({
  initialPayments, customers, invoices,
}: {
  initialPayments: Payment[];
  customers: Customer[];
  invoices: InvoiceOption[];
}) {
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [bankAccount, setBankAccount] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function resetForm() {
    setEditingId(null); setCustomerId(""); setInvoiceId("");
    setPaymentDate(new Date().toISOString().slice(0, 10)); setAmount(0);
    setPaymentMethod("bank_transfer"); setBankAccount(""); setReferenceNumber(""); setNotes("");
  }

  function handleEdit(payment: Payment) {
    setEditingId(payment.id); setCustomerId(payment.customerId);
    setInvoiceId(payment.invoice?.id ?? ""); setPaymentDate(formatDate(payment.paymentDate));
    setAmount(payment.amount); setPaymentMethod(payment.paymentMethod);
    setBankAccount(payment.bankAccount ?? ""); setReferenceNumber(payment.referenceNumber ?? "");
    setNotes(payment.notes ?? ""); setStatus(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setStatus(null);
    const url = editingId ? `/api/admin/payments/${editingId}` : "/api/admin/payments";
    const method = editingId ? "PATCH" : "POST";
    const response = await fetch(url, {
      method, headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId, invoiceId: invoiceId || null, paymentDate, amount,
        paymentMethod, bankAccount, referenceNumber, notes,
      }),
    });
    if (response.ok) {
      const data = await response.json();
      if (editingId) setPayments((c) => c.map((p) => p.id === data.id ? data : p));
      else setPayments((c) => [data, ...c]);
      setStatus(`تم حفظ ${data.receiptNumber}.`); resetForm();
    } else {
      const err = await response.json().catch(() => null);
      setStatus(err?.error ?? "تعذر حفظ المقبوض.");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("حذف هذا المقبوض؟ سيُعاد احتساب رصيد الفاتورة المرتبطة.")) return;
    const response = await fetch(`/api/admin/payments/${id}`, { method: "DELETE" });
    if (!response.ok) { setStatus("تعذر حذف المقبوض."); return; }
    setPayments((c) => c.filter((p) => p.id !== id));
    setStatus("تم حذف المقبوض.");
  }

  function handleInvoiceChange(value: string) {
    setInvoiceId(value);
    const invoice = invoices.find((i) => i.id === value);
    if (invoice) {
      setCustomerId(invoice.customerId);
      if (amount === 0) setAmount(invoice.balanceDue);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="data-card space-y-6 p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">{editingId ? "تعديل مقبوض" : "تسجيل مقبوض"}</h2>
            <p className="mt-2 text-sm text-muted">رقم تسلسلي تلقائي RCPT-YYYY-0001. حفظ المقبوض يحدّث رصيد الفاتورة وحالتها تلقائياً.</p>
          </div>
          {editingId ? <button type="button" onClick={() => { resetForm(); setStatus(null); }} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm"><X className="h-4 w-4" />إلغاء</button> : null}
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <label className="space-y-2 text-sm text-foreground">الفاتورة (اختياري)
            <select value={invoiceId} onChange={(e) => handleInvoiceChange(e.target.value)} className="w-full rounded-3xl border border-border bg-background px-4 py-3">
              <option value="">— لا توجد فاتورة مرتبطة —</option>
              {invoices.map((i) => <option key={i.id} value={i.id}>{i.invoiceNumber} (متبقٍ {i.balanceDue.toFixed(2)} ر.س)</option>)}
            </select>
          </label>
          <label className="space-y-2 text-sm text-foreground">العميل
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required className="w-full rounded-3xl border border-border bg-background px-4 py-3">
              <option value="">— اختر —</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.companyName ? `${c.companyName} — ${c.name}` : c.name}</option>)}
            </select>
          </label>
          <label className="space-y-2 text-sm text-foreground">تاريخ الدفع
            <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} required className="w-full rounded-3xl border border-border bg-background px-4 py-3" />
          </label>
          <label className="space-y-2 text-sm text-foreground">المبلغ
            <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(Number(e.target.value))} required className="w-full rounded-3xl border border-border bg-background px-4 py-3" />
          </label>
          <label className="space-y-2 text-sm text-foreground">طريقة الدفع
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full rounded-3xl border border-border bg-background px-4 py-3">
              {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
          <label className="space-y-2 text-sm text-foreground">الحساب البنكي
            <input value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} className="w-full rounded-3xl border border-border bg-background px-4 py-3" />
          </label>
          <label className="space-y-2 text-sm text-foreground">رقم المرجع
            <input value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} className="w-full rounded-3xl border border-border bg-background px-4 py-3" />
          </label>
          <label className="space-y-2 text-sm text-foreground lg:col-span-2">ملاحظات
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full rounded-3xl border border-border bg-background px-4 py-3" />
          </label>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button type="submit" disabled={saving} className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white disabled:opacity-70">
            <Save className="h-4 w-4" />{saving ? "جاري الحفظ..." : editingId ? "تحديث" : "حفظ"}
          </button>
          {status ? <p className="text-sm text-muted">{status}</p> : null}
        </div>
      </form>

      <div className="data-card p-8">
        <h2 className="text-2xl font-semibold text-foreground">المقبوضات والمدفوعات</h2>
        <div className="mt-6 grid gap-3">
          {payments.length === 0 ? <p className="text-sm text-muted">لا توجد عمليات بعد.</p> : (
            payments.map((p) => (
              <div key={p.id} className="rounded-lg border border-border bg-background p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">{p.receiptNumber} — {p.customer.companyName || p.customer.name}</p>
                    <p className="text-xs text-muted">{formatDate(p.paymentDate)} • {p.amount.toFixed(2)} ر.س • {p.paymentMethod}</p>
                    {p.invoice ? <p className="text-xs text-muted">مرتبط بالفاتورة {p.invoice.invoiceNumber} (متبقٍ {p.invoice.balanceDue.toFixed(2)} ر.س)</p> : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => handleEdit(p)} className="rounded-full border border-primary px-3 py-1.5 text-xs font-semibold text-primary">تعديل</button>
                    <button type="button" onClick={() => handleDelete(p.id)} className="rounded-full border border-red-400 px-3 py-1.5 text-xs font-semibold text-red-600">حذف</button>
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
