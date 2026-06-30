"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Mail, Save } from "lucide-react";

export default function AccountEmailForm({ currentEmail }: { currentEmail: string }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [tone, setTone] = useState<"info" | "success" | "error">("info");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    setTone("info");

    if (!currentPassword) {
      setStatus("كلمة المرور الحالية مطلوبة.");
      setTone("error");
      return;
    }
    if (!newEmail.trim()) {
      setStatus("البريد الإلكتروني الجديد مطلوب.");
      setTone("error");
      return;
    }

    setSaving(true);
    const response = await fetch("/api/admin/account/email", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newEmail: newEmail.trim() }),
    });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      setStatus(data?.error ?? "تعذر تحديث البريد.");
      setTone("error");
      setSaving(false);
      return;
    }

    setStatus("تم تحديث البريد بنجاح. سيتم تسجيل خروجك خلال ثوانٍ، ثم سجل الدخول بالبريد الجديد.");
    setTone("success");
    setCurrentPassword("");
    setNewEmail("");

    // Give the user a moment to read the message, then bounce to sign-in.
    setTimeout(() => {
      void signOut({ callbackUrl: "/auth/signin" });
    }, 2500);
  }

  return (
    <form onSubmit={handleSubmit} className="data-card space-y-5 p-8">
      <div>
        <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-foreground">
          <Mail className="h-5 w-5 text-primary" aria-hidden="true" />
          تحديث بريد الدخول
        </h2>
        <p className="mt-2 text-sm text-muted">
          البريد الحالي: <span dir="ltr" className="font-semibold text-foreground">{currentEmail}</span>
        </p>
        <p className="mt-1 text-xs text-muted">
          بعد التحديث ستحتاج لتسجيل الدخول من جديد باستخدام البريد الجديد.
        </p>
      </div>

      <label className="space-y-2 text-sm text-foreground">
        كلمة المرور الحالية
        <input
          type="password"
          required
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
        />
      </label>

      <label className="space-y-2 text-sm text-foreground">
        البريد الإلكتروني الجديد
        <input
          type="email"
          required
          autoComplete="email"
          dir="ltr"
          value={newEmail}
          onChange={(event) => setNewEmail(event.target.value)}
          className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
        />
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          {saving ? "جاري التحديث..." : "تحديث البريد"}
        </button>
        {status ? (
          <p
            role={tone === "error" ? "alert" : "status"}
            className={
              tone === "success"
                ? "text-sm text-emerald-700"
                : tone === "error"
                ? "text-sm text-red-600"
                : "text-sm text-muted"
            }
          >
            {status}
          </p>
        ) : null}
      </div>
    </form>
  );
}
