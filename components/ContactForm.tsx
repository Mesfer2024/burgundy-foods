"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { useLocaleTheme } from "@/components/LocaleThemeProvider";

export default function ContactForm() {
  const { text } = useLocaleTheme();
  const forms = text.forms;
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus(null);
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (response.ok) {
      setStatus(forms.contactSuccess);
      setForm({ name: "", email: "", phone: "", message: "" });
    } else {
      setStatus(forms.formError);
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="data-card space-y-5 p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="space-y-2 text-sm text-foreground">
          {forms.name}
          <input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            type="text"
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
          {forms.phone}
          <input
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
            type="tel"
            required
            className="w-full rounded-3xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
          />
        </label>
      </div>
      <label className="space-y-2 text-sm text-foreground">
        {forms.message}
        <textarea
          value={form.message}
          onChange={(event) => setForm({ ...form, message: event.target.value })}
          rows={5}
          required
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
          {saving ? forms.sending : forms.sendMessage}
        </button>
        {status ? <p className="text-sm text-muted">{status}</p> : null}
      </div>
    </form>
  );
}
