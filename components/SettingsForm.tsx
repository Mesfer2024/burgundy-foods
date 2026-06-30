"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";

const initialState = {
  nameAr: "",
  nameEn: "",
  phone: "",
  email: "",
  address: "",
  tradeLicense: "",
  taxNumber: "",
  logoUrl: "",
  brandColor: "#7c1d34",
  description: "",
  vatEnabled: false,
  defaultVatRate: "15",
};

export default function SettingsForm() {
  const [settings, setSettings] = useState(initialState);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        const sanitized = Object.fromEntries(
          Object.entries(initialState).map(([key, fallback]) => {
            const value = (data as Record<string, unknown>)?.[key];
            if (typeof fallback === "boolean") return [key, typeof value === "boolean" ? value : fallback];
            return [key, value === null || value === undefined ? fallback : String(value)];
          }),
        ) as typeof initialState;
        setSettings(sanitized);
      })
      .catch(() => {
        setStatus("فشل تحميل البيانات، حاول إعادة تحميل الصفحة.");
      });
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus(null);
    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    if (response.ok) {
      setStatus("تم حفظ إعدادات الشركة بنجاح.");
    } else {
      setStatus("حدث خطأ، حاول مرة أخرى.");
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="data-card space-y-6 p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="space-y-2 text-sm text-foreground">
          اسم الشركة بالعربية
          <input
            value={settings.nameAr}
            onChange={(event) => setSettings({ ...settings, nameAr: event.target.value })}
            className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
          />
        </label>
        <label className="space-y-2 text-sm text-foreground">
          اسم الشركة بالإنجليزية
          <input
            value={settings.nameEn}
            onChange={(event) => setSettings({ ...settings, nameEn: event.target.value })}
            className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
          />
        </label>
        <label className="space-y-2 text-sm text-foreground">
          رقم الجوال
          <input
            value={settings.phone}
            onChange={(event) => setSettings({ ...settings, phone: event.target.value })}
            className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
          />
        </label>
        <label className="space-y-2 text-sm text-foreground">
          البريد الإلكتروني
          <input
            value={settings.email}
            onChange={(event) => setSettings({ ...settings, email: event.target.value })}
            type="email"
            className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
          />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="space-y-2 text-sm text-foreground">
          العنوان
          <input
            value={settings.address}
            onChange={(event) => setSettings({ ...settings, address: event.target.value })}
            className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
          />
        </label>
        <label className="space-y-2 text-sm text-foreground">
          السجل التجاري
          <input
            value={settings.tradeLicense}
            onChange={(event) => setSettings({ ...settings, tradeLicense: event.target.value })}
            className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
          />
        </label>
        <label className="space-y-2 text-sm text-foreground">
          الرقم الضريبي
          <input
            value={settings.taxNumber}
            onChange={(event) => setSettings({ ...settings, taxNumber: event.target.value })}
            className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
          />
        </label>
        <label className="space-y-2 text-sm text-foreground">
          رابط شعار الشركة
          <input
            value={settings.logoUrl}
            onChange={(event) => setSettings({ ...settings, logoUrl: event.target.value })}
            className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
          />
        </label>
      </div>

      <label className="space-y-2 text-sm text-foreground">
        اللون الأساسي للهوية
        <input
          type="color"
          value={settings.brandColor}
          onChange={(event) => setSettings({ ...settings, brandColor: event.target.value })}
          className="h-12 w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
        />
      </label>

      <label className="space-y-2 text-sm text-foreground">
        وصف الشركة
        <textarea
          value={settings.description}
          onChange={(event) => setSettings({ ...settings, description: event.target.value })}
          rows={4}
          className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
        />
      </label>

      <fieldset className="space-y-4 rounded-3xl border border-border bg-background p-5">
        <legend className="px-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary">إعدادات ضريبة القيمة المضافة</legend>
        <p className="text-xs text-muted">
          فعّل هذا الخيار فقط بعد تسجيل المؤسسة لضريبة القيمة المضافة لدى هيئة الزكاة والضريبة والجمارك.
          عند الإلغاء، ستظهر مستندات البيع بدون ضريبة ولن توحي بكونها فاتورة ضريبية.
        </p>
        <label className="flex items-start gap-3 text-sm text-foreground">
          <input
            type="checkbox"
            checked={settings.vatEnabled}
            onChange={(event) => setSettings({ ...settings, vatEnabled: event.target.checked })}
            className="mt-1 h-5 w-5 rounded border border-border text-primary focus:ring-primary"
          />
          <span>تفعيل ضريبة القيمة المضافة على عروض الأسعار وأوامر البيع والفواتير</span>
        </label>
        <label className="space-y-2 text-sm text-foreground">
          نسبة الضريبة الافتراضية (٪)
          <input
            type="number"
            min="0"
            step="0.01"
            value={settings.defaultVatRate}
            onChange={(event) => setSettings({ ...settings, defaultVatRate: event.target.value })}
            className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
          />
        </label>
      </fieldset>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
        </button>
        {status ? <p className="text-sm text-muted">{status}</p> : null}
      </div>
    </form>
  );
}
