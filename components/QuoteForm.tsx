"use client";

import { useState } from "react";
import { Boxes, PackagePlus, Send } from "lucide-react";
import { customerTypeOptions } from "@/lib/copy";
import { useLocaleTheme } from "@/components/LocaleThemeProvider";

export default function QuoteForm({
  products,
  selectedProductId,
}: {
  products: { id: string; nameAr: string; nameEn: string }[];
  selectedProductId?: string;
}) {
  const { text, locale, isArabic } = useLocaleTheme();
  const forms = text.forms;
  const customerTypes = customerTypeOptions[locale];
  const initialItems =
    selectedProductId && products.some((product) => product.id === selectedProductId)
      ? [{ id: selectedProductId, quantity: 1 }]
      : [];
  const [form, setForm] = useState({
    customerName: "",
    companyName: "",
    city: "",
    phone: "",
    email: "",
    customerType: customerTypes[0],
    notes: "",
  });
  const [selectedItems, setSelectedItems] = useState<{ id: string; quantity: number }[]>(initialItems);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function handleItemChange(productId: string, quantity: number) {
    setSelectedItems((items) => {
      if (quantity <= 0) {
        return items.filter((item) => item.id !== productId);
      }
      const existing = items.find((item) => item.id === productId);
      if (existing) {
        return items.map((item) => (item.id === productId ? { ...item, quantity } : item));
      }
      return [...items, { id: productId, quantity }];
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus(null);
    if (!selectedItems.length) {
      setStatus(forms.chooseProducts);
      setSaving(false);
      return;
    }
    const payload = {
      ...form,
      customerType: customerTypes.includes(form.customerType) ? form.customerType : customerTypes[0],
      items: selectedItems,
    };
    const response = await fetch("/api/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      setStatus(forms.quoteSuccess);
      setForm({ customerName: "", companyName: "", city: "", phone: "", email: "", customerType: customerTypes[0], notes: "" });
      setSelectedItems([]);
    } else {
      setStatus(forms.formError);
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="data-card space-y-6 p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="space-y-2 text-sm text-foreground">
          {forms.customerName}
          <input
            value={form.customerName}
            onChange={(event) => setForm({ ...form, customerName: event.target.value })}
            type="text"
            required
            className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
          />
        </label>
        <label className="space-y-2 text-sm text-foreground">
          {forms.companyName}
          <input
            value={form.companyName}
            onChange={(event) => setForm({ ...form, companyName: event.target.value })}
            type="text"
            className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
          />
        </label>
        <label className="space-y-2 text-sm text-foreground">
          {forms.city}
          <input
            value={form.city}
            onChange={(event) => setForm({ ...form, city: event.target.value })}
            type="text"
            required
            className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
          />
        </label>
        <label className="space-y-2 text-sm text-foreground">
          {forms.phone}
          <input
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
            type="tel"
            required
            className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
          />
        </label>
        <label className="space-y-2 text-sm text-foreground">
          {forms.email}
          <input
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            type="email"
            required
            className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
          />
        </label>
        <label className="space-y-2 text-sm text-foreground">
          {forms.customerType}
          <select
            value={customerTypes.includes(form.customerType) ? form.customerType : customerTypes[0]}
            onChange={(event) => setForm({ ...form, customerType: event.target.value })}
            className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
          >
            {customerTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="rounded-lg border border-border bg-background p-5">
        <h2 className="mb-4 inline-flex items-center gap-2 text-lg font-semibold text-foreground">
          <PackagePlus className="h-5 w-5 text-primary" aria-hidden="true" />
          {forms.requestedProducts}
        </h2>
        <div className="grid gap-4">
          {products.length === 0 ? <p className="text-sm text-muted">{forms.noProducts}</p> : null}
          {products.map((product) => {
            const selected = selectedItems.find((item) => item.id === product.id)?.quantity ?? 0;
            const productName = isArabic ? product.nameAr : product.nameEn || product.nameAr;
            return (
              <div key={product.id} className="grid gap-3 rounded-lg border border-border bg-white p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <p className="font-semibold text-foreground">{productName}</p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    value={selected}
                    onChange={(event) => handleItemChange(product.id, Number(event.target.value))}
                    className="w-28 rounded-3xl border border-border bg-background px-4 py-3 text-sm outline-none"
                  />
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted">
                    <Boxes className="h-4 w-4 text-primary" aria-hidden="true" />
                    {forms.cartonQty}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <label className="space-y-2 text-sm text-foreground">
        {forms.notes}
        <textarea
          value={form.notes}
          onChange={(event) => setForm({ ...form, notes: event.target.value })}
          rows={4}
          className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
        />
      </label>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
          {saving ? forms.sending : forms.sendQuote}
        </button>
        {status ? <p className="text-sm text-muted">{status}</p> : null}
      </div>
    </form>
  );
}
